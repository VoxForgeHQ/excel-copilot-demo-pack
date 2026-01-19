import { Worker, Job } from "bullmq";
import { Client } from "@notionhq/client";
import { prisma } from "@viral-factory/db";
import { connection, logger, QUEUE_NAMES, addJob } from "./index.js";

interface VaultSyncJobData {
  databaseIds?: string[];
  force?: boolean;
}

interface ChunkData {
  sourceId: string;
  chunkText: string;
  tags: string[];
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/**
 * Vault Sync Worker
 * Pulls pages from Notion, extracts text, and stores in database
 */
export const vaultSyncWorker = new Worker<VaultSyncJobData>(
  QUEUE_NAMES.VAULT_SYNC,
  async (job: Job<VaultSyncJobData>) => {
    const { databaseIds, force } = job.data;
    const targetDatabases = databaseIds ?? 
      (process.env.NOTION_DATABASE_IDS?.split(",").map((id) => id.trim()) ?? []);

    logger.info({ databaseIds: targetDatabases }, "Starting vault sync");

    // Update sync status
    await prisma.vaultSyncStatus.upsert({
      where: { id: "main" },
      update: { status: "syncing" },
      create: { id: "main", status: "syncing" },
    });

    let sourcesCount = 0;
    const chunksToEmbed: ChunkData[] = [];

    try {
      for (const dbId of targetDatabases) {
        logger.info({ dbId }, "Syncing database");

        // Query Notion database
        const response = await notion.databases.query({
          database_id: dbId,
          page_size: 100,
        });

        for (const page of response.results) {
          if (!("properties" in page)) continue;

          const pageId = page.id;
          const title = extractTitle(page.properties);
          const url = page.url;
          const metadata = extractMetadata(page.properties);

          // Get page content
          const blocks = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
          });

          const rawText = extractTextFromBlocks(blocks.results);

          // Skip if no content
          if (!rawText.trim()) continue;

          // Check if needs update
          const existing = await prisma.notionSource.findUnique({
            where: { pageId },
          });

          const lastEdited = "last_edited_time" in page ? new Date(page.last_edited_time) : new Date();

          if (existing && !force && existing.lastSyncedAt >= lastEdited) {
            logger.debug({ pageId }, "Page unchanged, skipping");
            continue;
          }

          // Upsert source
          const source = await prisma.notionSource.upsert({
            where: { pageId },
            update: {
              title,
              url,
              rawText,
              metadata,
              lastSyncedAt: new Date(),
            },
            create: {
              pageId,
              title,
              url,
              rawText,
              metadata,
              lastSyncedAt: new Date(),
            },
          });

          sourcesCount++;

          // Delete old chunks
          await prisma.vaultChunk.deleteMany({
            where: { sourceId: source.id },
          });

          // Create new chunks
          const chunks = chunkText(rawText, 500); // ~500 char chunks
          const tags = extractTags(metadata);

          for (const chunkText of chunks) {
            chunksToEmbed.push({
              sourceId: source.id,
              chunkText,
              tags,
            });
          }

          await job.updateProgress((sourcesCount / targetDatabases.length) * 50);
        }
      }

      // Create chunks in database (without embeddings)
      for (const chunk of chunksToEmbed) {
        await prisma.vaultChunk.create({
          data: {
            sourceId: chunk.sourceId,
            chunkText: chunk.chunkText,
            tags: chunk.tags,
          },
        });
      }

      // Queue embedding job
      await addJob(QUEUE_NAMES.EMBED_CHUNKS, { 
        chunkIds: "all", // Will process all chunks without embeddings
      });

      // Update sync status
      await prisma.vaultSyncStatus.update({
        where: { id: "main" },
        data: {
          status: "success",
          sourcesCount,
          chunksCount: chunksToEmbed.length,
          lastSyncAt: new Date(),
          lastError: null,
        },
      });

      logger.info({ sourcesCount, chunksCount: chunksToEmbed.length }, "Vault sync complete");

      return { sourcesCount, chunksCount: chunksToEmbed.length };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await prisma.vaultSyncStatus.update({
        where: { id: "main" },
        data: {
          status: "failed",
          lastError: errorMessage,
        },
      });

      logger.error({ error: errorMessage }, "Vault sync failed");
      throw error;
    }
  },
  { connection, concurrency: 1 }
);

// Helper functions
function extractTitle(properties: Record<string, unknown>): string {
  for (const [, value] of Object.entries(properties)) {
    if (
      typeof value === "object" &&
      value !== null &&
      "type" in value &&
      value.type === "title" &&
      "title" in value &&
      Array.isArray(value.title)
    ) {
      return value.title.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
    }
  }
  return "Untitled";
}

function extractMetadata(properties: Record<string, unknown>): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    if (key === "title") continue;
    
    if (typeof value === "object" && value !== null && "type" in value) {
      const prop = value as { type: string; [key: string]: unknown };
      
      switch (prop.type) {
        case "select":
          if (prop.select && typeof prop.select === "object" && "name" in prop.select) {
            metadata[key] = prop.select.name;
          }
          break;
        case "multi_select":
          if (Array.isArray(prop.multi_select)) {
            metadata[key] = prop.multi_select.map((s: { name?: string }) => s.name);
          }
          break;
        case "rich_text":
          if (Array.isArray(prop.rich_text)) {
            metadata[key] = prop.rich_text.map((t: { plain_text?: string }) => t.plain_text ?? "").join("");
          }
          break;
      }
    }
  }
  
  return metadata;
}

function extractTextFromBlocks(blocks: unknown[]): string {
  const textParts: string[] = [];
  
  for (const block of blocks) {
    if (typeof block !== "object" || block === null || !("type" in block)) continue;
    
    const typedBlock = block as { type: string; [key: string]: unknown };
    const blockContent = typedBlock[typedBlock.type];
    
    if (
      typeof blockContent === "object" &&
      blockContent !== null &&
      "rich_text" in blockContent &&
      Array.isArray(blockContent.rich_text)
    ) {
      const text = blockContent.rich_text
        .map((t: { plain_text?: string }) => t.plain_text ?? "")
        .join("");
      if (text) textParts.push(text);
    }
  }
  
  return textParts.join("\n\n");
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split("\n\n");
  let currentChunk = "";
  
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

function extractTags(metadata: Record<string, unknown>): string[] {
  const tags: string[] = [];
  
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      tags.push(...value.filter((v): v is string => typeof v === "string"));
    } else if (typeof value === "string") {
      tags.push(value);
    }
  }
  
  return tags;
}

vaultSyncWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Vault sync job completed");
});

vaultSyncWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Vault sync job failed");
});
