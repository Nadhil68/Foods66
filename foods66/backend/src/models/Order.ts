import { createFirestoreModel } from './firestoreModel';

export type OrderStatus = 
  | 'PLACED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PAYMENT_CONFIRMED'
  | 'RESTAURANT_CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'CARD' | 'COD' | 'UPI';

export interface IOrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  customization?: any;
}

export interface IOrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  actor?: string; // 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY_PARTNER' | 'SYSTEM' | 'ADMIN'
}

export interface IOrder {
  _id: string;
  id?: string;
  userId: string;
  restaurantId?: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discountAmount: number;
  couponCode?: string;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: {
    doorNo?: string;
    landmark?: string;
    district?: string;
    city?: string;
    state?: string;
    pincode?: string;
    fullAddress: string;
    lat?: number;
    lng?: number;
  };
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  timeline: IOrderTimeline[];
  estimatedDeliveryTime?: Date;
  trackingLastUpdatedAt?: Date;
  specialInstructions?: string;
  idempotencyKey?: string;
  sessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
  save?: () => Promise<any>;
}

export const Order = createFirestoreModel<IOrder>('orders');
export default Order;
