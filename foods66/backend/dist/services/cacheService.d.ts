import Redis from 'ioredis';
export declare const redis: Redis;
export declare const getCache: (key: string) => Promise<any>;
export declare const setCache: (key: string, value: unknown, ttlSeconds?: number) => Promise<void>;
export declare const deleteCache: (key: string) => Promise<void>;
//# sourceMappingURL=cacheService.d.ts.map