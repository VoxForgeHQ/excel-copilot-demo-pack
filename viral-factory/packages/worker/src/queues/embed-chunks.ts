import { Worker, Job } from "bullmq";
import OpenAI from "openai";
import { prisma } from "@viral-factory/db";
import { connection, logger, QUEUE_NAMES } from "./index.js";

interface EmbedChunksJobData {
  chunkIds: string[] | "all";
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const BATCH_SIZE = 100;

/**
 * Embed Chunks Worker
 * Creates embeddings for vault chunks using OpenAI
 */
export const embedChunksWorker = new Worker<EmbedChunksJobData>(
  QUEUE_NAMES.EMBED_CHUNKS,
  async (job: Job<EmbedChunksJobData>) => {
    const { chunkIds } = job.data;

    logger.info({ chunkIds }, "Starting chunk embedding");

    // Get chunks to embed
    let chunks;
    if (chunkIds === "all") {
      // Get all chunks without embeddings
      chunks = await prisma.$queryRaw<{ id: string; chunkText: string }[]>`
        SELECT id, "chunkText" 
        FROM vault_chunks 
        WHERE embedding IS NULL
        LIMIT 1000
      `;
    } else {
      chunks = await prisma.vaultChunk.findMany({
        where: { id: { in: chunkIds } },
        select: { id: true, chunkText: true },
      });
    }

    if (chunks.length === 0) {
      logger.info("No chunks to embed");
      return { embedded: 0 };
    }

    let embedded = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.chunkText);

      try {
        // Get embeddings from OpenAI
        const response = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: texts,
        });

        // Update chunks with embeddings
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const embedding = response.data[j]?.embedding;

          if (chunk && embedding) {
            // Use raw SQL to update the vector column
            const embeddingStr = `[${embedding.join(",")}]`;
            await prisma.$executeRaw`
              UPDATE vault_chunks 
              SET embedding = ${embeddingStr}::vector 
              WHERE id = ${chunk.id}
            `;
            embedded++;
          }
        }

        await job.updateProgress(((i + batch.length) / chunks.length) * 100);
        
        logger.info({ batch: i / BATCH_SIZE + 1, embedded }, "Batch embedded");
      } catch (error) {
        logger.error({ error, batch: i / BATCH_SIZE + 1 }, "Failed to embed batch");
        throw error;
      }
    }

    // Update vault sync status with chunk count
    await prisma.vaultSyncStatus.update({
      where: { id: "main" },
      data: {
        chunksCount: embedded,
      },
    });

    logger.info({ embedded }, "Chunk embedding complete");
    return { embedded };
  },
  { connection, concurrency: 1 }
);

/**
 * Search vault chunks by similarity
 */
export async function searchVaultChunks(
  query: string,
  topK: number = 5
): Promise<
  {
    id: string;
    chunkText: string;
    similarity: number;
    source: { title: string; url: string };
  }[]
> {
  // Get query embedding
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  const queryEmbedding = response.data[0]?.embedding;
  if (!queryEmbedding) {
    throw new Error("Failed to get query embedding");
  }

  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Search by similarity using pgvector
  const results = await prisma.$queryRaw<
    { id: string; chunkText: string; similarity: number; sourceId: string }[]
  >`
    SELECT 
      vc.id,
      vc."chunkText",
      1 - (vc.embedding <=> ${embeddingStr}::vector) as similarity,
      vc."sourceId"
    FROM vault_chunks vc
    WHERE vc.embedding IS NOT NULL
    ORDER BY vc.embedding <=> ${embeddingStr}::vector
    LIMIT ${topK}
  `;

  // Get source info
  const sourceIds = [...new Set(results.map((r) => r.sourceId))];
  const sources = await prisma.notionSource.findMany({
    where: { id: { in: sourceIds } },
    select: { id: true, title: true, url: true },
  });

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return results.map((r) => ({
    id: r.id,
    chunkText: r.chunkText,
    similarity: r.similarity,
    source: sourceMap.get(r.sourceId) ?? { title: "Unknown", url: "" },
  }));
}

embedChunksWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Embed chunks job completed");
});

embedChunksWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Embed chunks job failed");
});
