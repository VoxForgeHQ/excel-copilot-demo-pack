/**
 * Viral Hook Formula Library
 * 
 * Reusable frameworks for generating attention-grabbing hooks
 * across platforms.
 */

export interface HookFormula {
  id: string;
  name: string;
  template: string;
  description: string;
  platforms: string[];
  examples: string[];
}

export const HOOK_FORMULAS: HookFormula[] = [
  {
    id: "do-this-not-that",
    name: "Do This, Not That",
    template: "Stop doing {wrong_approach}. Do {right_approach} instead.",
    description: "Contrasts a common mistake with the better alternative",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"],
    examples: [
      "Stop posting 3x a day. Post once with purpose instead.",
      "Stop chasing followers. Start building a community instead.",
    ],
  },
  {
    id: "x-mistakes",
    name: "X Mistakes You're Making",
    template: "{number} {topic} mistakes that are costing you {consequence}",
    description: "Lists common mistakes with clear negative consequence",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN", "PINTEREST"],
    examples: [
      "5 resume mistakes that are costing you interviews",
      "3 content mistakes killing your engagement",
    ],
  },
  {
    id: "if-i-started-over",
    name: "If I Started Over",
    template: "If I had to start {topic} from zero, here's exactly what I'd do",
    description: "Wisdom from experience, appeals to beginners",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"],
    examples: [
      "If I had to build my audience from zero, here's exactly what I'd do",
      "If I started my business over, I'd skip this completely",
    ],
  },
  {
    id: "uncomfortable-truth",
    name: "The Uncomfortable Truth",
    template: "The uncomfortable truth about {topic} that no one talks about",
    description: "Positions as insider knowledge, creates curiosity",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"],
    examples: [
      "The uncomfortable truth about entrepreneurship no one talks about",
      "The uncomfortable truth about why your content isn't working",
    ],
  },
  {
    id: "stop-scrolling",
    name: "Stop Scrolling If...",
    template: "Stop scrolling if you want to {desired_outcome}",
    description: "Pattern interrupt that qualifies the viewer",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
    examples: [
      "Stop scrolling if you want to double your income this year",
      "Stop scrolling if you're tired of algorithm changes",
    ],
  },
  {
    id: "this-is-why-not-working",
    name: "This Is Why X Doesn't Work",
    template: "This is why {common_approach} doesn't work for {audience}",
    description: "Challenges conventional wisdom",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"],
    examples: [
      "This is why posting more content doesn't work for most creators",
      "This is why motivation doesn't work for building habits",
    ],
  },
  {
    id: "secret-nobody-tells",
    name: "Secret Nobody Tells You",
    template: "The {topic} secret that {authority_figures} won't tell you",
    description: "Insider secret angle, builds curiosity",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
    examples: [
      "The algorithm secret that top creators won't tell you",
      "The pricing secret that agencies don't want you to know",
    ],
  },
  {
    id: "pov-transformation",
    name: "POV Transformation",
    template: "POV: You finally {achieved_outcome}",
    description: "Puts viewer in aspirational future state",
    platforms: ["TIKTOK", "INSTAGRAM"],
    examples: [
      "POV: You finally hit 10k followers",
      "POV: You wake up to passive income notifications",
    ],
  },
  {
    id: "unpopular-opinion",
    name: "Unpopular Opinion",
    template: "Unpopular opinion: {contrarian_take}",
    description: "Controversy drives engagement, positions as thought leader",
    platforms: ["LINKEDIN", "TIKTOK", "INSTAGRAM"],
    examples: [
      "Unpopular opinion: Hustle culture is overrated",
      "Unpopular opinion: You don't need a big following to make money",
    ],
  },
  {
    id: "in-seconds",
    name: "In X Seconds",
    template: "In {time} seconds, I'll show you {valuable_thing}",
    description: "Time commitment reduces friction, creates open loop",
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
    examples: [
      "In 30 seconds, I'll show you how to 10x your productivity",
      "In 15 seconds, you'll know why your ads aren't working",
    ],
  },
];

/**
 * Get hooks suitable for a specific platform
 */
export function getHooksForPlatform(platform: string): HookFormula[] {
  return HOOK_FORMULAS.filter((hook) =>
    hook.platforms.includes(platform.toUpperCase())
  );
}

/**
 * Generate hook variants from a formula
 */
export function generateHookVariants(
  formula: HookFormula,
  variables: Record<string, string>,
  count: number = 3
): string[] {
  const variants: string[] = [];
  let template = formula.template;

  // Replace variables in template
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(`{${key}}`, value);
  }

  variants.push(template);

  // Add example-based variants if needed
  for (let i = 0; i < Math.min(count - 1, formula.examples.length); i++) {
    variants.push(formula.examples[i] ?? "");
  }

  return variants.slice(0, count);
}
