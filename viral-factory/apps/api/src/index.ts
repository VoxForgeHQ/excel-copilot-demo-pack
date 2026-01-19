import Fastify from "fastify";
import cors from "@fastify/cors";
import { vaultRoutes } from "./routes/vault.js";
import { batchRoutes } from "./routes/batches.js";
import { assetRoutes } from "./routes/assets.js";
import { publishRoutes } from "./routes/publish.js";
import { analyticsRoutes } from "./routes/analytics.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
  genReqId: () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
});

// Register CORS
await app.register(cors, {
  origin: process.env.WEB_URL ?? "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
});

// Health check
app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Register routes
await app.register(vaultRoutes, { prefix: "/vault" });
await app.register(batchRoutes, { prefix: "/batches" });
await app.register(assetRoutes, { prefix: "/assets" });
await app.register(publishRoutes, { prefix: "/publish" });
await app.register(analyticsRoutes, { prefix: "/analytics" });

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error({ err: error, requestId: request.id }, "Request error");
  
  reply.status(error.statusCode ?? 500).send({
    error: error.message,
    statusCode: error.statusCode ?? 500,
    requestId: request.id,
  });
});

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Server listening on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const shutdown = async () => {
  app.log.info("Shutting down server");
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
