import { FastifyPluginAsync } from "fastify";
import { prisma, Platform, BatchStatus } from "@viral-factory/db";
import { addJob, QUEUE_NAMES } from "@viral-factory/worker";
import { z } from "zod";

const CreateBatchSchema = z.object({
  brandId: z.string(),
  offerId: z.string(),
  topicId: z.string().optional(),
  name: z.string(),
  prompt: z.string().min(10),
  platforms: z.array(z.enum(["PINTEREST", "INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN"])).min(1),
});

export const batchRoutes: FastifyPluginAsync = async (app) => {
  // List batches
  app.get("/", async (request) => {
    const { limit = 20, offset = 0, status } = request.query as {
      limit?: number;
      offset?: number;
      status?: BatchStatus;
    };

    const batches = await prisma.contentBatch.findMany({
      where: status ? { status } : {},
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
        offer: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
        _count: { select: { assets: true } },
      },
    });

    const total = await prisma.contentBatch.count({
      where: status ? { status } : {},
    });

    return { batches, total, limit, offset };
  });

  // Get single batch
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    const batch = await prisma.contentBatch.findUnique({
      where: { id },
      include: {
        brand: true,
        offer: true,
        topic: true,
        assets: {
          include: {
            variants: true,
            schedules: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!batch) {
      throw { statusCode: 404, message: "Batch not found" };
    }

    return batch;
  });

  // Create batch
  app.post("/", async (request, reply) => {
    const body = CreateBatchSchema.parse(request.body);

    // Validate brand and offer exist
    const brand = await prisma.brand.findUnique({ where: { id: body.brandId } });
    if (!brand) {
      throw { statusCode: 400, message: "Brand not found" };
    }

    const offer = await prisma.offer.findUnique({ where: { id: body.offerId } });
    if (!offer) {
      throw { statusCode: 400, message: "Offer not found" };
    }

    const batch = await prisma.contentBatch.create({
      data: {
        brandId: body.brandId,
        offerId: body.offerId,
        topicId: body.topicId,
        name: body.name,
        prompt: body.prompt,
        platforms: body.platforms as Platform[],
        status: "DRAFT",
      },
      include: {
        brand: { select: { id: true, name: true } },
        offer: { select: { id: true, name: true } },
      },
    });

    reply.status(201);
    return batch;
  });

  // Generate content for batch
  app.post("/:id/generate", async (request, reply) => {
    const { id } = request.params as { id: string };

    const batch = await prisma.contentBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw { statusCode: 404, message: "Batch not found" };
    }

    if (!["DRAFT", "FAILED"].includes(batch.status)) {
      throw { statusCode: 400, message: `Cannot generate for batch in status: ${batch.status}` };
    }

    // Queue generation
    const job = await addJob(QUEUE_NAMES.GENERATE_IDEAS, { batchId: id });

    reply.status(202);
    return {
      message: "Generation started",
      batchId: id,
      jobId: job.id,
    };
  });

  // Delete batch
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.contentBatch.delete({
      where: { id },
    });

    reply.status(204);
  });
};
