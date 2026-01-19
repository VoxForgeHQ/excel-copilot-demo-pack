import { FastifyPluginAsync } from "fastify";
import { prisma } from "@viral-factory/db";
import { addJob, QUEUE_NAMES } from "@viral-factory/worker";

export const publishRoutes: FastifyPluginAsync = async (app) => {
  // Manual publish trigger
  app.post("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { mode = "MOCK" } = request.body as { mode?: "MANUAL" | "AUTO" | "MOCK" };

    // Check if id is asset or schedule
    const asset = await prisma.asset.findUnique({ where: { id } });

    if (asset) {
      if (asset.status !== "APPROVED") {
        throw { statusCode: 400, message: "Only approved assets can be published" };
      }

      const job = await addJob(QUEUE_NAMES.PUBLISH, {
        assetId: id,
        mode,
      });

      reply.status(202);
      return {
        message: "Publishing started",
        assetId: id,
        jobId: job.id,
      };
    }

    // Try as schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (schedule) {
      if (schedule.asset.status !== "APPROVED") {
        throw { statusCode: 400, message: "Only approved assets can be published" };
      }

      const job = await addJob(QUEUE_NAMES.PUBLISH, {
        assetId: schedule.assetId,
        scheduleId: schedule.id,
        mode: schedule.publishMode,
      });

      reply.status(202);
      return {
        message: "Publishing started",
        scheduleId: id,
        assetId: schedule.assetId,
        jobId: job.id,
      };
    }

    throw { statusCode: 404, message: "Asset or schedule not found" };
  });

  // List scheduled posts
  app.get("/scheduled", async (request) => {
    const { limit = 50, status } = request.query as {
      limit?: number;
      status?: "PENDING" | "QUEUED" | "PUBLISHED" | "FAILED" | "CANCELLED";
    };

    const schedules = await prisma.schedule.findMany({
      where: status ? { status } : { status: { in: ["PENDING", "QUEUED"] } },
      take: limit,
      orderBy: { scheduledAt: "asc" },
      include: {
        asset: {
          include: {
            batch: { select: { name: true } },
          },
        },
      },
    });

    return { schedules };
  });

  // Cancel scheduled post
  app.delete("/scheduled/:id", async (request) => {
    const { id } = request.params as { id: string };

    const schedule = await prisma.schedule.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return schedule;
  });

  // List published posts
  app.get("/posts", async (request) => {
    const { limit = 50, offset = 0, platform } = request.query as {
      limit?: number;
      offset?: number;
      platform?: string;
    };

    const where = platform ? { platform: platform as never } : {};

    const posts = await prisma.post.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { publishedAt: "desc" },
      include: {
        asset: {
          select: {
            id: true,
            platform: true,
            assetType: true,
            batch: { select: { name: true } },
          },
        },
        metricSnapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
        },
      },
    });

    const total = await prisma.post.count({ where });

    return { posts, total, limit, offset };
  });
};
