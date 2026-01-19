import { Worker, Job } from "bullmq";
import OpenAI from "openai";
import { prisma } from "@viral-factory/db";
import {
  calculateQualityScore,
  assessRisk,
  getPrompt,
  PROMPTS,
} from "@viral-factory/core";
import { connection, logger, QUEUE_NAMES, addJob } from "./index.js";

interface ScoreAssetsJobData {
  assetId: string;
}

interface RewriteLowScoreJobData {
  assetId: string;
  attemptNumber: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
const MIN_SCORE = parseInt(process.env.MIN_ASSET_SCORE ?? "70", 10);
const MAX_REGEN_ATTEMPTS = parseInt(process.env.MAX_REGEN_ATTEMPTS ?? "3", 10);

/**
 * Score Assets Worker
 * Calculates quality scores for generated assets
 */
export const scoreAssetsWorker = new Worker<ScoreAssetsJobData>(
  QUEUE_NAMES.SCORE_ASSETS,
  async (job: Job<ScoreAssetsJobData>) => {
    const { assetId } = job.data;

    logger.info({ assetId }, "Starting asset scoring");

    // Get asset with relations
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        batch: {
          include: {
            brand: true,
            offer: true,
          },
        },
      },
    });

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Update status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "SCORING" },
    });

    const payload = asset.payload as Record<string, unknown>;
    const brand = asset.batch.brand;
    const offer = asset.batch.offer;
    const ctaDefaults = offer.ctaDefaults as { soft: string; hard: string };

    // Extract content for scoring
    const contentText = extractContentText(payload);
    const hook = extractHook(payload);
    const cta = extractCTA(payload);

    // Calculate quality score
    const qualityScore = calculateQualityScore(contentText, {
      hook,
      cta,
      topic: asset.batch.prompt,
      audience: offer.audience,
      offer: {
        valueProp: offer.valueProp,
        ctaDefaults,
      },
      brand: {
        tone: brand.tone,
        bannedWords: brand.bannedWords,
      },
      platform: asset.platform,
    });

    // Assess risk
    const riskAssessment = assessRisk(contentText, {
      bannedWords: brand.bannedWords,
    });

    // Combine scores
    const score = {
      quality: qualityScore,
      risk: riskAssessment,
      timestamp: new Date().toISOString(),
    };

    // Determine status
    let newStatus: "APPROVED" | "LOW_SCORE" | "DRAFT";
    if (!riskAssessment.passed) {
      newStatus = "LOW_SCORE";
    } else if (qualityScore.passed) {
      newStatus = "APPROVED";
    } else {
      newStatus = "LOW_SCORE";
    }

    // Update asset
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        score,
        status: newStatus,
      },
    });

    // Score variants
    const variants = await prisma.variantGroup.findMany({
      where: { assetId },
    });

    for (const variant of variants) {
      const variantPayload = variant.variantPayload as Record<string, unknown>;
      const variantContent = JSON.stringify(variantPayload);
      const variantHook = (variantPayload.hook as string) || hook;

      const variantScore = calculateQualityScore(variantContent, {
        hook: variantHook,
        cta,
        topic: asset.batch.prompt,
        audience: offer.audience,
        offer: { valueProp: offer.valueProp, ctaDefaults },
        brand: { tone: brand.tone, bannedWords: brand.bannedWords },
        platform: asset.platform,
      });

      await prisma.variantGroup.update({
        where: { id: variant.id },
        data: { score: { quality: variantScore } },
      });
    }

    // Queue rewrite if low score and under attempt limit
    if (newStatus === "LOW_SCORE" && asset.regenAttempts < MAX_REGEN_ATTEMPTS) {
      await addJob<RewriteLowScoreJobData>(QUEUE_NAMES.REWRITE_LOW_SCORE, {
        assetId,
        attemptNumber: asset.regenAttempts + 1,
      });
    }

    logger.info(
      { assetId, score: qualityScore.overall, status: newStatus },
      "Asset scored"
    );

    return {
      score: qualityScore.overall,
      passed: qualityScore.passed,
      riskPassed: riskAssessment.passed,
      status: newStatus,
    };
  },
  { connection, concurrency: 5 }
);

/**
 * Rewrite Low Score Worker
 * Automatically improves low-scoring assets
 */
export const rewriteLowScoreWorker = new Worker<RewriteLowScoreJobData>(
  QUEUE_NAMES.REWRITE_LOW_SCORE,
  async (job: Job<RewriteLowScoreJobData>) => {
    const { assetId, attemptNumber } = job.data;

    logger.info({ assetId, attemptNumber }, "Starting asset rewrite");

    // Get asset with relations
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        batch: {
          include: {
            brand: true,
            offer: true,
          },
        },
      },
    });

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    if (asset.status === "APPROVED") {
      logger.info({ assetId }, "Asset already approved, skipping rewrite");
      return { skipped: true };
    }

    // Update status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "REGENERATING", regenAttempts: attemptNumber },
    });

    const currentScore = asset.score as {
      quality: { overall: number; suggestions: string[]; components: unknown[] };
    } | null;
    const ctaDefaults = asset.batch.offer.ctaDefaults as { soft: string; hard: string };

    // Build rewrite prompt
    const prompt = getPrompt(PROMPTS.QUALITY_REWRITE, {
      originalContent: JSON.stringify(asset.payload, null, 2),
      overallScore: currentScore?.quality.overall ?? 0,
      minScore: MIN_SCORE,
      scoreBreakdown: JSON.stringify(currentScore?.quality.components ?? [], null, 2),
      suggestions: (currentScore?.quality.suggestions ?? []).join("\n"),
      brandTone: asset.batch.brand.tone,
      bannedWords: asset.batch.brand.bannedWords,
      voiceExamples: JSON.stringify(asset.batch.brand.voiceExamples),
      valueProp: asset.batch.offer.valueProp,
      ctaSoft: ctaDefaults.soft,
      ctaHard: ctaDefaults.hard,
      attemptNumber,
    });

    // Call LLM for rewrite
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a content optimization expert. Improve the content while maintaining brand voice. Respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const responseText = completion.choices[0]?.message.content;
    if (!responseText) {
      throw new Error("Empty response from LLM");
    }

    const rewriteResult = JSON.parse(responseText);
    const newPayload = rewriteResult.rewrittenContent;

    // Update asset with new payload
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        payload: newPayload,
        version: asset.version + 1,
      },
    });

    // Re-score the asset
    await addJob<ScoreAssetsJobData>(QUEUE_NAMES.SCORE_ASSETS, { assetId });

    logger.info({ assetId, attemptNumber }, "Asset rewritten");

    return {
      rewritten: true,
      attemptNumber,
      changesApplied: rewriteResult.changesApplied?.length ?? 0,
    };
  },
  { connection, concurrency: 3 }
);

// Helper functions
function extractContentText(payload: Record<string, unknown>): string {
  const parts: string[] = [];

  // Generic extraction of text content
  const extractStrings = (obj: unknown): void => {
    if (typeof obj === "string") {
      parts.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(extractStrings);
    } else if (typeof obj === "object" && obj !== null) {
      Object.values(obj).forEach(extractStrings);
    }
  };

  extractStrings(payload);
  return parts.join(" ");
}

function extractHook(payload: Record<string, unknown>): string {
  // Try various hook locations
  if (typeof payload.hook === "string") return payload.hook;
  if (Array.isArray(payload.hookOptions) && typeof payload.hookOptions[0] === "string") {
    return payload.hookOptions[0];
  }
  if (typeof payload.title === "string") return payload.title;
  if (typeof payload.firstLine === "string") return payload.firstLine;
  if (
    typeof payload.script === "object" &&
    payload.script !== null &&
    "hook" in payload.script &&
    typeof payload.script.hook === "string"
  ) {
    return payload.script.hook;
  }
  if (
    typeof payload.authorityPost === "object" &&
    payload.authorityPost !== null &&
    "firstLine" in payload.authorityPost &&
    typeof payload.authorityPost.firstLine === "string"
  ) {
    return payload.authorityPost.firstLine;
  }
  return "";
}

function extractCTA(payload: Record<string, unknown>): string {
  if (typeof payload.cta === "string") return payload.cta;
  if (
    typeof payload.script === "object" &&
    payload.script !== null &&
    "cta" in payload.script &&
    typeof payload.script.cta === "string"
  ) {
    return payload.script.cta;
  }
  if (
    typeof payload.authorityPost === "object" &&
    payload.authorityPost !== null &&
    "cta" in payload.authorityPost &&
    typeof payload.authorityPost.cta === "string"
  ) {
    return payload.authorityPost.cta;
  }
  return "";
}

scoreAssetsWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Score assets job completed");
});

scoreAssetsWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Score assets job failed");
});

rewriteLowScoreWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Rewrite job completed");
});

rewriteLowScoreWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Rewrite job failed");
});
