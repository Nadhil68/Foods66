declare const router: import("express-serve-static-core").Router;
/**
 * Helper to calculate coupon discount on an order
 */
export declare const calculateCouponDiscount: (code: string, userId: string, items: Array<{
    foodId: string;
    quantity: number;
}> | number) => Promise<{
    isValid: boolean;
    coupon?: any;
    discountAmount: number;
    deliveryFeeDiscount: number;
    finalSubtotal: number;
    message?: string;
    code?: string;
}>;
export default router;
//# sourceMappingURL=coupons.d.ts.map