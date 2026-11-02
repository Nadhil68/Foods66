import Redis from 'ioredis';
// Connect to Redis. If unavailable, cache is simply bypassed — no crash, no spam.
export const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null, // give up immediately, no reconnect loop
});
redis.on('error', () => {
    // silently swallow connection errors so the server keeps running
});
export const getCache = async (key) => {
    if (redis.status !== 'ready')
        return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch {
        return null;
    }
};
export const setCache = async (key, value, ttlSeconds = 3600) => {
    if (redis.status !== 'ready')
        return;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
    catch {
        // ignore
    }
};
export const deleteCache = async (key) => {
    if (redis.status !== 'ready')
        return;
    try {
        await redis.del(key);
    }
    catch {
        // ignore
    }
};
//# sourceMappingURL=cacheService.js.map