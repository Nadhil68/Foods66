import mongoose, { Document, Schema } from 'mongoose';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

export interface ICouponUsage {
  userId: string;
  orderId: string;
  usedAt: Date;
  discountAmount: number;
}

export interface ICoupon extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit: number;
  perUserLimit: number;
  usedCount: number;
  active: boolean;
  applicableCategories: string[];
  applicableFoods: string[];
  restaurantId?: string;
  usedBy: ICouponUsage[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: { type: String, default: '' },
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'],
    required: true
  },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrderAmount: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, min: 0 },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 100, min: 1 },
  perUserLimit: { type: Number, default: 1, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true, index: true },
  applicableCategories: [{ type: String }],
  applicableFoods: [{ type: String }],
  restaurantId: { type: String },
  usedBy: [{
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    usedAt: { type: Date, default: Date.now },
    discountAmount: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

CouponSchema.index({ active: 1, expiryDate: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
