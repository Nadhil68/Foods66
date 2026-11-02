import { createFirestoreModel } from './firestoreModel';
/**
 * Generates a consistent image path from a food name.
 * Example: "Chicken Biryani" → "/uploads/foods/chicken-biryani.webp"
 */
export const generateFoodImagePath = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `/uploads/foods/${slug}.webp`;
};
export const Food = createFirestoreModel('foods');
export default Food;
//# sourceMappingURL=Food.js.map