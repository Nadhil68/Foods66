
import { FoodCategory, FoodItem, Ingredient, DietaryTag } from "./types";

export const PLACEHOLDER_IMAGE = "/images/food/default-food.webp";

/**
 * Helper to construct optimized Unsplash image URLs from an ID.
 */
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

/**
 * FOOD_IMAGE_MAP maps generic food terms to Unsplash Photo IDs.
 * 
 * ⚠️ IMPORTANT: When adding new images, you MUST verify the Unsplash ID is valid!
 * 1. Find an image on unsplash.com
 * 2. Extract the photo ID from the URL (e.g. photo-1546069901-ba9599a7e63c -> 1546069901-ba9599a7e63c)
 * 3. Before committing, run `npm run test:images` in the frontend directory to ensure the link returns a 200 OK.
 * 4. Fallback is handled automatically by `PLACEHOLDER_IMAGE` if a URL fails.
 */
export const FOOD_IMAGE_MAP: Record<string, string> = {
  // South Indian Veg
  'masala dosa':  U('1630383249896-424e482df921'),
  'dosa':         U('1630383249896-424e482df921'),
  'idli':         U('1606491956689-2ea866880c84'),
  'vada':         U('1606491956689-2ea866880c84'),
  'pongal':       U('1596797038530-2c107229654b'),
  'upma':         U('1645177628172-a94c1f96e6db'),
  'uttapam':      U('1630383249896-424e482df921'),
  'sambar':       U('1596797038530-2c107229654b'),
  'rasam':        U('1547592166-23ac45744acd'),
  'curd rice':    U('1596797038530-2c107229654b'),
  'lemon rice':   U('1596797038530-2c107229654b'),
  'veg meals':    U('1546069901-ba9599a7e63c'),
  'appam':        U('1630383249896-424e482df921'),
  'khichdi':      U('1596797038530-2c107229654b'),
  'chilla':       U('1630383249896-424e482df921'),
  'pesarattu':    U('1630383249896-424e482df921'),
  'thepla':       U('1626132647523-66f5bf380027'),
  'bhakri':       U('1626132647523-66f5bf380027'),

  // North Indian Veg
  'palak paneer':         U('1601050690597-df0568f70950'),
  'paneer butter masala': U('1601050690597-df0568f70950'),
  'paneer tikka':         U('1567188040759-fb8a883dc6d8'),
  'paneer':               U('1601050690597-df0568f70950'),
  'butter masala':        U('1603894584373-5ac82b2ae398'),
  'butter chicken':       U('1603894584373-5ac82b2ae398'),
  'chole bhature':        U('1626132647523-66f5bf380027'),
  'chole':                U('1626132647523-66f5bf380027'),
  'bhature':              U('1626132647523-66f5bf380027'),
  'pav bhaji':            U('1606491956689-2ea866880c84'),
  'rajma':                U('1547592166-23ac45744acd'),
  'aloo gobi':            U('1645177628172-a94c1f96e6db'),
  'aloo':                 U('1596797038530-2c107229654b'),
  'paratha':              U('1626132647523-66f5bf380027'),
  'naan':                 U('1626132647523-66f5bf380027'),
  'chapati':              U('1626132647523-66f5bf380027'),
  'roti':                 U('1626132647523-66f5bf380027'),
  'dal':                  U('1547592166-23ac45744acd'),
  'mushroom':             U('1547592166-23ac45744acd'),
  'gobi':                 U('1645177628172-a94c1f96e6db'),
  'manchurian':           U('1645177628172-a94c1f96e6db'),
  'korma':                U('1601050690597-df0568f70950'),
  'baingan':              U('1645177628172-a94c1f96e6db'),
  'bharta':               U('1645177628172-a94c1f96e6db'),
  'momos':                U('1534422298391-e4f8c172dddb'),

  // Biryani & Rice
  'chicken biryani': U('1563379091339-03b21ab4a4f8'),
  'mutton biryani':  U('1563379091339-03b21ab4a4f8'),
  'prawn biryani':   U('1563379091339-03b21ab4a4f8'),
  'egg biryani':     U('1563379091339-03b21ab4a4f8'),
  'veg biryani':     U('1563379091339-03b21ab4a4f8'),
  'biryani':         U('1563379091339-03b21ab4a4f8'),
  'fried rice':      U('1596797038530-2c107229654b'),
  'pulao':           U('1596797038530-2c107229654b'),
  'chawal':          U('1596797038530-2c107229654b'),
  'rice':            U('1596797038530-2c107229654b'),

  // Non-Veg
  'chicken shawarma': U('1529006557810-274b9b2fc783'),
  'chicken 65':       U('1567188040759-fb8a883dc6d8'),
  'grilled chicken':  U('1532550907401-a500c9a57435'),
  'grilled prawns':   U('1559737558-2f5a35f4523b'),
  'chicken tikka':    U('1567188040759-fb8a883dc6d8'),
  'tandoori chicken': U('1532550907401-a500c9a57435'),
  'chicken':          U('1532550907401-a500c9a57435'),
  'tandoori':         U('1532550907401-a500c9a57435'),
  'tikka':            U('1567188040759-fb8a883dc6d8'),
  'mutton curry':     U('1567188040759-fb8a883dc6d8'),
  'mutton chukka':    U('1574653853027-5382a3d23a15'),
  'mutton':           U('1574653853027-5382a3d23a15'),
  'keema':            U('1574653853027-5382a3d23a15'),
  'fish tacos':       U('1551504734-5ee1c4a1479b'),
  'fish fry':         U('1467003909585-2f8a72700288'),
  'fish curry':       U('1567188040759-fb8a883dc6d8'),
  'fish':             U('1467003909585-2f8a72700288'),
  'prawn masala':     U('1559737558-2f5a35f4523b'),
  'prawn':            U('1559737558-2f5a35f4523b'),
  'crab masala':      U('1559737558-2f5a35f4523b'),
  'crab':             U('1559737558-2f5a35f4523b'),
  'egg curry':        U('1482049016688-2d3e1b311543'),
  'boiled egg':       U('1482049016688-2d3e1b311543'),
  'egg':              U('1482049016688-2d3e1b311543'),
  'scrambled':        U('1510693206972-df098062cb71'),
  'omelette':         U('1510693206972-df098062cb71'),
  'shawarma':         U('1529006557810-274b9b2fc783'),
  'grilled fish':     U('1467003909585-2f8a72700288'),
  'grill':            U('1532550907401-a500c9a57435'),
  'bbq':              U('1529006557810-274b9b2fc783'),

  // Drinks
  'mango lassi':    U('1571934811356-5cc061b6821f'),
  'lassi':          U('1571934811356-5cc061b6821f'),
  'buttermilk':     U('1571934811356-5cc061b6821f'),
  'cold coffee':    U('1578314675249-a6910f80cc4e'),
  'coffee':         U('1509042239860-f550ce710b93'),
  'green tea':      U('1556881286-fc6915169721'),
  'lemon tea':      U('1556881286-fc6915169721'),
  'masala tea':     U('1571934811356-5cc061b6821f'),
  'tea':            U('1571934811356-5cc061b6821f'),
  'chai':           U('1571934811356-5cc061b6821f'),
  'watermelon':     U('1527661591475-527312dd65f5'),
  'sugarcane':      U('1622597467836-f3285f2131b8'),
  'aam panna':      U('1622597467836-f3285f2131b8'),
  'jaljeera':       U('1622597467836-f3285f2131b8'),
  'juice':          U('1622597467836-f3285f2131b8'),
  'coconut water':  U('1525385133512-2f3bdd039054'),
  'milkshake':      U('1572490122747-3968b75cc699'),
  'smoothie':       U('1553530666-ba11a7da3888'),
  'mojito':         U('1513558161293-cdaf765ed2fd'),
  'soda':           U('1527960471264-932f39eb5846'),
  'protein shake':  U('1553530666-ba11a7da3888'),

  // Coffee
  'filter coffee':   U('1495774856032-8b90bbb32b32'),
  'madras filter':   U('1495774856032-8b90bbb32b32'),
  'cappuccino':      U('1534778101976-62847782c213'),
  'latte':           U('1570968915860-54d5c301fa9f'),
  'cafe latte':      U('1570968915860-54d5c301fa9f'),
  'espresso':        U('1510591509098-f4fdc6d0ff04'),
  'mocha':           U('1578314675249-a6910f80cc4e'),
  'cafe mocha':      U('1578314675249-a6910f80cc4e'),
  'americano':       U('1551024601-bec78aea704b'),
  'macchiato':       U('1485808191679-5f86510681a2'),
  'caramel':         U('1485808191679-5f86510681a2'),
  'flat white':      U('1577968897966-3d4325b36b61'),
  'hazelnut':        U('1509042239860-f550ce710b93'),
  'frappe':          U('1461023058943-07fcbe16d735'),
  'affogato':        U('1509042239860-f550ce710b93'),
  'nitro':           U('1461023058943-07fcbe16d735'),
  'turkish':         U('1509042239860-f550ce710b93'),
  'ginger coffee':   U('1571934811356-5cc061b6821f'),
  'turmeric latte':  U('1571934811356-5cc061b6821f'),
  'vietnamese':      U('1461023058943-07fcbe16d735'),
  'cortado':         U('1510591509098-f4fdc6d0ff04'),
  'dalgona':         U('1461023058943-07fcbe16d735'),
  'bulletproof':     U('1509042239860-f550ce710b93'),
  'pumpkin spice':   U('1509042239860-f550ce710b93'),
  'vanilla frappe':  U('1461023058943-07fcbe16d735'),
  'chocolate coffee': U('1511381939415-e44015466834'),

  // Desserts
  'tender coconut ice cream': U('1501443762994-82bd5dace89a'),
  'ice cream':       U('1501443762994-82bd5dace89a'),
  'chocolate brownie': U('1606313564200-e75d5e30476c'),
  'brownie':         U('1606313564200-e75d5e30476c'),
  'chocolate cake':  U('1578985545062-69928b1d9587'),
  'cake':            U('1578985545062-69928b1d9587'),
  'gulab jamun':     U('1551024601-bec78aea704b'),
  'rasmalai':        U('1551024601-bec78aea704b'),
  'rasgulla':        U('1551024601-bec78aea704b'),
  'jalebi':          U('1551024601-bec78aea704b'),
  'kheer':           U('1551024601-bec78aea704b'),
  'payasam':         U('1551024601-bec78aea704b'),
  'halwa':           U('1551024601-bec78aea704b'),
  'falooda':         U('1572490122747-3968b75cc699'),
  'fruit salad':     U('1490474418585-ba9bad8fd0ea'),
  'pudding':         U('1501443762994-82bd5dace89a'),
  'parfait':         U('1501443762994-82bd5dace89a'),
  'chocolate':       U('1511381939415-e44015466834'),

  // Healthy & Gym
  'quinoa salad':    U('1512621776951-a57141f2eefd'),
  'quinoa':          U('1546069901-ba9599a7e63c'),
  'salad':           U('1512621776951-a57141f2eefd'),
  'bowl':            U('1546069901-ba9599a7e63c'),
  'soup':            U('1547592166-23ac45744acd'),
  'pumpkin soup':    U('1547592166-23ac45744acd'),
  'pumpkin':         U('1547592166-23ac45744acd'),
  'fruit':           U('1490474418585-ba9bad8fd0ea'),
  'protein':         U('1532550907401-a500c9a57435'),
  'protein smoothie': U('1553530666-ba11a7da3888'),
  'whey':            U('1553530666-ba11a7da3888'),
  'oatmeal':         U('1517673132405-a56a62b18caf'),
  'oat':             U('1517673132405-a56a62b18caf'),
  'sprouts bhel':    U('1512621776951-a57141f2eefd'),
  'sprouts':         U('1512621776951-a57141f2eefd'),
  'millet dosa':     U('1630383249896-424e482df921'),
  'millet':          U('1630383249896-424e482df921'),
  'brown rice':      U('1596797038530-2c107229654b'),
  'grilled':         U('1532550907401-a500c9a57435'),
  'sandwich':        U('1528735602780-2552fd46c7af'),
  'wrap':            U('1626700051175-6818013e1d4f'),
  'taco':            U('1551504734-5ee1c4a1479b'),
  'stew':            U('1547592166-23ac45744acd'),
  'chaat':           U('1601050690597-df0568f70950'),
  'pancakes':        U('1567620905732-2d1ec7ab7445'),
  'waffle':          U('1567620905732-2d1ec7ab7445'),
  'salmon':          U('1467003909585-2f8a72700288'),
  'tuna':            U('1467003909585-2f8a72700288'),
  'tofu':            U('1546069901-ba9599a7e63c'),
  'shrimp':          U('1559737558-2f5a35f4523b'),
  'turkey':          U('1532550907401-a500c9a57435'),
  'meatball':        U('1574653853027-5382a3d23a15'),
  'yogurt':          U('1501443762994-82bd5dace89a'),
  'makhana':         U('1517673132405-a56a62b18caf'),
  'avocado':         U('1523049673857-eb18f1d7b578'),
  'sweet potato':    U('1596797038530-2c107229654b'),
  'chickpea':        U('1512621776951-a57141f2eefd'),
  'corn':            U('1551754655-cd27e38d2076'),
  'coconut':         U('1525385133512-2f3bdd039054'),
  'granola':         U('1517673132405-a56a62b18caf'),
  'bruschetta':      U('1572695157366-5e585ab2b69f'),
  'ginger':          U('1571934811356-5cc061b6821f'),
  'turmeric':        U('1571934811356-5cc061b6821f'),
  'curry':           U('1567188040759-fb8a883dc6d8'),
  'masala':          U('1567188040759-fb8a883dc6d8'),
};

// Prioritize checking keys sorted by length (descending) ONCE to optimize repeated calls
// This ensures specific matches (e.g. "masala dosa") are found before generic ones (e.g. "dosa")
const SORTED_IMAGE_KEYS = Object.keys(FOOD_IMAGE_MAP).sort((a, b) => b.length - a.length);

/**
 * Returns the best-matching image URL for a given food name.
 * Checks FOOD_IMAGE_MAP using longest-key-first matching to ensure
 * specific names (e.g. "masala dosa") match before generic ones (e.g. "dosa").
 * Falls back to PLACEHOLDER_IMAGE if no match is found.
 */
export const getRelevantFoodImage = (name: string): string => {
  const nameLower = name.toLowerCase();
  for (const key of SORTED_IMAGE_KEYS) {
    if (nameLower.includes(key)) {
      return FOOD_IMAGE_MAP[key];
    }
  }
  return PLACEHOLDER_IMAGE;
};

