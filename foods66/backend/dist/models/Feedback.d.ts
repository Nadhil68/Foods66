export interface IFeedback {
    _id?: string;
    id?: string;
    orderId: string;
    userId: string;
    rating: number;
    deliveryRating: number;
    comment: string;
    createdAt: Date;
    updatedAt?: Date;
    save?: () => Promise<any>;
}
export declare const Feedback: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<IFeedback>;
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
export default Feedback;
//# sourceMappingURL=Feedback.d.ts.map