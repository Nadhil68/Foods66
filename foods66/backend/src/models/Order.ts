import mongoose, { Document, Schema } from 'mongoose';

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

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
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
}

const OrderSchema = new Schema<IOrder>({
  userId: { type: String, required: true, index: true },
  restaurantId: { type: String, default: 'default_restaurant' },
  items: [{
    foodId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    category: { type: String },
    customization: { type: Schema.Types.Mixed }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 40, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  couponCode: { type: String, uppercase: true },
  totalPrice: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: [
      'PLACED',
      'PAYMENT_PENDING',
      'PAID',
      'PAYMENT_CONFIRMED',
      'RESTAURANT_CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'ASSIGNED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED'
    ],
    default: 'PLACED',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['CARD', 'COD', 'UPI'],
    default: 'CARD'
  },
  deliveryAddress: {
    doorNo: { type: String },
    landmark: { type: String },
    district: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    fullAddress: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  deliveryPartnerId: { type: String, index: true },
  deliveryPartnerName: { type: String },
  deliveryPartnerPhone: { type: String },
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    actor: { type: String, default: 'SYSTEM' }
  }],
  estimatedDeliveryTime: { type: Date },
  trackingLastUpdatedAt: { type: Date },
  specialInstructions: { type: String },
  idempotencyKey: { type: String },
  sessionId: { type: String, index: true },
  stripePaymentIntentId: { type: String }
}, {
  timestamps: true
});

// Indexes for high performance querying
OrderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ deliveryPartnerId: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
