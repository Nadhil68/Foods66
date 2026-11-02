/**
 * Request Validation Middleware using Zod
 * 
 * Provides reusable schemas and a middleware wrapper for validating
 * request bodies, query params, and route params.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import mongoose from 'mongoose';

// ── Validation Middleware ────────────────────────────────────

/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error on failure.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
      });
      return;
    }
    // Replace body with parsed (and coerced) data
    req.body = result.data;
    next();
  };
};

// ── Custom Zod Refinements ───────────────────────────────────

/** Validates a string as a valid MongoDB ObjectId */
const mongoId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ID format' }
);

// ── Schemas ──────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  healthProfile: z.object({
    hasIssues: z.boolean().optional(),
    age: z.union([z.number(), z.string()]).optional(),
    diseaseName: z.string().optional(),
    condition: z.string().optional(),
    stage: z.string().optional(),
    severity: z.string().optional(),
    medicines: z.string().optional(),
    medications: z.string().optional(),
    diagnosedBy: z.string().optional(),
    symptoms: z.string().optional(),
    dietaryMemo: z.string().optional(),
  }).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const createFoodSchema = z.object({
  name: z.string().min(1, 'Food name is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  price: z.number().min(1, 'Price must be at least ₹1').max(100000),
  category: z.string().min(1, 'Category is required').max(100),
  image: z.string().min(1, 'Image is required'),
  available: z.boolean().optional().default(true),
  stock: z.number().int().min(0).optional().default(100),
});

export const updateFoodSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.number().min(1).max(100000).optional(),
  category: z.string().min(1).max(100).optional(),
  image: z.string().optional().nullable(),
  available: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PLACED',
    'PAYMENT_PENDING',
    'PAID',
    'PAYMENT_CONFIRMED',
    'RESTAURANT_CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'ASSIGNED',
    'ACCEPTED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'FAILED'
  ]),
  note: z.string().max(500).optional().default(''),
});

export const feedbackSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().int().min(1).max(5),
  deliveryRating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().default(''),
});

export const couponCreateSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().max(500).optional().default(''),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY']),
  discountValue: z.number().min(0),
  minimumOrderAmount: z.number().min(0).optional().default(0),
  maximumDiscount: z.number().min(0).optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  usageLimit: z.number().int().min(1).optional().default(100),
  perUserLimit: z.number().int().min(1).optional().default(1),
  applicableCategories: z.array(z.string()).optional().default([]),
  applicableFoods: z.array(z.string()).optional().default([]),
});

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  healthProfile: z.object({
    diseaseName: z.string().optional(),
    dietaryMemo: z.string().optional(),
    stage: z.string().optional(),
    medicines: z.string().optional(),
    hasIssues: z.boolean().optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.string(),
    text: z.string(),
  })).optional().default([]),
});

export const reviewSchema = z.object({
  text: z.string().min(1, 'Review text is required').max(2000),
});

export { mongoId };
