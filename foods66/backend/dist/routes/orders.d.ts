import { OrderStatus } from '../models/Order';
declare const router: import("express-serve-static-core").Router;
export declare const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
/**
 * Validate if transitioning from current to target status is permitted
 */
export declare const isValidOrderTransition: (current: OrderStatus, target: OrderStatus) => boolean;
/**
 * Automatic Delivery Partner Assignment Service
 */
export declare const triggerAutoDeliveryAssignment: (orderId: string) => Promise<boolean>;
export default router;
//# sourceMappingURL=orders.d.ts.map