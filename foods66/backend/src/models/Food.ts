import mongoose from 'mongoose';

export interface IFood {
  _id?: string;
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
}

/**
 * Generates a consistent image path from a food name.
 * Example: "Chicken Biryani" → "/uploads/foods/chicken-biryani.webp"
 */
export const generateFoodImagePath = (name: string): string => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `/uploads/foods/${slug}.webp`;
};

const FoodSchema = new mongoose.Schema<IFood>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  image: { type: String, required: true, default: '/uploads/foods/default.webp' },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 100 },
  isVegetarian: { type: Boolean, default: false },
  isRecommendedForHealth: { type: Boolean, default: false, index: true },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 25 },
  nutritionalInfo: {
    calories: { type: Number, default: 350 },
    protein: { type: Number, default: 12 },
    carbs: { type: Number, default: 45 },
    fat: { type: Number, default: 10 },
    sugar: { type: Number, default: 5 },
    sodium: { type: Number, default: 300 }
  },
  dietaryTags: [{ type: String }],
  healthTags: [{ type: String }]
}, { timestamps: true });

// Compound index for category and price
FoodSchema.index({ category: 1, price: 1 });

// Text index for search engine
FoodSchema.index({ name: 'text', description: 'text' });

export const Food = mongoose.model<IFood>('Food', FoodSchema);
