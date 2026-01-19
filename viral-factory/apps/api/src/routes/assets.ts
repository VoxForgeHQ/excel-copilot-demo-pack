import { FastifyPluginAsync } from "fastify";
import { prisma, AssetStatus, Platform } from "@viral-factory/db";
import { addJob, QUEUE_NAMES } from "@viral-factory/worker";

export const assetRoutes: FastifyPluginAsync = async (app) => {
  // List assets
  app.get("/", async (request) => {
    const { limit = 20, offset = 0, status, platform, batchId } = request.query as {
      limit?: number;
      offset?: number;
      status?: AssetStatus;
      platform?: Platform;
      batchId?: string;
    };

    const where = {
      ...(status && { status }),
      ...(platform && { platform }),
      ...(batchId && { batchId }),
    };

    const assets = await prisma.asset.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        batch: { select: { id: true, name: true } },
        variants: true,
        _count: { select: { schedules: true, posts: true } },
      },
    });

    const total = await prisma.asset.count({ where });

    return { assets, total, limit, offset };
  });

  // Get single asset
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            brand: true,
            offer: true,
          },
        },
        variants: true,
        schedules: true,
        posts: {
          include: {
            metricSnapshots: {
              orderBy: { snapshotAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!asset) {
      throw { statusCode: 404, message: "Asset not found" };
    }

    return asset;
  });

  // Regenerate asset
  app.post("/:id/regenerate", async (request, reply) => {
    const { id } = request.params as { id: string };

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw { statusCode: 404, message: "Asset not found" };
    }

    if (asset.status === "PUBLISHED") {
      throw { statusCode: 400, message: "Cannot regenerate published asset" };
    }

    // Queue regeneration
    const job = await addJob(QUEUE_NAMES.REWRITE_LOW_SCORE, {
      assetId: id,
      attemptNumber: asset.regenAttempts + 1,
    });

    reply.status(202);
    return {
      message: "Regeneration started",
      assetId: id,
      jobId: job.id,
    };
  });

  // Approve asset
  app.post("/:id/approve", async (request) => {
    const { id } = request.params as { id: string };

    const asset = await prisma.asset.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    return asset;
  });

  // Update asset payload
  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const { payload } = request.body as { payload: unknown };

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        payload: payload as never,
        version: { increment: 1 },
      },
    });

    // Re-score after update
    await addJob(QUEUE_NAMES.SCORE_ASSETS, { assetId: id });

    return asset;
  });

  // Schedule asset
  app.post("/:id/schedule", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { scheduledAt, publishMode = "MANUAL", timezone = "America/New_York" } = request.body as {
      scheduledAt: string;
      publishMode?: "MANUAL" | "AUTO" | "MOCK";
      timezone?: string;
    };

    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      throw { statusCode: 404, message: "Asset not found" };
    }

    if (asset.status !== "APPROVED") {
      throw { statusCode: 400, message: "Only approved assets can be scheduled" };
    }

    const schedule = await prisma.schedule.create({
      data: {
        assetId: id,
        scheduledAt: new Date(scheduledAt),
        timezone,
        publishMode,
        status: "PENDING",
      },
    });

    // Queue the schedule job
    const delayMs = new Date(scheduledAt).getTime() - Date.now();
    if (delayMs > 0) {
      await addJob(QUEUE_NAMES.SCHEDULE, { scheduleId: schedule.id }, { delay: delayMs });
    } else {
      await addJob(QUEUE_NAMES.SCHEDULE, { scheduleId: schedule.id });
    }

    reply.status(201);
    return schedule;
  });

  // Delete asset
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.asset.delete({ where: { id } });

    reply.status(204);
  });
};
