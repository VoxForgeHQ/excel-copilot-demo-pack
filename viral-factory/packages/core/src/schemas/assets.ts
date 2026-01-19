import { z } from "zod";

/**
 * Platform Enum
 */
export const PlatformSchema = z.enum([
  "PINTEREST",
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "LINKEDIN",
]);
export type Platform = z.infer<typeof PlatformSchema>;

/**
 * Pinterest Asset Schema
 */
export const PinterestAssetSchema = z.object({
  platform: z.literal("PINTEREST"),
  title: z.string().max(100).describe("SEO-optimized pin title"),
  description: z.string().max(500).describe("SEO + promise + CTA description"),
  keywords: z.array(z.string()).min(5).max(20).describe("SEO keywords list"),
  boardSuggestion: z.string().describe("Suggested board name"),
  overlayTextOptions: z.array(z.string()).length(3).describe("3 overlay text options"),
  destinationUrl: z.string().url().describe("Destination URL from offer"),
  altText: z.string().max(200).describe("Accessibility alt text"),
});
export type PinterestAsset = z.infer<typeof PinterestAssetSchema>;

/**
 * Instagram Asset Schema
 */
export const InstagramCarouselSchema = z.object({
  platform: z.literal("INSTAGRAM"),
  type: z.literal("CAROUSEL"),
  slides: z.array(z.object({
    slideNumber: z.number(),
    headline: z.string(),
    body: z.string(),
    visualDirection: z.string(),
  })).min(3).max(10),
  captionLong: z.string().max(2200).describe("Long caption variant"),
  captionShort: z.string().max(300).describe("Short caption variant"),
  hashtagsBroad: z.array(z.string()).min(3).max(5),
  hashtagsMid: z.array(z.string()).min(5).max(10),
  hashtagsNiche: z.array(z.string()).min(5).max(15),
  altText: z.string().max(200),
  coverTextOptions: z.array(z.string()).length(3),
});
export type InstagramCarousel = z.infer<typeof InstagramCarouselSchema>;

export const InstagramReelSchema = z.object({
  platform: z.literal("INSTAGRAM"),
  type: z.literal("REEL"),
  script: z.object({
    hook: z.string().describe("0-1 second hook"),
    proof: z.string().describe("1-4 second proof/credibility"),
    mainContent: z.array(z.object({
      timestamp: z.string(),
      action: z.string(),
      dialogue: z.string(),
      onScreenText: z.string().optional(),
    })),
    cta: z.string().describe("Final CTA"),
    totalDuration: z.string().describe("Estimated duration"),
  }),
  captionLong: z.string().max(2200),
  captionShort: z.string().max(300),
  hashtagsBroad: z.array(z.string()).min(3).max(5),
  hashtagsMid: z.array(z.string()).min(5).max(10),
  hashtagsNiche: z.array(z.string()).min(5).max(15),
  altText: z.string().max(200),
  coverTextOptions: z.array(z.string()).length(3),
  onScreenTextTiming: z.array(z.object({
    text: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});
export type InstagramReel = z.infer<typeof InstagramReelSchema>;

export const InstagramAssetSchema = z.union([InstagramCarouselSchema, InstagramReelSchema]);
export type InstagramAsset = z.infer<typeof InstagramAssetSchema>;

/**
 * TikTok Asset Schema
 */
export const TikTokAssetSchema = z.object({
  platform: z.literal("TIKTOK"),
  scriptLong: z.object({
    duration: z.string().describe("20-35 seconds"),
    hook: z.string(),
    sections: z.array(z.object({
      timestamp: z.string(),
      dialogue: z.string(),
      action: z.string(),
      bRollSuggestion: z.string().optional(),
    })),
    cta: z.string(),
  }),
  scriptShort: z.object({
    duration: z.string().describe("10-15 seconds"),
    hook: z.string(),
    mainPoint: z.string(),
    cta: z.string(),
  }),
  hookOptions: z.array(z.string()).length(5).describe("5 hook variants"),
  shotList: z.array(z.object({
    shot: z.string(),
    description: z.string(),
    duration: z.string(),
  })),
  bRollSuggestions: z.array(z.string()).min(3).max(10),
  caption: z.string().max(2200),
  hashtags: z.array(z.string()).min(3).max(8),
  commentBait: z.string().optional().describe("Non-spammy comment prompt"),
});
export type TikTokAsset = z.infer<typeof TikTokAssetSchema>;

/**
 * YouTube Shorts Asset Schema
 */
export const YouTubeShortsAssetSchema = z.object({
  platform: z.literal("YOUTUBE"),
  type: z.literal("SHORTS"),
  script: z.object({
    duration: z.string().describe("15-35 seconds"),
    hook: z.string(),
    sections: z.array(z.object({
      timestamp: z.string(),
      dialogue: z.string(),
      visualDirection: z.string(),
    })),
    cta: z.string(),
  }),
  titleOptions: z.array(z.string()).length(5).describe("5 title variants"),
  description: z.string().max(5000),
  tags: z.array(z.string()).min(5).max(15),
  pinnedCommentCTA: z.string().describe("CTA for pinned comment"),
  thumbnailTextOptions: z.array(z.string()).length(5),
});
export type YouTubeShortsAsset = z.infer<typeof YouTubeShortsAssetSchema>;

/**
 * LinkedIn Asset Schema
 */
export const LinkedInAssetSchema = z.object({
  platform: z.literal("LINKEDIN"),
  authorityPost: z.object({
    firstLine: z.string().max(150).describe("Punchy opening line"),
    body: z.string().max(3000),
    takeaways: z.array(z.string()).min(3).max(5).describe("Bullet point takeaways"),
    cta: z.string(),
  }),
  storyPost: z.object({
    firstLine: z.string().max(150),
    story: z.string().max(2000).describe("Mini-story with whitespace"),
    lesson: z.string(),
    cta: z.string(),
  }),
  hashtags: z.array(z.string()).max(3).describe("Max 3 hashtags"),
  commentToGet: z.string().optional().describe("Optional comment-to-get variant"),
  repurposeSummary: z.string().max(280).describe("One-line summary for newsletter"),
});
export type LinkedInAsset = z.infer<typeof LinkedInAssetSchema>;

/**
 * Generic Asset Payload Schema
 */
export const AssetPayloadSchema = z.union([
  PinterestAssetSchema,
  InstagramCarouselSchema,
  InstagramReelSchema,
  TikTokAssetSchema,
  YouTubeShortsAssetSchema,
  LinkedInAssetSchema,
]);
export type AssetPayload = z.infer<typeof AssetPayloadSchema>;

/**
 * Variant Schema
 */
export const VariantSchema = z.object({
  variantKey: z.string().describe("e.g., hook_a, hook_b, cta_soft, cta_hard"),
  variantPayload: z.record(z.any()).describe("Variant-specific content"),
});
export type Variant = z.infer<typeof VariantSchema>;

/**
 * Quality Scorecard Schema
 */
export const ScoreComponentSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  feedback: z.string().optional(),
});

export const QualityScorecardSchema = z.object({
  overall: z.number().min(0).max(100),
  components: z.array(ScoreComponentSchema),
  passed: z.boolean(),
  requiresRegeneration: z.boolean(),
  suggestions: z.array(z.string()),
});
export type QualityScorecard = z.infer<typeof QualityScorecardSchema>;

/**
 * Risk Assessment Schema
 */
export const RiskFlagSchema = z.object({
  type: z.string(),
  severity: z.enum(["warning", "critical"]),
  description: z.string(),
  matchedText: z.string().optional(),
});

export const RiskAssessmentSchema = z.object({
  passed: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high"]),
  flags: z.array(RiskFlagSchema),
  requiresManualReview: z.boolean(),
  suggestedRewrites: z.array(z.string()),
});
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

/**
 * Citation Schema
 */
export const CitationSchema = z.object({
  pageTitle: z.string(),
  pageUrl: z.string().url(),
  blockAnchor: z.string().optional(),
  relevantText: z.string(),
  confidence: z.number().min(0).max(1),
});
export type Citation = z.infer<typeof CitationSchema>;

/**
 * Content Generation Request Schema
 */
export const ContentGenerationRequestSchema = z.object({
  batchId: z.string(),
  topic: z.string(),
  offer: z.object({
    name: z.string(),
    url: z.string().url(),
    valueProp: z.string(),
    audience: z.string(),
    ctaDefaults: z.object({
      soft: z.string(),
      hard: z.string(),
    }),
  }),
  brand: z.object({
    name: z.string(),
    tone: z.array(z.string()),
    bannedWords: z.array(z.string()),
    voiceExamples: z.record(z.string()),
  }),
  platforms: z.array(PlatformSchema),
  context: z.array(z.object({
    text: z.string(),
    citation: CitationSchema.optional(),
  })).optional(),
  trendCards: z.array(z.object({
    phrase: z.string(),
    angle: z.string().optional(),
  })).optional(),
});
export type ContentGenerationRequest = z.infer<typeof ContentGenerationRequestSchema>;

/**
 * Viral Ideation Output Schema
 */
export const IdeationOutputSchema = z.object({
  angles: z.array(z.object({
    angle: z.string(),
    hookVariants: z.array(z.string()).min(3),
    platform: PlatformSchema,
    formulaUsed: z.string(),
  })),
  citations: z.array(CitationSchema),
});
export type IdeationOutput = z.infer<typeof IdeationOutputSchema>;
