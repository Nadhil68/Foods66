import pkg from 'pg';
export declare const pgPool: pkg.Pool;
export declare const connectPostgres: () => Promise<boolean>;
export declare const pgQuery: (text: string, params?: any[]) => Promise<pkg.QueryResult<any>>;
//# sourceMappingURL=postgres.d.ts.map