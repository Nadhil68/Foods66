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
export const STANDARD_DELIVERY_FEE = 40;

/** GST rate */
export const TAX_RATE = 0.05;

/** Surge pricing multiplier during rush hours */
export const SURGE_MULTIPLIER = 1.10;

/**
 * Check if the current time is during rush hours (lunch 12-2 PM, dinner 7-9 PM)
 */
export function isRushHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
}

/**
 * Apply dynamic pricing to a base price.
 */
export function applyDynamicPrice(basePrice: number, date?: Date): number {
  if (isRushHour(date)) {
    return Math.round(basePrice * SURGE_MULTIPLIER);
  }
  return basePrice;
}

/**
 * Calculate the complete price breakdown for an order.
 */
export function calculateOrderPricing(params: {
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
} {
  const { subtotal, discountAmount = 0, freeDelivery = false } = params;
  const deliveryFee = freeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const grandTotal = Math.max(0, taxableAmount + deliveryFee + tax);

  return {
    subtotal,
    deliveryFee,
    taxableAmount,
    tax,
    discountAmount,
    grandTotal,
  };
}
