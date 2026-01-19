/**
 * Retention & Persuasion Formula Library
 * 
 * Frameworks for keeping viewers engaged and driving action.
 */

export interface RetentionFormula {
  id: string;
  name: string;
  description: string;
  structure: string[];
  platforms: string[];
  timing?: string;
}

export const RETENTION_FORMULAS: RetentionFormula[] = [
  {
    id: "pattern-interrupt",
    name: "Pattern Interrupt",
    description: "Break viewer's mental pattern every 2-4 seconds",
    structure: [
      "Visual change (zoom, cut, text)",
      "Audio cue (sound effect, music shift)",
      "Movement or gesture",
      "On-screen text reveal",
    ],
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
    timing: "Every 2-4 seconds for short-form",
  },
  {
    id: "open-loop",
    name: "Open Loop",
    description: "Create curiosity gaps that keep viewers watching",
    structure: [
      "Tease upcoming reveal: 'In 10 seconds I'll show...'",
      "Create anticipation: 'But here's the catch...'",
      "Delay payoff: 'Before I tell you, you need to understand...'",
      "Stack loops: introduce new question before answering previous",
    ],
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
  },
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    description: "Gap between what viewer knows and wants to know",
    structure: [
      "Show result before method",
      "Hint at secret without revealing",
      "Use 'this' instead of naming directly",
      "Promise payoff at specific timestamp",
    ],
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"],
  },
  {
    id: "payoff-timing",
    name: "Payoff Timing",
    description: "Strategic placement of value delivery",
    structure: [
      "Micro-payoffs every 5-10 seconds",
      "Major payoff at 60-70% mark",
      "Final punch at end for rewatch",
      "Never front-load all value",
    ],
    platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
  },
];

export interface PersuasionFormula {
  id: string;
  name: string;
  acronym?: string;
  steps: { name: string; description: string }[];
  bestFor: string[];
  platforms: string[];
}

export const PERSUASION_FORMULAS: PersuasionFormula[] = [
  {
    id: "pas",
    name: "Problem-Agitate-Solve",
    acronym: "PAS",
    steps: [
      { name: "Problem", description: "Identify the pain point clearly" },
      { name: "Agitate", description: "Amplify the pain, show consequences" },
      { name: "Solve", description: "Present your solution as relief" },
    ],
    bestFor: ["Pain-point content", "Product launches", "Service offers"],
    platforms: ["LINKEDIN", "INSTAGRAM", "TIKTOK", "YOUTUBE"],
  },
  {
    id: "aida",
    name: "Attention-Interest-Desire-Action",
    acronym: "AIDA",
    steps: [
      { name: "Attention", description: "Hook with bold claim or visual" },
      { name: "Interest", description: "Build curiosity with unique angle" },
      { name: "Desire", description: "Show transformation/benefits" },
      { name: "Action", description: "Clear, specific CTA" },
    ],
    bestFor: ["Sales content", "Launch announcements", "Ads"],
    platforms: ["PINTEREST", "INSTAGRAM", "LINKEDIN", "YOUTUBE"],
  },
  {
    id: "4u",
    name: "Useful-Urgent-Unique-Ultra-specific",
    acronym: "4U",
    steps: [
      { name: "Useful", description: "Provide clear practical value" },
      { name: "Urgent", description: "Create time-sensitivity" },
      { name: "Unique", description: "Differentiate from alternatives" },
      { name: "Ultra-specific", description: "Use concrete numbers/details" },
    ],
    bestFor: ["Headlines", "Pin titles", "Email subjects"],
    platforms: ["PINTEREST", "LINKEDIN"],
  },
  {
    id: "bab",
    name: "Before-After-Bridge",
    acronym: "BAB",
    steps: [
      { name: "Before", description: "Paint current painful situation" },
      { name: "After", description: "Show ideal future state" },
      { name: "Bridge", description: "Your offer connects them" },
    ],
    bestFor: ["Transformation content", "Testimonials", "Case studies"],
    platforms: ["LINKEDIN", "INSTAGRAM", "YOUTUBE"],
  },
  {
    id: "story-stack-offer",
    name: "Story-Stack-Offer",
    steps: [
      { name: "Story", description: "Personal or customer story hook" },
      { name: "Stack", description: "Layer value: lessons, tips, insights" },
      { name: "Offer", description: "Natural transition to CTA" },
    ],
    bestFor: ["Long-form content", "Carousel posts", "LinkedIn articles"],
    platforms: ["LINKEDIN", "INSTAGRAM"],
  },
  {
    id: "value-ladder-cta",
    name: "Value Ladder CTA",
    steps: [
      { name: "Free Value", description: "Give actionable tip first" },
      { name: "Soft Bridge", description: "Mention more exists" },
      { name: "Low-friction CTA", description: "Comment, follow, or DM" },
      { name: "Optional Hard CTA", description: "Direct link if appropriate" },
    ],
    bestFor: ["Building trust", "Lead generation", "Community building"],
    platforms: ["TIKTOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"],
  },
];

/**
 * Platform-specific content structures
 */
export interface PlatformStructure {
  platform: string;
  name: string;
  segments: { name: string; timing: string; purpose: string }[];
}

export const PLATFORM_STRUCTURES: PlatformStructure[] = [
  {
    platform: "TIKTOK",
    name: "Short-Form Video Structure",
    segments: [
      { name: "Hook", timing: "0-1s", purpose: "Stop the scroll, qualify viewer" },
      { name: "Proof", timing: "1-4s", purpose: "Establish credibility quickly" },
      { name: "Steps/Value", timing: "4-20s", purpose: "Deliver core content" },
      { name: "CTA", timing: "Last 2s", purpose: "Drive action" },
    ],
  },
  {
    platform: "INSTAGRAM",
    name: "Reel/Story Structure",
    segments: [
      { name: "Hook", timing: "0-1s", purpose: "Pattern interrupt" },
      { name: "Proof", timing: "1-4s", purpose: "Why they should listen" },
      { name: "Steps/Value", timing: "4-20s", purpose: "Deliver transformation" },
      { name: "CTA", timing: "Last 2s", purpose: "Save, share, or follow" },
    ],
  },
  {
    platform: "YOUTUBE",
    name: "Shorts Structure",
    segments: [
      { name: "Hook", timing: "0-2s", purpose: "Bold claim or question" },
      { name: "Context", timing: "2-5s", purpose: "Set up the value" },
      { name: "Value", timing: "5-25s", purpose: "Deliver insight" },
      { name: "CTA/Loop", timing: "Last 5s", purpose: "Subscribe or rewatch hook" },
    ],
  },
  {
    platform: "PINTEREST",
    name: "Pin Structure",
    segments: [
      { name: "Title", timing: "SEO", purpose: "Keyword-rich, searchable" },
      { name: "Description", timing: "SEO + Promise", purpose: "Value prop + keywords" },
      { name: "Overlay Text", timing: "Visual", purpose: "Scannable promise" },
      { name: "URL", timing: "CTA", purpose: "Clear destination" },
    ],
  },
  {
    platform: "LINKEDIN",
    name: "Post Structure",
    segments: [
      { name: "First Line", timing: "Hook", purpose: "Punchy, curiosity-building" },
      { name: "Whitespace", timing: "Format", purpose: "Easy to scan" },
      { name: "Mini-Story", timing: "Middle", purpose: "Context and credibility" },
      { name: "Takeaways", timing: "Value", purpose: "Bullet points of wisdom" },
      { name: "CTA", timing: "End", purpose: "Engage or convert" },
    ],
  },
];

export function getPersuasionForPlatform(platform: string): PersuasionFormula[] {
  return PERSUASION_FORMULAS.filter((formula) =>
    formula.platforms.includes(platform.toUpperCase())
  );
}

export function getStructureForPlatform(platform: string): PlatformStructure | undefined {
  return PLATFORM_STRUCTURES.find(
    (s) => s.platform === platform.toUpperCase()
  );
}
