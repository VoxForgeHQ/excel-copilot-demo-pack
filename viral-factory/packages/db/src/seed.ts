import { prisma } from "./index.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo Brand
  const brand = await prisma.brand.upsert({
    where: { id: "demo-brand" },
    update: {},
    create: {
      id: "demo-brand",
      name: "VOXFORGE Demo Brand",
      tone: ["professional", "friendly", "witty", "actionable"],
      language: "en",
      bannedWords: ["guarantee", "promise", "viral", "easy money", "get rich"],
      voiceExamples: {
        intro: "Here's the thing no one tells you about...",
        cta: "Drop a comment if you want the full breakdown.",
        style: "Conversational but backed by data. Never salesy.",
      },
    },
  });
  console.log("✅ Created demo brand:", brand.name);

  // Create demo Offer
  const offer = await prisma.offer.upsert({
    where: { id: "demo-offer" },
    update: {},
    create: {
      id: "demo-offer",
      brandId: brand.id,
      name: "Free Content Strategy Guide",
      url: "https://example.com/content-guide",
      valueProp:
        "A step-by-step framework to create content that converts, without spending hours every day",
      audience:
        "Busy entrepreneurs and marketers who want to grow their audience organically",
      ctaDefaults: {
        soft: "Comment 'GUIDE' and I'll send it to you",
        hard: "Grab your free copy now → link in bio",
      },
    },
  });
  console.log("✅ Created demo offer:", offer.name);

  // Create demo Topics
  const topics = await Promise.all([
    prisma.topic.upsert({
      where: { id: "topic-content" },
      update: {},
      create: {
        id: "topic-content",
        name: "Content Creation",
        pillars: [
          "Content strategy",
          "Writing tips",
          "Video creation",
          "Repurposing",
        ],
        keywords: [
          "content creation",
          "social media tips",
          "viral content",
          "engagement",
        ],
      },
    }),
    prisma.topic.upsert({
      where: { id: "topic-marketing" },
      update: {},
      create: {
        id: "topic-marketing",
        name: "Digital Marketing",
        pillars: ["SEO", "Paid ads", "Email marketing", "Conversion optimization"],
        keywords: [
          "digital marketing",
          "online marketing",
          "marketing strategy",
          "growth hacks",
        ],
      },
    }),
    prisma.topic.upsert({
      where: { id: "topic-productivity" },
      update: {},
      create: {
        id: "topic-productivity",
        name: "Productivity & Systems",
        pillars: [
          "Time management",
          "Automation",
          "Workflows",
          "Tool recommendations",
        ],
        keywords: [
          "productivity tips",
          "work smarter",
          "automation",
          "efficiency",
        ],
      },
    }),
  ]);
  console.log("✅ Created", topics.length, "demo topics");

  // Create sample TrendCards
  const trendCards = await Promise.all([
    prisma.trendCard.upsert({
      where: { id: "trend-1" },
      update: {},
      create: {
        id: "trend-1",
        platform: "TIKTOK",
        phrase: "POV: You finally figured out",
        angle: "Transformation/before-after reveal",
        source: "TikTok Creative Center",
        evidence: "1.2B views on related hashtag",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.trendCard.upsert({
      where: { id: "trend-2" },
      update: {},
      create: {
        id: "trend-2",
        platform: "INSTAGRAM",
        phrase: "Things I wish I knew before",
        angle: "Regret-to-wisdom transformation",
        source: "Instagram Explore analysis",
        evidence: "High save rate on similar posts",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.trendCard.upsert({
      where: { id: "trend-3" },
      update: {},
      create: {
        id: "trend-3",
        platform: "LINKEDIN",
        phrase: "Unpopular opinion:",
        angle: "Contrarian thought leadership",
        source: "LinkedIn trending posts",
        evidence: "High engagement on controversial takes",
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.trendCard.upsert({
      where: { id: "trend-4" },
      update: {},
      create: {
        id: "trend-4",
        platform: "PINTEREST",
        phrase: "aesthetic [topic] inspiration",
        angle: "Visual mood board style",
        source: "Pinterest Trends tool",
        evidence: "Steady growth in search volume",
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.trendCard.upsert({
      where: { id: "trend-5" },
      update: {},
      create: {
        id: "trend-5",
        platform: "YOUTUBE",
        phrase: "I tried [X] for 30 days",
        angle: "Challenge/experiment format",
        source: "YouTube Shorts trending",
        evidence: "High watch time retention",
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log("✅ Created", trendCards.length, "demo trend cards");

  // Initialize vault sync status
  await prisma.vaultSyncStatus.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      status: "pending",
      sourcesCount: 0,
      chunksCount: 0,
    },
  });
  console.log("✅ Initialized vault sync status");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
