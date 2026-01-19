import { Worker, Job } from "bullmq";
import { prisma, PublishMode, ScheduleStatus, Platform } from "@viral-factory/db";
import { assessRisk } from "@viral-factory/core";
import { connection, logger, QUEUE_NAMES, addJob } from "./index.js";

interface ScheduleJobData {
  scheduleId: string;
}

interface PublishJobData {
  assetId: string;
  scheduleId?: string;
  mode: PublishMode;
}

const AUTO_PUBLISH_ENABLED = process.env.AUTO_PUBLISH_ENABLED === "true";
const QUIET_HOURS_START = parseInt(process.env.QUIET_HOURS_START ?? "23", 10);
const QUIET_HOURS_END = parseInt(process.env.QUIET_HOURS_END ?? "7", 10);

/**
 * Schedule Worker
 * Processes scheduled posts and queues them for publishing
 */
export const scheduleWorker = new Worker<ScheduleJobData>(
  QUEUE_NAMES.SCHEDULE,
  async (job: Job<ScheduleJobData>) => {
    const { scheduleId } = job.data;

    logger.info({ scheduleId }, "Processing schedule");

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        asset: {
          include: {
            batch: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    // Check if already processed
    if (schedule.status !== "PENDING") {
      logger.info({ scheduleId, status: schedule.status }, "Schedule already processed");
      return { skipped: true };
    }

    // Check quiet hours
    const now = new Date();
    const hour = now.getUTCHours();
    const isQuietHour = 
      QUIET_HOURS_START > QUIET_HOURS_END
        ? hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END
        : hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END;

    if (isQuietHour && schedule.publishMode === "AUTO") {
      logger.info({ scheduleId }, "In quiet hours, delaying auto-publish");
      
      // Reschedule for after quiet hours
      const delayMs = calculateDelayToEndOfQuietHours();
      await addJob<ScheduleJobData>(QUEUE_NAMES.SCHEDULE, { scheduleId }, { delay: delayMs });
      return { delayed: true, delayMs };
    }

    // Check if time to publish
    if (schedule.scheduledAt > now) {
      // Not yet time, reschedule
      const delayMs = schedule.scheduledAt.getTime() - now.getTime();
      await addJob<ScheduleJobData>(QUEUE_NAMES.SCHEDULE, { scheduleId }, { delay: delayMs });
      return { delayed: true, delayMs };
    }

    // Asset must be approved
    if (schedule.asset.status !== "APPROVED") {
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: "FAILED" },
      });
      logger.warn({ scheduleId }, "Asset not approved, cannot publish");
      return { failed: true, reason: "Asset not approved" };
    }

    // For AUTO mode, check risk gate
    if (schedule.publishMode === "AUTO") {
      if (!AUTO_PUBLISH_ENABLED) {
        logger.warn({ scheduleId }, "Auto-publish disabled globally");
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { status: "PENDING" },
        });
        return { blocked: true, reason: "Auto-publish disabled" };
      }

      const payload = schedule.asset.payload as Record<string, unknown>;
      const contentText = JSON.stringify(payload);
      const riskAssessment = assessRisk(contentText, {
        bannedWords: schedule.asset.batch.brand.bannedWords,
      });

      if (!riskAssessment.passed) {
        logger.warn({ scheduleId, riskLevel: riskAssessment.riskLevel }, "Risk gate failed, blocking auto-publish");
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { status: "PENDING" },
        });
        return { blocked: true, reason: "Risk gate failed" };
      }
    }

    // Update status and queue publish
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: "QUEUED" },
    });

    await addJob<PublishJobData>(QUEUE_NAMES.PUBLISH, {
      assetId: schedule.assetId,
      scheduleId: schedule.id,
      mode: schedule.publishMode,
    });

    logger.info({ scheduleId, assetId: schedule.assetId }, "Queued for publishing");

    return { queued: true };
  },
  { connection, concurrency: 10 }
);

/**
 * Publish Worker
 * Handles actual publishing to platforms
 */
export const publishWorker = new Worker<PublishJobData>(
  QUEUE_NAMES.PUBLISH,
  async (job: Job<PublishJobData>) => {
    const { assetId, scheduleId, mode } = job.data;

    logger.info({ assetId, mode }, "Publishing asset");

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        batch: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    let publishResult: { success: boolean; externalId?: string; response?: unknown };

    // Choose connector based on mode
    if (mode === "MOCK") {
      // Mock publish - simulate success
      publishResult = await mockPublish(asset.platform, asset.payload as Record<string, unknown>);
    } else {
      // Real publish - try platform connectors
      publishResult = await realPublish(asset.platform, asset.payload as Record<string, unknown>);
    }

    // Create post record
    const post = await prisma.post.create({
      data: {
        assetId,
        platform: asset.platform,
        externalId: publishResult.externalId,
        publishedAt: new Date(),
        publishMode: mode,
        response: publishResult.response as never,
      },
    });

    // Update schedule if present
    if (scheduleId) {
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: publishResult.success ? "PUBLISHED" : "FAILED" },
      });
    }

    // Update asset status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: publishResult.success ? "PUBLISHED" : "FAILED" },
    });

    logger.info({ assetId, postId: post.id, success: publishResult.success }, "Publish complete");

    return {
      postId: post.id,
      success: publishResult.success,
      externalId: publishResult.externalId,
    };
  },
  { connection, concurrency: 5 }
);

/**
 * Mock publish - simulates publishing
 */
async function mockPublish(
  platform: Platform,
  payload: Record<string, unknown>
): Promise<{ success: boolean; externalId: string; response: unknown }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockId = `mock_${platform.toLowerCase()}_${Date.now()}`;

  logger.info({ platform, mockId }, "Mock publish successful");

  return {
    success: true,
    externalId: mockId,
    response: {
      mock: true,
      timestamp: new Date().toISOString(),
      platform,
      payload: Object.keys(payload),
    },
  };
}

/**
 * Real publish - attempts actual publishing
 */
async function realPublish(
  platform: Platform,
  payload: Record<string, unknown>
): Promise<{ success: boolean; externalId?: string; response?: unknown }> {
  // Check for third-party integration options
  const zapierWebhook = process.env.ZAPIER_WEBHOOK_URL;
  const makeWebhook = process.env.MAKE_WEBHOOK_URL;

  if (zapierWebhook) {
    return await webhookPublish(zapierWebhook, platform, payload);
  }

  if (makeWebhook) {
    return await webhookPublish(makeWebhook, platform, payload);
  }

  // Platform-specific APIs would go here
  // In development, fall back to mock; in production, require explicit configuration
  if (process.env.NODE_ENV === "production") {
    logger.error({ platform }, "No publishing connector configured for production");
    return {
      success: false,
      response: { 
        error: "No publishing connector configured. Set ZAPIER_WEBHOOK_URL, MAKE_WEBHOOK_URL, or platform-specific API credentials." 
      },
    };
  }

  logger.warn({ platform }, "No real connector available, using mock (development only)");
  return mockPublish(platform, payload);
}

/**
 * Publish via webhook (Zapier/Make)
 */
async function webhookPublish(
  webhookUrl: string,
  platform: Platform,
  payload: Record<string, unknown>
): Promise<{ success: boolean; externalId?: string; response?: unknown }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    return {
      success: response.ok,
      externalId: data.id ?? `webhook_${Date.now()}`,
      response: data,
    };
  } catch (error) {
    logger.error({ error, webhookUrl }, "Webhook publish failed");
    return {
      success: false,
      response: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

/**
 * Calculate delay to end of quiet hours
 */
function calculateDelayToEndOfQuietHours(): number {
  const now = new Date();
  const endHour = QUIET_HOURS_END;
  
  const target = new Date(now);
  target.setUTCHours(endHour, 0, 0, 0);
  
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

scheduleWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Schedule job completed");
});

scheduleWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Schedule job failed");
});

publishWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Publish job completed");
});

publishWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Publish job failed");
});
