/**
 * Request Validation Middleware using Zod
 *
 * Provides reusable schemas and a middleware wrapper for validating
 * request bodies, query params, and route params.
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error on failure.
 */
export declare const validateBody: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
/** Validates a string as a valid Document ID */
declare const mongoId: z.ZodString;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    healthProfile: z.ZodOptional<z.ZodObject<{
        hasIssues: z.ZodOptional<z.ZodBoolean>;
        age: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
        diseaseName: z.ZodOptional<z.ZodString>;
        condition: z.ZodOptional<z.ZodString>;
        stage: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodString>;
        medicines: z.ZodOptional<z.ZodString>;
        medications: z.ZodOptional<z.ZodString>;
        diagnosedBy: z.ZodOptional<z.ZodString>;
        symptoms: z.ZodOptional<z.ZodString>;
        dietaryMemo: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const createFoodSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    category: z.ZodString;
    image: z.ZodString;
    available: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    stock: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const updateFoodSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    image: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    available: z.ZodOptional<z.ZodBoolean>;
    stock: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PLACED: "PLACED";
        PAYMENT_PENDING: "PAYMENT_PENDING";
        PAID: "PAID";
        PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED";
        RESTAURANT_CONFIRMED: "RESTAURANT_CONFIRMED";
        PREPARING: "PREPARING";
        READY_FOR_PICKUP: "READY_FOR_PICKUP";
        ASSIGNED: "ASSIGNED";
        ACCEPTED: "ACCEPTED";
        PICKED_UP: "PICKED_UP";
        OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
        REFUNDED: "REFUNDED";
        FAILED: "FAILED";
    }>;
    note: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const feedbackSchema: z.ZodObject<{
    orderId: z.ZodString;
    rating: z.ZodNumber;
    deliveryRating: z.ZodNumber;
    comment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const couponCreateSchema: z.ZodObject<{
    code: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    discountType: z.ZodEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED_AMOUNT: "FIXED_AMOUNT";
        FREE_DELIVERY: "FREE_DELIVERY";
    }>;
    discountValue: z.ZodNumber;
    minimumOrderAmount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    maximumDiscount: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodString;
    usageLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    perUserLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    applicableCategories: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    applicableFoods: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const aiChatSchema: z.ZodObject<{
    message: z.ZodString;
    healthProfile: z.ZodOptional<z.ZodObject<{
        diseaseName: z.ZodOptional<z.ZodString>;
        dietaryMemo: z.ZodOptional<z.ZodString>;
        stage: z.ZodOptional<z.ZodString>;
        medicines: z.ZodOptional<z.ZodString>;
        hasIssues: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    history: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodString;
        text: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export declare const reviewSchema: z.ZodObject<{
    text: z.ZodString;
}, z.core.$strip>;
export { mongoId };
//# sourceMappingURL=validation.d.ts.map