import { FoodItem, HealthProfile, FoodCategory } from '../types';

export interface HealthEvaluation {
  isUnhealthy: boolean;
  reason?: string;
  alternativeCategory?: string;
}

export const isFoodUnhealthyForUser = (
  food: FoodItem,
  profile: HealthProfile
): HealthEvaluation => {
  if (!profile || !profile.hasIssues) return { isUnhealthy: false };

  const foodName = food.name.toLowerCase();
  const memo = (profile.dietaryMemo || '').toLowerCase();
  
  // Use explicit disease check for robust fallbacks
  const legacyDisease = (profile.diseaseName || '').toLowerCase();
  const isDiabetes = legacyDisease.includes('diabetes');
  const isHeart = legacyDisease.includes('heart') || legacyDisease.includes('hypertension') || legacyDisease.includes('pressure');
  const isCKD = legacyDisease.includes('ckd') || legacyDisease.includes('kidney');
  const isAsthma = legacyDisease.includes('asthma');
  const isThyroid = legacyDisease.includes('thyroid');

  // Dynamic checks based on dietaryMemo (which comes from backend validation)
  
  // Thresholds
  const MAX_SUGAR_DIABETES = 15; // grams
  const MAX_SODIUM_HYPERTENSION = 600; // mg
  const MAX_FAT_HEART = 10; // grams
  
  // 1. Sugar & Carbs (Diabetes)
  if (memo.includes('sugar') || memo.includes('glycemic') || isDiabetes) {
    if (food.category === FoodCategory.DESSERT || foodName.includes('sweet') || foodName.includes('jamun') || food.healthTags?.includes('HIGH_SUGAR')) {
      return { isUnhealthy: true, reason: 'High sugar content may cause dangerous spikes in your blood sugar.', alternativeCategory: 'Healthy Combo' };
    }
    if (food.sugar !== undefined && food.sugar > MAX_SUGAR_DIABETES) {
      return { isUnhealthy: true, reason: `High sugar (${food.sugar}g > ${MAX_SUGAR_DIABETES}g limit) may worsen diabetes.`, alternativeCategory: 'Healthy Combo' };
    }
    if ((food.carbs || 0) > 60 || food.healthTags?.includes('HIGH_CARBS')) {
      return { isUnhealthy: true, reason: 'High carbohydrates may disrupt your glucose management.', alternativeCategory: 'Veg' };
    }
  }

  // 2. Sodium & Saturated Fats (Heart/Hypertension/CKD)
  if (memo.includes('sodium') || memo.includes('fat') || memo.includes('processed') || isHeart) {
    if (foodName.includes('fried') || foodName.includes('butter') || foodName.includes('ghee') || foodName.includes('pickle') || food.healthTags?.includes('HIGH_FAT') || food.healthTags?.includes('HIGH_SODIUM')) {
      return { isUnhealthy: true, reason: 'High saturated fat or sodium content can negatively impact your blood pressure and heart health.', alternativeCategory: 'Healthy Combo' };
    }
    if (food.sodium !== undefined && food.sodium > MAX_SODIUM_HYPERTENSION) {
      return { isUnhealthy: true, reason: `High sodium (${food.sodium}mg > ${MAX_SODIUM_HYPERTENSION}mg limit) can negatively impact blood pressure.`, alternativeCategory: 'Healthy Combo' };
    }
    if (food.fat !== undefined && food.fat > MAX_FAT_HEART) {
      return { isUnhealthy: true, reason: `High fat (${food.fat}g > ${MAX_FAT_HEART}g limit) can negatively impact heart health.`, alternativeCategory: 'Healthy Combo' };
    }
  }

  // 3. Potassium & Phosphorus (CKD)
  if (memo.includes('potassium') || memo.includes('phosphorus') || isCKD) {
    if (foodName.includes('potato') || foodName.includes('tomato') || foodName.includes('banana') || foodName.includes('cola')) {
      return { isUnhealthy: true, reason: 'Contains high potassium or phosphorus which is contraindicated for kidney disease.', alternativeCategory: 'Healthy Combo' };
    }
  }

  // 4. Sulfites & Allergens (Asthma)
  if (memo.includes('sulfite') || isAsthma) {
    if (foodName.includes('wine') || foodName.includes('pickle') || foodName.includes('dried')) {
      return { isUnhealthy: true, reason: 'May contain sulfites or histamines that can trigger asthma symptoms.', alternativeCategory: 'Healthy Combo' };
    }
  }

  // 5. Soy & Goitrogens (Thyroid)
  if (memo.includes('soy') || isThyroid) {
    if (foodName.includes('soy') || foodName.includes('tofu') || foodName.includes('cabbage') || foodName.includes('kale')) {
      return { isUnhealthy: true, reason: 'Contains soy or raw goitrogens which can interfere with thyroid medication.', alternativeCategory: 'Healthy Combo' };
    }
  }

  // Generic fallback for very low healthy_level
  const healthyLevel = profile.healthy_level?.toLowerCase() || 'high';
  if (healthyLevel === 'low' && food.calories && food.calories > 600) {
    return { isUnhealthy: true, reason: 'This item is very high in calories, conflicting with your strict low-calorie health profile.', alternativeCategory: 'Healthy Combo' };
  }

  return { isUnhealthy: false };
};
