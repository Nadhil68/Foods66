export interface IFood {
    _id?: string;
    id?: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    available: boolean;
    stock: number;
    isVegetarian?: boolean;
    isRecommendedForHealth?: boolean;
    rating?: number;
    reviewsCount?: number;
    nutritionalInfo?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        sugar?: number;
        sodium?: number;
    };
    dietaryTags?: string[];
    healthTags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    save?: () => Promise<any>;
}
/**
 * Generates a consistent image path from a food name.
 * Example: "Chicken Biryani" → "/uploads/foods/chicken-biryani.webp"
 */
export declare const generateFoodImagePath: (name: string) => string;
export declare const Food: {
    new (data?: any): {
        [key: string]: any;
        _doc: import("./firestoreModel").FirestoreDocument<IFood>;
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
export default Food;
//# sourceMappingURL=Food.d.ts.map