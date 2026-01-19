import pino from "pino";
import { closeQueues, logger } from "./queues/index.js";

// Import all workers to register them
import "./queues/vault-sync.js";
import "./queues/embed-chunks.js";
import "./queues/generate.js";
import "./queues/score.js";
import "./queues/publish.js";
import "./queues/metrics.js";

logger.info("Starting Viral Factory Worker");

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down workers");
  await closeQueues();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Keep process alive
logger.info("Workers started and listening for jobs");
