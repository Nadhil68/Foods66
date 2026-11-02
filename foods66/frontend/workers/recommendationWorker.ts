import { FoodItem, HealthProfile } from '../types';

import { FoodCategory } from '../types';

self.onmessage = (e: MessageEvent) => {
  const { healthProfile, pool: rawPool = [] } = e.data;
  
  if (!healthProfile) {
    self.postMessage([]);
    return;
  }

  const disease = healthProfile.diseaseName?.toLowerCase() || '';
  let pool: FoodItem[] = rawPool;
  pool = Array.from(new Map(pool.map(item => [item.id, item])).values());

  let items: FoodItem[] = [];
  let filterReason = '';

  if (disease.includes('diabetes') || disease.includes('sugar') || disease.includes('pcos')) {
      items = pool.filter(i => 
          i.category !== FoodCategory.DESSERT && 
          i.category !== FoodCategory.DRINKS && 
          !i.name.toLowerCase().includes('sweet') &&
          !i.name.toLowerCase().includes('chocolate') &&
          (i.carbs || 100) < 65 &&
          (i.dietaryTags?.includes('Low-Carb') || i.category === FoodCategory.HEALTHY_COMBO || (i.protein || 0) > 8)
      );
      filterReason = '(Diabetes Friendly)';
  } else if (disease.includes('heart') || disease.includes('bp') || disease.includes('pressure') || disease.includes('cholesterol')) {
      items = pool.filter(i => 
          !i.name.toLowerCase().includes('fry') &&
          !i.name.toLowerCase().includes('fried') &&
          !i.name.toLowerCase().includes('butter') &&
          !i.name.toLowerCase().includes('ghee') &&
          !i.name.toLowerCase().includes('pickle') && 
          (i.category === FoodCategory.HEALTHY_COMBO || i.category === FoodCategory.VEG || i.category === FoodCategory.GYM_COMBO)
      );
      filterReason = '(Heart Healthy)';
  } else if (disease.includes('weight') || disease.includes('obesity') || disease.includes('fat') || disease.includes('diet')) {
       items = pool.filter(i => 
           (i.calories || 1000) < 550 && 
           i.category !== FoodCategory.DESSERT &&
           !i.name.toLowerCase().includes('cream') &&
           !i.name.toLowerCase().includes('fry')
       );
       filterReason = '(Low Calorie)';
  } else if (disease.includes('gym') || disease.includes('muscle') || disease.includes('protein')) {
       items = pool.filter(i => 
           i.category === FoodCategory.GYM_COMBO || 
           (i.protein || 0) > 15
       );
       filterReason = '(High Protein)';
  } else if (disease.includes('ulcer') || disease.includes('gerd') || disease.includes('acid') || disease.includes('stomach')) {
      items = pool.filter(i => 
          !i.name.toLowerCase().includes('spicy') &&
          !i.name.toLowerCase().includes('chili') &&
          !i.name.toLowerCase().includes('pepper') &&
          !i.name.toLowerCase().includes('masala') &&
          i.category !== FoodCategory.COFFEE &&
          (i.category === FoodCategory.HEALTHY_COMBO || i.name.toLowerCase().includes('curd') || i.name.toLowerCase().includes('idli') || i.name.toLowerCase().includes('soup'))
      );
      filterReason = '(Gut Friendly)';
  } else {
      items = pool.filter(i => i.isRecommendedForHealth);
      filterReason = '(General Wellness)';
  }

  if (items.length < 6) {
      const fillers = pool.filter(i => 
          (i.isRecommendedForHealth || i.category === FoodCategory.HEALTHY_COMBO) && 
          !items.some(existing => existing.id === i.id) &&
          i.category !== FoodCategory.DESSERT
      );
      const shuffledFillers = fillers.sort(() => 0.5 - Math.random());
      items = [...items, ...shuffledFillers.slice(0, 10 - items.length)];
  }

  const result = items.sort(() => 0.5 - Math.random()).slice(0, 15).map(item => ({
      ...item,
      description: `[Offline Recommendation] ${filterReason} ${item.description}` 
  }));

  self.postMessage(result);
};
