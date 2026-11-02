/**
 * Centralized Pricing Service for Foods66
 *
 * SECURITY: All price calculations MUST go through this service.
 * Never trust frontend-provided prices, taxes, or delivery fees.
 *
 * This is the single source of truth for:
 * - Dynamic (surge) pricing
 * - Tax calculation
 * - Delivery fee calculation
 * - Discount application
 */
/** Standard delivery fee in ₹ */
export declare const STANDARD_DELIVERY_FEE = 40;
/** GST rate */
export declare const TAX_RATE = 0.05;
/** Surge pricing multiplier during rush hours */
export declare const SURGE_MULTIPLIER = 1.1;
/**
 * Check if the current time is during rush hours (lunch 12-2 PM, dinner 7-9 PM)
 */
export declare function isRushHour(date?: Date): boolean;
/**
 * Apply dynamic pricing to a base price.
 */
export declare function applyDynamicPrice(basePrice: number, date?: Date): number;
/**
 * Calculate the complete price breakdown for an order.
 */
export declare function calculateOrderPricing(params: {
    subtotal: number;
    discountAmount?: number;
    freeDelivery?: boolean;
}): {
    subtotal: number;
    deliveryFee: number;
    taxableAmount: number;
    tax: number;
    discountAmount: number;
    grandTotal: number;
};
//# sourceMappingURL=pricingService.d.ts.map