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
export declare const Coupon: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<ICoupon>;
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
export default Coupon;
//# sourceMappingURL=Coupon.d.ts.map