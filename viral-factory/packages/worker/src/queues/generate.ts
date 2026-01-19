import { Worker, Job } from "bullmq";
import OpenAI from "openai";
import { prisma } from "@viral-factory/db";
import { 
  getPrompt, 
  PROMPTS, 
  HOOK_FORMULAS, 
  getHooksForPlatform,
  IdeationOutputSchema,
  type Platform 
} from "@viral-factory/core";
import { connection, logger, QUEUE_NAMES, addJob } from "./index.js";
import { searchVaultChunks } from "./embed-chunks.js";

interface GenerateIdeasJobData {
  batchId: string;
}

interface GenerateAssetsJobData {
  batchId: string;
  angleIndex: number;
  platform: Platform;
  angle: {
    angle: string;
    hookVariants: string[];
    formulaUsed: string;
    persuasionFramework?: string;
  };
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

/**
 * Generate Ideas Worker
 * Creates viral angles and hooks for a content batch
 */
export const generateIdeasWorker = new Worker<GenerateIdeasJobData>(
  QUEUE_NAMES.GENERATE_IDEAS,
  async (job: Job<GenerateIdeasJobData>) => {
    const { batchId } = job.data;

    logger.info({ batchId }, "Starting idea generation");

    // Get batch with relations
    const batch = await prisma.contentBatch.findUnique({
      where: { id: batchId },
      include: {
        brand: true,
        offer: true,
        topic: true,
      },
    });

    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    // Update batch status
    await prisma.contentBatch.update({
      where: { id: batchId },
      data: { status: "GENERATING" },
    });

    try {
      // Search vault for relevant context
      const vaultResults = await searchVaultChunks(batch.prompt, 10);
      const vaultContext = vaultResults.map((r) => ({
        text: r.chunkText,
        source: r.source,
        similarity: r.similarity,
      }));

      // Get trend cards for platforms
      const trendCards = await prisma.trendCard.findMany({
        where: {
          platform: { in: batch.platforms },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        take: 10,
      });

      // Get hook formulas for each platform
      const platformHooks: Record<string, typeof HOOK_FORMULAS> = {};
      for (const platform of batch.platforms) {
        platformHooks[platform] = getHooksForPlatform(platform);
      }

      // Build prompt
      const prompt = getPrompt(PROMPTS.VIRAL_IDEATION, {
        brandName: batch.brand.name,
        brandTone: batch.brand.tone,
        bannedWords: batch.brand.bannedWords,
        voiceExamples: batch.brand.voiceExamples as Record<string, string>,
        topic: batch.prompt,
        offerName: batch.offer.name,
        valueProp: batch.offer.valueProp,
        audience: batch.offer.audience,
        platforms: batch.platforms,
        vaultContext: JSON.stringify(vaultContext, null, 2),
        trendCards: JSON.stringify(trendCards.map((t) => ({
          phrase: t.phrase,
          angle: t.angle,
          platform: t.platform,
        })), null, 2),
      });

      // Call LLM
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a viral content strategist. Always respond with valid JSON matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const responseText = completion.choices[0]?.message.content;
      if (!responseText) {
        throw new Error("Empty response from LLM");
      }

      // Parse and validate response
      const ideationOutput = IdeationOutputSchema.parse(JSON.parse(responseText));

      logger.info(
        { batchId, anglesCount: ideationOutput.angles.length },
        "Ideas generated"
      );

      // Queue asset generation for each angle and platform
      for (let i = 0; i < ideationOutput.angles.length; i++) {
        const angle = ideationOutput.angles[i];
        if (angle) {
          await addJob<GenerateAssetsJobData>(QUEUE_NAMES.GENERATE_ASSETS, {
            batchId,
            angleIndex: i,
            platform: angle.platform,
            angle: {
              angle: angle.angle,
              hookVariants: angle.hookVariants,
              formulaUsed: angle.formulaUsed,
            },
          });
        }
      }

      await job.updateProgress(100);

      return {
        anglesGenerated: ideationOutput.angles.length,
        citationsUsed: ideationOutput.citations.length,
      };
    } catch (error) {
      await prisma.contentBatch.update({
        where: { id: batchId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  },
  { connection, concurrency: 2 }
);

/**
 * Generate Assets Worker
 * Creates platform-specific content from angles
 */
export const generateAssetsWorker = new Worker<GenerateAssetsJobData>(
  QUEUE_NAMES.GENERATE_ASSETS,
  async (job: Job<GenerateAssetsJobData>) => {
    const { batchId, angleIndex, platform, angle } = job.data;

    logger.info({ batchId, platform, angleIndex }, "Starting asset generation");

    // Get batch with relations
    const batch = await prisma.contentBatch.findUnique({
      where: { id: batchId },
      include: {
        brand: true,
        offer: true,
      },
    });

    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    const ctaDefaults = batch.offer.ctaDefaults as { soft: string; hard: string };

    // Build prompt
    const prompt = getPrompt(PROMPTS.PLATFORM_PACKAGER, {
      brandName: batch.brand.name,
      brandTone: batch.brand.tone,
      bannedWords: batch.brand.bannedWords,
      offerName: batch.offer.name,
      offerUrl: batch.offer.url,
      valueProp: batch.offer.valueProp,
      ctaSoft: ctaDefaults.soft,
      ctaHard: ctaDefaults.hard,
      angleDetails: JSON.stringify(angle, null, 2),
      platform,
    });

    // Call LLM
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a ${platform} content expert. Generate platform-native content in valid JSON format.`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message.content;
    if (!responseText) {
      throw new Error("Empty response from LLM");
    }

    const payload = JSON.parse(responseText);

    // Determine asset type based on platform
    const assetTypeMap: Record<Platform, string> = {
      PINTEREST: "PIN",
      INSTAGRAM: payload.type === "CAROUSEL" ? "CAROUSEL" : "REEL_SCRIPT",
      TIKTOK: "TIKTOK_SCRIPT",
      YOUTUBE: "SHORTS_SCRIPT",
      LINKEDIN: "LINKEDIN_POST",
    };

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        batchId,
        platform,
        assetType: assetTypeMap[platform] as never,
        payload,
        status: "DRAFT",
      },
    });

    // Create A/B variants
    const variants = extractVariants(payload, platform);
    for (const variant of variants) {
      await prisma.variantGroup.create({
        data: {
          assetId: asset.id,
          variantKey: variant.key,
          variantPayload: variant.payload,
        },
      });
    }

    // Queue scoring
    await addJob(QUEUE_NAMES.SCORE_ASSETS, { assetId: asset.id });

    logger.info({ assetId: asset.id, platform }, "Asset created");

    return { assetId: asset.id };
  },
  { connection, concurrency: 5 }
);

/**
 * Extract A/B variants from payload
 */
function extractVariants(
  payload: Record<string, unknown>,
  platform: Platform
): { key: string; payload: Record<string, unknown> }[] {
  const variants: { key: string; payload: Record<string, unknown> }[] = [];

  // Hook variants
  if (payload.hookOptions && Array.isArray(payload.hookOptions)) {
    variants.push(
      { key: "hook_a", payload: { hook: payload.hookOptions[0] } },
      { key: "hook_b", payload: { hook: payload.hookOptions[1] } }
    );
  }

  // Title variants (YouTube)
  if (payload.titleOptions && Array.isArray(payload.titleOptions)) {
    variants.push(
      { key: "title_a", payload: { title: payload.titleOptions[0] } },
      { key: "title_b", payload: { title: payload.titleOptions[1] } }
    );
  }

  // Thumbnail/Cover variants
  if (payload.thumbnailTextOptions && Array.isArray(payload.thumbnailTextOptions)) {
    variants.push(
      { key: "thumbnail_a", payload: { thumbnailText: payload.thumbnailTextOptions[0] } },
      { key: "thumbnail_b", payload: { thumbnailText: payload.thumbnailTextOptions[1] } }
    );
  }

  if (payload.coverTextOptions && Array.isArray(payload.coverTextOptions)) {
    variants.push(
      { key: "cover_a", payload: { coverText: payload.coverTextOptions[0] } },
      { key: "cover_b", payload: { coverText: payload.coverTextOptions[1] } }
    );
  }

  // CTA variants (extract from payload if present)
  if (typeof payload.authorityPost === "object" && payload.authorityPost !== null) {
    variants.push({ key: "cta_soft", payload: { style: "authority" } });
  }
  if (typeof payload.storyPost === "object" && payload.storyPost !== null) {
    variants.push({ key: "cta_story", payload: { style: "story" } });
  }

  return variants;
}

generateIdeasWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Generate ideas job completed");
});

generateIdeasWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Generate ideas job failed");
});

generateAssetsWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Generate assets job completed");
});

generateAssetsWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Generate assets job failed");
});
