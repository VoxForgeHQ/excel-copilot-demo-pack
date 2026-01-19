import { Worker, Job } from "bullmq";
import { prisma, Platform } from "@viral-factory/db";
import { connection, logger, QUEUE_NAMES } from "./index.js";

interface MetricsSyncJobData {
  postId?: string;
  syncAll?: boolean;
}

interface PatternMiningJobData {
  platform?: Platform;
  minSampleSize?: number;
}

/**
 * Metrics Sync Worker
 * Fetches performance metrics from platforms
 */
export const metricsSyncWorker = new Worker<MetricsSyncJobData>(
  QUEUE_NAMES.METRICS_SYNC,
  async (job: Job<MetricsSyncJobData>) => {
    const { postId, syncAll } = job.data;

    logger.info({ postId, syncAll }, "Syncing metrics");

    let posts;
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      posts = post ? [post] : [];
    } else if (syncAll) {
      // Get posts from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      posts = await prisma.post.findMany({
        where: {
          publishedAt: { gte: thirtyDaysAgo },
        },
        take: 100,
      });
    } else {
      posts = [];
    }

    let synced = 0;

    for (const post of posts) {
      try {
        // Fetch metrics based on platform
        // For now, generate mock metrics
        const metrics = await fetchMetrics(post.platform, post.externalId);

        await prisma.metricSnapshot.create({
          data: {
            postId: post.id,
            ...metrics,
          },
        });

        synced++;
      } catch (error) {
        logger.error({ postId: post.id, error }, "Failed to sync metrics for post");
      }
    }

    logger.info({ synced }, "Metrics sync complete");

    return { synced };
  },
  { connection, concurrency: 2 }
);

/**
 * Pattern Mining Worker
 * Analyzes performance data to identify winning patterns
 */
export const patternMiningWorker = new Worker<PatternMiningJobData>(
  QUEUE_NAMES.PATTERN_MINING,
  async (job: Job<PatternMiningJobData>) => {
    const { platform, minSampleSize = 10 } = job.data;

    logger.info({ platform, minSampleSize }, "Mining patterns");

    // Get posts with metrics
    const posts = await prisma.post.findMany({
      where: platform ? { platform } : {},
      include: {
        asset: {
          include: {
            variants: true,
          },
        },
        metricSnapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
        },
      },
    });

    // Filter posts with metrics
    const postsWithMetrics = posts.filter(
      (p) => p.metricSnapshots.length > 0
    );

    if (postsWithMetrics.length < minSampleSize) {
      logger.info({ count: postsWithMetrics.length, minSampleSize }, "Not enough data for pattern mining");
      return { patternsFound: 0, reason: "Insufficient data" };
    }

    // Analyze patterns
    const patterns: {
      platform: Platform;
      patternType: string;
      details: Record<string, unknown>;
      confidence: number;
      sampleSize: number;
    }[] = [];

    // Group by platform
    const platformGroups = new Map<Platform, typeof postsWithMetrics>();
    for (const post of postsWithMetrics) {
      const group = platformGroups.get(post.platform) ?? [];
      group.push(post);
      platformGroups.set(post.platform, group);
    }

    for (const [plat, platPosts] of platformGroups) {
      if (platPosts.length < 5) continue;

      // Find top performers (top 20%)
      const sorted = platPosts.sort((a, b) => {
        const aMetrics = a.metricSnapshots[0];
        const bMetrics = b.metricSnapshots[0];
        const aScore = (aMetrics?.engagement ?? 0) + (aMetrics?.saves ?? 0) * 2;
        const bScore = (bMetrics?.engagement ?? 0) + (bMetrics?.saves ?? 0) * 2;
        return bScore - aScore;
      });

      const topPerformers = sorted.slice(0, Math.ceil(sorted.length * 0.2));

      // Analyze hook patterns
      const hookPatterns = analyzeHooks(topPerformers);
      if (hookPatterns) {
        patterns.push({
          platform: plat,
          patternType: "hook",
          details: hookPatterns,
          confidence: hookPatterns.confidence,
          sampleSize: topPerformers.length,
        });
      }

      // Mark winning variants
      for (const post of topPerformers) {
        for (const variant of post.asset.variants) {
          await prisma.variantGroup.update({
            where: { id: variant.id },
            data: { isWinner: true },
          });
        }
      }
    }

    // Save patterns
    for (const pattern of patterns) {
      await prisma.winningPattern.upsert({
        where: {
          id: `${pattern.platform}_${pattern.patternType}`,
        },
        update: {
          details: pattern.details,
          confidence: pattern.confidence,
          sampleSize: pattern.sampleSize,
        },
        create: {
          id: `${pattern.platform}_${pattern.patternType}`,
          platform: pattern.platform,
          patternType: pattern.patternType,
          details: pattern.details,
          confidence: pattern.confidence,
          sampleSize: pattern.sampleSize,
        },
      });
    }

    logger.info({ patternsFound: patterns.length }, "Pattern mining complete");

    return { patternsFound: patterns.length };
  },
  { connection, concurrency: 1 }
);

/**
 * Fetch metrics for a post (mock implementation)
 */
async function fetchMetrics(
  platform: Platform,
  externalId: string | null
): Promise<{
  impressions: number;
  reach: number;
  engagement: number;
  saves: number;
  shares: number;
  clicks: number;
  comments: number;
  likes: number;
  views: number;
  watchTime: number | null;
  rawData: Record<string, unknown>;
}> {
  // Mock metrics - in production, would call platform APIs
  const baseMultiplier = Math.random() * 10 + 1;
  
  return {
    impressions: Math.floor(1000 * baseMultiplier),
    reach: Math.floor(800 * baseMultiplier),
    engagement: Math.floor(50 * baseMultiplier),
    saves: Math.floor(20 * baseMultiplier),
    shares: Math.floor(10 * baseMultiplier),
    clicks: Math.floor(30 * baseMultiplier),
    comments: Math.floor(15 * baseMultiplier),
    likes: Math.floor(100 * baseMultiplier),
    views: Math.floor(500 * baseMultiplier),
    watchTime: ["TIKTOK", "INSTAGRAM", "YOUTUBE"].includes(platform)
      ? Math.random() * 30 + 5
      : null,
    rawData: {
      mock: true,
      platform,
      externalId,
      fetchedAt: new Date().toISOString(),
    },
  };
}

/**
 * Analyze hooks from top performers
 */
function analyzeHooks(
  posts: Array<{
    asset: {
      payload: unknown;
    };
  }>
): { patterns: string[]; confidence: number } | null {
  const hooks: string[] = [];

  for (const post of posts) {
    const payload = post.asset.payload as Record<string, unknown>;
    
    // Extract hooks
    if (Array.isArray(payload.hookOptions)) {
      hooks.push(...payload.hookOptions.filter((h): h is string => typeof h === "string"));
    }
    if (typeof payload.hook === "string") {
      hooks.push(payload.hook);
    }
    if (
      typeof payload.script === "object" &&
      payload.script !== null &&
      "hook" in payload.script &&
      typeof payload.script.hook === "string"
    ) {
      hooks.push(payload.script.hook);
    }
  }

  if (hooks.length === 0) return null;

  // Find common patterns
  const patterns: string[] = [];

  // Check for question hooks
  const questionHooks = hooks.filter((h) => h.includes("?"));
  if (questionHooks.length > hooks.length * 0.3) {
    patterns.push("Questions perform well");
  }

  // Check for number hooks
  const numberHooks = hooks.filter((h) => /\d+/.test(h));
  if (numberHooks.length > hooks.length * 0.3) {
    patterns.push("Numbers in hooks perform well");
  }

  // Check for negative hooks
  const negativeHooks = hooks.filter((h) => 
    /stop|don't|never|mistake|wrong/i.test(h)
  );
  if (negativeHooks.length > hooks.length * 0.3) {
    patterns.push("Negative framing performs well");
  }

  return {
    patterns,
    confidence: patterns.length > 0 ? 0.7 : 0.3,
  };
}

metricsSyncWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Metrics sync job completed");
});

metricsSyncWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Metrics sync job failed");
});

patternMiningWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Pattern mining job completed");
});

patternMiningWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Pattern mining job failed");
});
