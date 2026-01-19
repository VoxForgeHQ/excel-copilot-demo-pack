import { FastifyPluginAsync } from "fastify";
import { prisma } from "@viral-factory/db";
import { addJob, QUEUE_NAMES } from "@viral-factory/worker";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  // Weekly analytics summary
  app.get("/weekly", async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get posts from last week
    const posts = await prisma.post.findMany({
      where: {
        publishedAt: { gte: oneWeekAgo },
      },
      include: {
        metricSnapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
        },
      },
    });

    // Aggregate metrics
    const totalPosts = posts.length;
    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalSaves = 0;
    let totalClicks = 0;

    const platformBreakdown: Record<string, {
      posts: number;
      impressions: number;
      engagement: number;
    }> = {};

    for (const post of posts) {
      const metrics = post.metricSnapshots[0];
      if (metrics) {
        totalImpressions += metrics.impressions ?? 0;
        totalEngagement += metrics.engagement ?? 0;
        totalSaves += metrics.saves ?? 0;
        totalClicks += metrics.clicks ?? 0;

        if (!platformBreakdown[post.platform]) {
          platformBreakdown[post.platform] = { posts: 0, impressions: 0, engagement: 0 };
        }
        const pb = platformBreakdown[post.platform];
        if (pb) {
          pb.posts++;
          pb.impressions += metrics.impressions ?? 0;
          pb.engagement += metrics.engagement ?? 0;
        }
      }
    }

    // Get batches created
    const batchesCreated = await prisma.contentBatch.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });

    // Get assets generated
    const assetsGenerated = await prisma.asset.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });

    return {
      period: {
        start: oneWeekAgo.toISOString(),
        end: new Date().toISOString(),
      },
      summary: {
        totalPosts,
        totalImpressions,
        totalEngagement,
        totalSaves,
        totalClicks,
        engagementRate: totalImpressions > 0 
          ? ((totalEngagement / totalImpressions) * 100).toFixed(2) + "%"
          : "0%",
        batchesCreated,
        assetsGenerated,
      },
      platformBreakdown,
    };
  });

  // Get winning patterns
  app.get("/patterns", async (request) => {
    const { platform } = request.query as { platform?: string };

    const patterns = await prisma.winningPattern.findMany({
      where: platform ? { platform: platform as never } : {},
      orderBy: { confidence: "desc" },
    });

    return { patterns };
  });

  // Trigger pattern mining
  app.post("/patterns/mine", async (request, reply) => {
    const { platform, minSampleSize } = request.body as {
      platform?: string;
      minSampleSize?: number;
    };

    const job = await addJob(QUEUE_NAMES.PATTERN_MINING, {
      platform: platform as never,
      minSampleSize,
    });

    reply.status(202);
    return {
      message: "Pattern mining started",
      jobId: job.id,
    };
  });

  // Trigger metrics sync
  app.post("/metrics/sync", async (request, reply) => {
    const { postId, syncAll } = request.body as {
      postId?: string;
      syncAll?: boolean;
    };

    const job = await addJob(QUEUE_NAMES.METRICS_SYNC, {
      postId,
      syncAll: syncAll ?? true,
    });

    reply.status(202);
    return {
      message: "Metrics sync started",
      jobId: job.id,
    };
  });

  // Get top performing content
  app.get("/top-performers", async (request) => {
    const { limit = 10, platform } = request.query as {
      limit?: number;
      platform?: string;
    };

    const posts = await prisma.post.findMany({
      where: platform ? { platform: platform as never } : {},
      include: {
        asset: {
          select: {
            id: true,
            payload: true,
            platform: true,
            assetType: true,
          },
        },
        metricSnapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
        },
      },
    });

    // Sort by engagement score
    const scored = posts
      .filter((p) => p.metricSnapshots.length > 0)
      .map((p) => {
        const m = p.metricSnapshots[0];
        const engagementScore = 
          (m?.engagement ?? 0) + 
          (m?.saves ?? 0) * 2 + 
          (m?.shares ?? 0) * 3 +
          (m?.clicks ?? 0) * 2;
        return { ...p, engagementScore };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    return { topPerformers: scored };
  });

  // Get calendar view of scheduled/published content
  app.get("/calendar", async (request) => {
    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate 
      ? new Date(endDate) 
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get schedules
    const schedules = await prisma.schedule.findMany({
      where: {
        scheduledAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        asset: {
          select: {
            id: true,
            platform: true,
            assetType: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Get published posts
    const posts = await prisma.post.findMany({
      where: {
        publishedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        asset: {
          select: {
            id: true,
            platform: true,
            assetType: true,
          },
        },
      },
      orderBy: { publishedAt: "asc" },
    });

    // Combine into calendar events
    const events = [
      ...schedules.map((s) => ({
        type: "scheduled" as const,
        date: s.scheduledAt,
        platform: s.asset.platform,
        assetType: s.asset.assetType,
        assetId: s.assetId,
        status: s.status,
        publishMode: s.publishMode,
      })),
      ...posts.map((p) => ({
        type: "published" as const,
        date: p.publishedAt,
        platform: p.platform,
        assetType: p.asset.assetType,
        assetId: p.assetId,
        postId: p.id,
        externalId: p.externalId,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period: { start, end },
      events,
    };
  });
};
