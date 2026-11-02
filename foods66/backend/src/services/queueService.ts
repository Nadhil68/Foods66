/**
 * Queue Service - BullMQ with Redis
 * In serverless environments (e.g. Vercel), queues are disabled to avoid hanging sockets.
 */

let notificationQueue: any = null;
let notificationWorker: any = null;

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const redisHost = process.env.REDIS_HOST;

(async () => {
  // Never attempt BullMQ or Redis in serverless or if REDIS_HOST is absent in production
  if (isServerless || (!redisHost && process.env.NODE_ENV === 'production')) {
    return;
  }

  try {
    const { Queue, Worker } = await import('bullmq');
    const { default: Redis } = await import('ioredis');

    const bullRedis = new Redis({
      host: redisHost || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    bullRedis.on('error', () => {
      // silence repeated ECONNREFUSED noise
    });

    await bullRedis.ping();
    notificationQueue = new Queue('notifications', { connection: bullRedis });

    notificationWorker = new Worker(
      'notifications',
      async (job: any) => {
        if (job.name === 'sendEmail') {
          console.log(`[Queue] Sending email to ${job.data.to}: ${job.data.subject}`);
          await new Promise((r) => setTimeout(r, 500));
          console.log(`[Queue] Email sent to ${job.data.to}`);
        }
      },
      { connection: bullRedis }
    );

    notificationWorker.on('failed', (job: any, err: any) => {
      console.error(`[Queue] Job ${job?.id} failed: ${err.message}`);
    });

    console.log('[Queue] BullMQ initialised successfully.');
  } catch {
    // Redis or BullMQ unavailable, queue stays null
  }
})();

export { notificationQueue, notificationWorker };
