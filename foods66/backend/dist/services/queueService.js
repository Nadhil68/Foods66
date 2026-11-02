import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
let notificationQueue = null;
let notificationWorker = null;
// Only initialise BullMQ when Redis is actually reachable and not in serverless.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const redisHost = process.env.REDIS_HOST;
let bullRedis = null;
if (!isServerless && (redisHost || process.env.NODE_ENV !== 'production')) {
    bullRedis = new Redis({
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
}
(async () => {
    if (!bullRedis)
        return;
    try {
        await bullRedis.ping(); // will throw if Redis isn't up
        notificationQueue = new Queue('notifications', { connection: bullRedis });
        notificationWorker = new Worker('notifications', async (job) => {
            if (job.name === 'sendEmail') {
                console.log(`[Queue] Sending email to ${job.data.to}: ${job.data.subject}`);
                await new Promise((r) => setTimeout(r, 500));
                console.log(`[Queue] Email sent to ${job.data.to}`);
            }
        }, { connection: bullRedis });
        notificationWorker.on('failed', (job, err) => {
            console.error(`[Queue] Job ${job?.id} failed: ${err.message}`);
        });
        console.log('[Queue] BullMQ initialised successfully.');
    }
    catch {
        console.warn('[Queue] Redis unavailable — queue service disabled. Start Redis to enable background jobs.');
        bullRedis.disconnect();
    }
})();
export { notificationQueue, notificationWorker };
//# sourceMappingURL=queueService.js.map