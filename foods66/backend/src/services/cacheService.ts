/**
 * Cache Service - Redis (Optional)
 * In serverless environments or when REDIS_HOST is not set, cache safely no-ops without requiring ioredis.
 */

let redisInstance: any = null;
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const redisHost = process.env.REDIS_HOST;

// In-memory fallback cache for fast serverless reads
const memoryCache = new Map<string, { value: any; expiry: number }>();

(async () => {
  if (isServerless || (!redisHost && process.env.NODE_ENV === 'production')) {
    return;
  }
  try {
    const { default: Redis } = await import('ioredis');
    redisInstance = new Redis({
      host: redisHost || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    redisInstance.on('error', () => {
      // silently swallow connection errors
    });
  } catch {
    // ioredis unavailable, memoryCache will be used
  }
})();

export const getCache = async (key: string): Promise<any> => {
  if (redisInstance && redisInstance.status === 'ready') {
    try {
      const data = await redisInstance.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Memory cache fallback
  const cached = memoryCache.get(key);
  if (cached) {
    if (Date.now() > cached.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return cached.value;
  }
  return null;
};

export const setCache = async (key: string, value: unknown, ttlSeconds = 3600): Promise<void> => {
  if (redisInstance && redisInstance.status === 'ready') {
    try {
      await redisInstance.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch {
      // fallback
    }
  }

  // Memory cache fallback
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000
  });
};

export const deleteCache = async (key: string): Promise<void> => {
  if (redisInstance && redisInstance.status === 'ready') {
    try {
      await redisInstance.del(key);
    } catch {
      // ignore
    }
  }
  memoryCache.delete(key);
};

export const redis = redisInstance;
