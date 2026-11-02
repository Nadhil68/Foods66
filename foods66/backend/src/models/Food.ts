import { createFirestoreModel } from './firestoreModel';

export interface IFood {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  stock: number;
  isVegetarian?: boolean;
  isRecommendedForHealth?: boolean;
  rating?: number;
  reviewsCount?: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    sodium?: number;
  };
  dietaryTags?: string[];
  healthTags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  save?: () => Promise<any>;
}

/**
 * Generates a consistent image path from a food name.
 * Example: "Chicken Biryani" → "/uploads/foods/chicken-biryani.webp"
 */
export const generateFoodImagePath = (name: string): string => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `/uploads/foods/${slug}.webp`;
};

export const Food = createFirestoreModel<IFood>('foods');
export default Food;
