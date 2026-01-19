import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import pino from "pino";

const logger = pino({ name: "worker" });

// Redis connection
const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Queue names
export const QUEUE_NAMES = {
  VAULT_SYNC: "vaultSync",
  EMBED_CHUNKS: "embedChunks",
  GENERATE_IDEAS: "generateIdeas",
  GENERATE_ASSETS: "generateAssets",
  SCORE_ASSETS: "scoreAssets",
  REWRITE_LOW_SCORE: "rewriteLowScore",
  SCHEDULE: "schedule",
  PUBLISH: "publish",
  METRICS_SYNC: "metricsSync",
  PATTERN_MINING: "patternMining",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Create queues
export const queues: Record<QueueName, Queue> = {
  [QUEUE_NAMES.VAULT_SYNC]: new Queue(QUEUE_NAMES.VAULT_SYNC, { connection }),
  [QUEUE_NAMES.EMBED_CHUNKS]: new Queue(QUEUE_NAMES.EMBED_CHUNKS, { connection }),
  [QUEUE_NAMES.GENERATE_IDEAS]: new Queue(QUEUE_NAMES.GENERATE_IDEAS, { connection }),
  [QUEUE_NAMES.GENERATE_ASSETS]: new Queue(QUEUE_NAMES.GENERATE_ASSETS, { connection }),
  [QUEUE_NAMES.SCORE_ASSETS]: new Queue(QUEUE_NAMES.SCORE_ASSETS, { connection }),
  [QUEUE_NAMES.REWRITE_LOW_SCORE]: new Queue(QUEUE_NAMES.REWRITE_LOW_SCORE, { connection }),
  [QUEUE_NAMES.SCHEDULE]: new Queue(QUEUE_NAMES.SCHEDULE, { connection }),
  [QUEUE_NAMES.PUBLISH]: new Queue(QUEUE_NAMES.PUBLISH, { connection }),
  [QUEUE_NAMES.METRICS_SYNC]: new Queue(QUEUE_NAMES.METRICS_SYNC, { connection }),
  [QUEUE_NAMES.PATTERN_MINING]: new Queue(QUEUE_NAMES.PATTERN_MINING, { connection }),
};

// Helper to add jobs
export async function addJob<T>(
  queueName: QueueName,
  data: T,
  options?: { delay?: number; priority?: number }
) {
  const queue = queues[queueName];
  const job = await queue.add(queueName, data, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
  logger.info({ queueName, jobId: job.id }, "Job added to queue");
  return job;
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all(Object.values(queues).map((q) => q.close()));
  await connection.quit();
  logger.info("All queues closed");
}

export { connection, logger };
