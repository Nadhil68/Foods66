export declare class ObjectIdMock {
    private _str;
    constructor(id?: string | ObjectIdMock);
    toString(): string;
    toHexString(): string;
    valueOf(): string;
    toJSON(): string;
    equals(other: any): boolean;
    static isValid(val: any): boolean;
}
/** Recursively strips undefined keys so Firestore never rejects payloads */
export declare function removeUndefined<T>(obj: T): T;
export declare function getNestedValue(obj: any, path: string): any;
export declare function setNestedValue(obj: any, path: string, val: any): void;
export declare function matchesFilter(doc: any, filter: any): boolean;
export declare function applyUpdate(doc: any, update: any): any;
export declare class FirestoreDocument<T = any> {
    [key: string]: any;
    private _collectionName;
    _id: string;
    id: string;
    constructor(collectionName: string, data: any);
    save(): Promise<this>;
    toObject(): any;
    toJSON(): any;
}
export declare class QueryBuilder<T = any> implements PromiseLike<T> {
    private _collectionName;
    private _filter;
    private _sortObj;
    private _limitNum;
    private _skipNum;
    private _selectedFields;
    private _excludedFields;
    private _isLean;
    private _isSingle;
    constructor(collectionName: string, filter?: any, isSingle?: boolean);
    sort(sortObj: any): this;
    limit(n: number): this;
    skip(n: number): this;
    select(fields: string | string[]): this;
    lean(): this;
    populate(_path: any, _select?: any): this;
    exec(): Promise<T>;
    private projectDoc;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
}
export declare function createFirestoreModel<T = any>(collectionName: string): {
    new (data?: any): {
        [key: string]: any;
        _doc: FirestoreDocument<T>;
        save(): Promise</*elided*/ any>;
        toObject(): any;
        toJSON(): any;
    };
    get collectionName(): string;
    find(filter?: any): QueryBuilder<any[]>;
    findOne(filter?: any): QueryBuilder<any>;
    findById(id: any): QueryBuilder<any>;
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
//# sourceMappingURL=firestoreModel.d.ts.map