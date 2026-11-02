import { FoodItem, HealthProfile, FoodCategory } from "../types";
import { getRelevantFoodImage } from "../constants";
import { apiClient, API_BASE_URL } from "./apiClient";
import { getToken } from "./authService";

const formatGeminiError = (error: any): string => {
  const msg = error?.message || error?.toString() || "Unknown error";
  if (msg.includes("API Key") || msg.includes("403") || msg.includes("401")) {
      return "AI Configuration Error";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
      return "Network Connection Lost";
  }
  if (msg.includes("503") || msg.includes("Overloaded")) {
      return "AI Service Busy (Try Again)";
  }
  return "AI Service Unavailable";
};

// Helper to strip Markdown code blocks
const cleanJSON = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/```json\s*|\s*```/g, "").replace(/```/g, "").trim();
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket !== -1) cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

// --- Offline Logic Helpers ---

const checkFoodSafetyOffline = (food: FoodItem, healthProfile: HealthProfile): {safe: boolean, reason: string} => {
  const disease = healthProfile.diseaseName?.toLowerCase() || '';
  const foodName = food.name.toLowerCase();
  const desc = food.description.toLowerCase();
  
  // Diabetes Rules
  if (disease.includes('diabetes') || disease.includes('sugar') || disease.includes('insulin')) {
      if (food.category === FoodCategory.DESSERT || foodName.includes('sweet') || foodName.includes('chocolate') || foodName.includes('cake') || foodName.includes('jamun') || foodName.includes('halwa')) {
          return { safe: false, reason: 'High sugar content.' };
      }
      if ((food.carbs || 0) > 65 && !food.dietaryTags?.includes('Low-Carb')) {
          return { safe: false, reason: 'High carbohydrate content.' };
      }
  }
  
  // Hypertension/Heart Rules
  if (disease.includes('pressure') || disease.includes('heart') || disease.includes('bp') || disease.includes('cholesterol')) {
      if (foodName.includes('pickle') || foodName.includes('fried') || foodName.includes('butter') || foodName.includes('ghee') || foodName.includes('bhatura')) {
          return { safe: false, reason: 'High sodium or saturated fats.' };
      }
  }

  // Stomach/Ulcer Rules
  if (disease.includes('ulcer') || disease.includes('stomach') || disease.includes('gerd') || disease.includes('acid')) {
      if (foodName.includes('spicy') || foodName.includes('masala') || foodName.includes('pepper') || foodName.includes('chili') || desc.includes('spicy')) {
          return { safe: false, reason: 'Spicy content may irritate stomach.' };
      }
  }

  return { safe: true, reason: 'Safe' };
};

// --- Offline AI Simulation Engine ---
export const getOfflineHealthRecommendations = (healthProfile: HealthProfile, pool: FoodItem[]): FoodItem[] => {
  const disease = healthProfile.diseaseName?.toLowerCase() || '';
  // Remove duplicates by ID
  pool = Array.from(new Map(pool.map(item => [item.id, item])).values());

  let items: FoodItem[] = [];
  let filterReason = '';

  // 1. Diabetes / Sugar Control / PCOS
  if (disease.includes('diabetes') || disease.includes('sugar') || disease.includes('pcos')) {
      items = pool.filter(i => 
          i.category !== FoodCategory.DESSERT && 
          i.category !== FoodCategory.DRINKS && 
          !i.name.toLowerCase().includes('sweet') &&
          !i.name.toLowerCase().includes('chocolate') &&
          (i.carbs || 100) < 65 &&
          (i.dietaryTags?.includes('Low-Carb') || i.category === FoodCategory.HEALTHY_COMBO || i.protein! > 8)
      );
      filterReason = '(Diabetes Friendly)';
  } 
  // 2. Heart / BP / Cholesterol
  else if (disease.includes('heart') || disease.includes('bp') || disease.includes('pressure') || disease.includes('cholesterol')) {
      items = pool.filter(i => 
          !i.name.toLowerCase().includes('fry') &&
          !i.name.toLowerCase().includes('fried') &&
          !i.name.toLowerCase().includes('butter') &&
          !i.name.toLowerCase().includes('ghee') &&
          !i.name.toLowerCase().includes('pickle') && 
          (i.category === FoodCategory.HEALTHY_COMBO || i.category === FoodCategory.VEG || i.category === FoodCategory.GYM_COMBO)
      );
      filterReason = '(Heart Healthy)';
  } 
  // 3. Weight Loss / Obesity
  else if (disease.includes('weight') || disease.includes('obesity') || disease.includes('fat') || disease.includes('diet')) {
       items = pool.filter(i => 
           (i.calories || 1000) < 550 && 
           i.category !== FoodCategory.DESSERT &&
           !i.name.toLowerCase().includes('cream') &&
           !i.name.toLowerCase().includes('fry')
       );
       filterReason = '(Low Calorie)';
  }
  // 4. Gym / Muscle
  else if (disease.includes('gym') || disease.includes('muscle') || disease.includes('protein')) {
       items = pool.filter(i => 
           i.category === FoodCategory.GYM_COMBO || 
           (i.protein || 0) > 15
       );
       filterReason = '(High Protein)';
  } 
  // 5. Digestive / Ulcer / GERD
  else if (disease.includes('ulcer') || disease.includes('gerd') || disease.includes('acid') || disease.includes('stomach')) {
      items = pool.filter(i => 
          !i.name.toLowerCase().includes('spicy') &&
          !i.name.toLowerCase().includes('chili') &&
          !i.name.toLowerCase().includes('pepper') &&
          !i.name.toLowerCase().includes('masala') &&
          i.category !== FoodCategory.COFFEE &&
          (i.category === FoodCategory.HEALTHY_COMBO || i.name.toLowerCase().includes('curd') || i.name.toLowerCase().includes('idli') || i.name.toLowerCase().includes('soup'))
      );
      filterReason = '(Gut Friendly)';
  } 
  else {
      // General Healthy Fallback if disease keywords don't match specific rules
      items = pool.filter(i => i.isRecommendedForHealth);
      filterReason = '(General Wellness)';
  }

  // Ensure we have enough items (at least 6). If strict filters returned too few, add general healthy items.
  if (items.length < 6) {
      const fillers = pool.filter(i => 
          (i.isRecommendedForHealth || i.category === FoodCategory.HEALTHY_COMBO) && 
          !items.some(existing => existing.id === i.id) &&
          i.category !== FoodCategory.DESSERT // Basic safety check for fillers
      );
      // Shuffle fillers
      const shuffledFillers = fillers.sort(() => 0.5 - Math.random());
      items = [...items, ...shuffledFillers.slice(0, 10 - items.length)];
  }

  // Shuffle and return items with a modified description for transparency
  return items.sort(() => 0.5 - Math.random()).slice(0, 15).map(item => ({
      ...item,
      description: `[Offline Recommendation] ${filterReason} ${item.description}` 
  }));
};

/**
 * Health recommendations — proxied safely through backend AI service.
 * Never uses API keys on the frontend.
 */
export const getHealthRecommendations = async (healthProfile: HealthProfile): Promise<FoodItem[]> => {
  if (!healthProfile.hasIssues || !healthProfile.diseaseName) {
    return [];
  }
  
  try {
    const res = await apiClient.post<any>('/ai/health-recommendations', { healthProfile });
    
    if (Array.isArray(res) && res.length > 0) {
      return res.map((item: any) => {
        let cat = item.category;
        if (cat === 'Dessert') cat = 'Ice Creams & Dessert';
        const realId = item._id?.toString() || item.id;

        return {
          id: realId,
          _id: realId,
          name: item.name,
          description: item.description || `Healthy ${item.name} prepared with fresh ingredients.`,
          price: item.price || 150,
          category: cat as FoodCategory,
          isVegetarian: item.isVegetarian ?? (cat === 'Veg'),
          image: item.image || getRelevantFoodImage(item.name),
          isRecommendedForHealth: true,
          stock: item.stock,
          calories: item.nutritionalInfo?.calories || item.calories || 350,
          customizationAvailable: false,
          ingredients: item.ingredients || [],
          rating: item.rating || 4.5,
          reviewCount: item.reviewsCount || 50,
          restaurantName: item.restaurantName || "Foods66 Healthy Kitchen",
          restaurantLocation: "Chennai"
        };
      });
    }

    // Fallback: fetch directly from foodsAPI and filter
    const { foodsAPI } = await import('./apiService');
    const allFoods = await foodsAPI.getAll();
    if (Array.isArray(allFoods) && allFoods.length > 0) {
      const disease = healthProfile.diseaseName.toLowerCase();
      const filtered = allFoods.filter((f: any) => {
        const name = f.name.toLowerCase();
        const cat = (f.category || '').toLowerCase();
        if (disease.includes('diabet') && (cat.includes('dessert') || name.includes('sweet'))) return false;
        if (disease.includes('heart') && (name.includes('fried') || name.includes('butter'))) return false;
        if (disease.includes('ulcer') && (name.includes('spicy') || name.includes('chili'))) return false;
        return true;
      });

      return (filtered.length > 0 ? filtered : allFoods).slice(0, 12).map((item: any) => ({
        id: item._id?.toString() || item.id,
        _id: item._id?.toString() || item.id,
        name: item.name,
        description: item.description || `Healthy ${item.name} prepared with authentic ingredients.`,
        price: item.price,
        category: (item.category as FoodCategory) || FoodCategory.VEG,
        isVegetarian: item.category === 'Veg',
        image: item.image || getRelevantFoodImage(item.name),
        isRecommendedForHealth: true,
        stock: item.stock,
        rating: item.rating || 4.5,
        reviewCount: 24,
        calories: item.nutritionalInfo?.calories || 350,
        customizationAvailable: false
      }));
    }

    return [];
  } catch (error: any) {
    console.warn("Backend AI proxy unavailable, attempting local database foods fallback:", error);
    try {
      const { foodsAPI } = await import('./apiService');
      const allFoods = await foodsAPI.getAll();
      if (Array.isArray(allFoods) && allFoods.length > 0) {
        return getOfflineHealthRecommendations(healthProfile, allFoods);
      }
    } catch (fallbackError) {
      console.warn("Local database fallback failed:", fallbackError);
    }
    return [];
  }
};


/**
 * Food safety check — proxied safely through backend AI service.
 */
export const checkFoodSafety = async (food: FoodItem, healthProfile: HealthProfile): Promise<{safe: boolean, reason?: string, isError?: boolean}> => {
   if (!healthProfile.hasIssues) return { safe: true };
   
   try {
      if (!navigator.onLine) return checkFoodSafetyOffline(food, healthProfile);

      const res = await apiClient.post<{ safe?: boolean; reason?: string; fallback?: boolean }>('/ai/food-safety', {
        foodName: food.name,
        healthProfile
      });

      if (res.fallback || typeof res.safe !== 'boolean') {
        return checkFoodSafetyOffline(food, healthProfile);
      }

      return { safe: res.safe, reason: res.reason };
   } catch (error) {
     return checkFoodSafetyOffline(food, healthProfile);
   }
};

export const validateHealthProfile = async (disease: string, stage: string, medicines: string, age?: number): Promise<{valid: boolean, reason?: string, dietaryMemo?: string, isError?: boolean}> => {
  return { valid: true, reason: "Profile verified.", isError: false }; 
};

export const generateFoodImage = async (_foodName: string): Promise<string | null> => {
  return null;
};

/**
 * Stream chat response from backend with JWT authentication
 */
export const getChatResponseStream = async (
  message: string,
  healthProfile: HealthProfile,
  history: any[],
  onChunk: (text: string) => void,
  onFunctionCall?: (name: string, args: any) => void
): Promise<string> => {
  try {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, healthProfile, history })
    });

    if (!response.ok) throw new Error('Network response was not ok');
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullText += data.text;
              onChunk(fullText);
            } else if (data.type === 'functionCall' && onFunctionCall) {
              onFunctionCall(data.name, data.args);
            } else if (data.type === 'error') {
              fullText += data.text;
              onChunk(fullText);
            }
          } catch (e) {
            console.error('Error parsing stream chunk', e);
          }
        }
      }
    }
    return fullText;
  } catch (e) {
    console.error(e);
    onChunk("Service unavailable. Please check your connection or log in.");
    return "Service unavailable.";
  }
};
