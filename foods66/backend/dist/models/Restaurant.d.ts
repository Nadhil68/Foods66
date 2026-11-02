export interface IRestaurant {
    _id?: string;
    id?: string;
    userId: string;
    name: string;
    description: string;
    address: string;
    phone: string;
    rating: number;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    liveStatus: 'open' | 'closed';
    earnings: number;
    reviews?: {
        text: string;
        sentimentScore: number;
        date: Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
    save?: () => Promise<any>;
}
export declare const Restaurant: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<IRestaurant>;
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
export default Restaurant;
//# sourceMappingURL=Restaurant.d.ts.map