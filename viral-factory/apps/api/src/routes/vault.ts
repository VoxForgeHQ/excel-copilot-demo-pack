import { FastifyPluginAsync } from "fastify";
import { prisma } from "@viral-factory/db";
import { addJob, QUEUE_NAMES } from "@viral-factory/worker";

export const vaultRoutes: FastifyPluginAsync = async (app) => {
  // Get vault sync status
  app.get("/status", async () => {
    const status = await prisma.vaultSyncStatus.findUnique({
      where: { id: "main" },
    });

    const sourcesCount = await prisma.notionSource.count();
    const chunksCount = await prisma.vaultChunk.count();

    return {
      status: status?.status ?? "never_synced",
      lastSyncAt: status?.lastSyncAt,
      lastError: status?.lastError,
      sourcesCount,
      chunksCount,
    };
  });

  // List all sources
  app.get("/sources", async (request) => {
    const { limit = 50, offset = 0 } = request.query as {
      limit?: number;
      offset?: number;
    };

    const sources = await prisma.notionSource.findMany({
      take: limit,
      skip: offset,
      orderBy: { lastSyncedAt: "desc" },
      select: {
        id: true,
        pageId: true,
        title: true,
        url: true,
        lastSyncedAt: true,
        metadata: true,
        _count: {
          select: { chunks: true },
        },
      },
    });

    const total = await prisma.notionSource.count();

    return { sources, total, limit, offset };
  });

  // Trigger vault sync
  app.post("/sync", async (request, reply) => {
    const { databaseIds, force } = (request.body as {
      databaseIds?: string[];
      force?: boolean;
    }) ?? {};

    const job = await addJob(QUEUE_NAMES.VAULT_SYNC, { databaseIds, force });

    reply.status(202);
    return {
      message: "Vault sync started",
      jobId: job.id,
    };
  });

  // Search vault
  app.post("/search", async (request) => {
    const { query, topK = 5 } = request.body as {
      query: string;
      topK?: number;
    };

    if (!query) {
      throw { statusCode: 400, message: "Query is required" };
    }

    // Import search function dynamically to avoid circular deps
    const { searchVaultChunks } = await import("@viral-factory/worker");
    const results = await searchVaultChunks(query, topK);

    return { results };
  });
};
