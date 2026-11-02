export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';
export interface IUser {
    _id: string;
    id?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    address?: string;
    rewardPoints: number;
    vehicle?: 'Bike' | 'Scooter' | 'Electric Bike' | 'Car';
    availability?: boolean;
    currentLocation?: {
        type: 'Point';
        coordinates: [number, number];
    };
    activeOrders?: number;
    rating?: number;
    isSuspended?: boolean;
    deliveryArea?: string;
    healthProfile?: {
        hasIssues: boolean;
        age?: number;
        diseaseName?: string;
        condition?: string;
        stage?: string;
        severity?: string;
        medicines?: string;
        medications?: string;
        diagnosedBy?: string;
        symptoms?: string;
        dietaryMemo?: string;
        validatedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    save?: () => Promise<any>;
}
export declare const User: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<IUser>;
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
export default User;
//# sourceMappingURL=User.d.ts.map