import { createFirestoreModel } from './firestoreModel';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

export interface ICouponUsage {
  userId: string;
  orderId: string;
  usedAt: Date;
  discountAmount: number;
}

export interface ICoupon {
  _id: string;
  id?: string;
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
  save?: () => Promise<any>;
}

export const Coupon = createFirestoreModel<ICoupon>('coupons');
export default Coupon;
