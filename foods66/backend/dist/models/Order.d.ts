export type OrderStatus = 'PLACED' | 'PAYMENT_PENDING' | 'PAID' | 'PAYMENT_CONFIRMED' | 'RESTAURANT_CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
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
    actor?: string;
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
export declare const Order: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<IOrder>;
        save(): Promise</*elided*/ any>;
        toObject(): any;
        toJSON(): any;
    };
    get collectionName(): string;
    find(filter?: any): import("./firestoreModel").QueryBuilder<any[]>;
    findOne(filter?: any): import("./firestoreModel").QueryBuilder<any>;
    findById(id: any): import("./firestoreModel").QueryBuilder<any>;
    findByIdAndUpdate(id: any, update: any, options?: {
        new?: boolean;
        runValidators?: boolean;
        sort?: any;
    }): any;
    findOneAndUpdate(filter: any, update: any, options?: {
        new?: boolean;
        upsert?: boolean;
        runValidators?: boolean;
        sort?: any;
    }): any;
    findByIdAndDelete(id: any): Promise<any>;
    findOneAndDelete(filter: any): Promise<any>;
    create(data: any | any[]): Promise<any>;
    insertMany(data: any[]): Promise<any[]>;
    deleteMany(filter?: any): Promise<{
        deletedCount: number;
    }>;
    deleteOne(filter?: any): Promise<{
        deletedCount: number;
    }>;
    updateMany(filter: any, update: any): Promise<{
        modifiedCount: number;
    }>;
    countDocuments(filter?: any): Promise<number>;
    aggregate(pipeline: any[]): Promise<any[]>;
};
export default Order;
//# sourceMappingURL=Order.d.ts.map