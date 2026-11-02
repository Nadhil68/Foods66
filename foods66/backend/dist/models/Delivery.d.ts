export type DeliveryStatus = 'AVAILABLE' | 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
export interface IDeliveryTimeline {
    status: DeliveryStatus;
    timestamp: Date;
    note?: string;
}
export interface IDelivery {
    _id: string;
    id?: string;
    orderId: string;
    deliveryPartnerId?: string;
    deliveryPartnerName?: string;
    deliveryPartnerPhone?: string;
    status: DeliveryStatus;
    pickupLocation?: {
        name?: string;
        address?: string;
        coordinates?: [number, number];
    };
    dropLocation?: {
        name?: string;
        address?: string;
        coordinates?: [number, number];
    };
    currentLocation?: {
        type: 'Point';
        coordinates: [number, number];
    };
    assignedAt?: Date;
    acceptedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    rejectedBy?: string[];
    eta?: Date;
    distance?: string;
    timeline: IDeliveryTimeline[];
    createdAt: Date;
    updatedAt: Date;
    save?: () => Promise<any>;
}
export declare const Delivery: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<IDelivery>;
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
export default Delivery;
//# sourceMappingURL=Delivery.d.ts.map