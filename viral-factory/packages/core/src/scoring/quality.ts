/**
 * Quality Scoring System
 * 
 * Each generated asset gets a scorecard (0-100) with weighted signals.
 */

export interface ScoreComponent {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  feedback?: string;
}

export interface QualityScorecard {
  overall: number;
  components: ScoreComponent[];
  passed: boolean;
  requiresRegeneration: boolean;
  suggestions: string[];
}

export interface ScoringCriteria {
  hookStrength: {
    clarity: number;
    curiosity: number;
    relevance: number;
  };
  novelty: {
    contrarian: number;
    fresh: number;
  };
  specificity: {
    numbers: boolean;
    examples: boolean;
    concreteSteps: boolean;
  };
  skimmability: number; // for text content
  watchTimeDesign: number; // for video content
  ctaAlignment: number;
  brandVoiceMatch: number;
  riskGate: {
    passed: boolean;
    flags: string[];
  };
}

const DEFAULT_WEIGHTS = {
  hookStrength: 0.25,
  novelty: 0.15,
  specificity: 0.15,
  skimmability: 0.1,
  watchTimeDesign: 0.1,
  ctaAlignment: 0.15,
  brandVoiceMatch: 0.1,
};

const DEFAULT_MIN_SCORE = 70;

/**
 * Calculate hook strength score
 */
export function scoreHook(hook: string, context: {
  topic: string;
  audience: string;
}): { score: number; breakdown: { clarity: number; curiosity: number; relevance: number } } {
  let clarity = 50;
  let curiosity = 50;
  let relevance = 50;

  // Clarity checks
  if (hook.length <= 100) clarity += 20; // concise is better
  if (hook.split(" ").length <= 15) clarity += 10;
  if (!hook.includes(",") || hook.split(",").length <= 2) clarity += 10;
  if (/^[A-Z]/.test(hook)) clarity += 5; // starts with capital
  if (/[.!?]$/.test(hook)) clarity += 5; // ends with punctuation

  // Curiosity checks
  const curiosityTriggers = [
    "secret", "truth", "mistake", "why", "how", "what if",
    "never", "always", "stop", "start", "hidden", "revealed",
    "shocking", "surprising", "unexpected", "finally",
  ];
  const hookLower = hook.toLowerCase();
  curiosityTriggers.forEach((trigger) => {
    if (hookLower.includes(trigger)) curiosity += 5;
  });

  // Numbers boost curiosity
  if (/\d+/.test(hook)) curiosity += 10;

  // Open loops boost curiosity
  if (hookLower.includes("...") || hookLower.includes("but")) curiosity += 5;

  // Relevance checks
  const topicWords = context.topic.toLowerCase().split(" ");
  const audienceWords = context.audience.toLowerCase().split(" ");
  topicWords.forEach((word) => {
    if (hookLower.includes(word) && word.length > 3) relevance += 10;
  });
  audienceWords.forEach((word) => {
    if (hookLower.includes(word) && word.length > 3) relevance += 5;
  });

  // Cap at 100
  clarity = Math.min(100, clarity);
  curiosity = Math.min(100, curiosity);
  relevance = Math.min(100, relevance);

  const score = Math.round((clarity + curiosity + relevance) / 3);

  return {
    score,
    breakdown: { clarity, curiosity, relevance },
  };
}

/**
 * Score CTA alignment with offer
 */
export function scoreCTAAlignment(cta: string, offer: {
  valueProp: string;
  ctaDefaults: { soft: string; hard: string };
}): number {
  let score = 50;

  const ctaLower = cta.toLowerCase();
  const valuePropWords = offer.valueProp.toLowerCase().split(" ");

  // Check for action words
  const actionWords = [
    "get", "grab", "download", "join", "start", "try",
    "discover", "learn", "comment", "dm", "click", "follow",
  ];
  actionWords.forEach((word) => {
    if (ctaLower.includes(word)) score += 5;
  });

  // Check relevance to value prop
  valuePropWords.forEach((word) => {
    if (ctaLower.includes(word) && word.length > 4) score += 5;
  });

  // Check for urgency (but not fake urgency)
  const genuineUrgency = ["now", "today", "limited", "free"];
  genuineUrgency.forEach((word) => {
    if (ctaLower.includes(word)) score += 5;
  });

  // Penalize weak CTAs
  const weakIndicators = ["maybe", "if you want", "whenever", "sometime"];
  weakIndicators.forEach((phrase) => {
    if (ctaLower.includes(phrase)) score -= 10;
  });

  return Math.min(100, Math.max(0, score));
}

/**
 * Score brand voice match
 */
export function scoreBrandVoice(content: string, brand: {
  tone: string[];
  bannedWords: string[];
}): { score: number; violations: string[] } {
  let score = 80;
  const violations: string[] = [];
  const contentLower = content.toLowerCase();

  // Check for banned words
  brand.bannedWords.forEach((word) => {
    if (contentLower.includes(word.toLowerCase())) {
      score -= 15;
      violations.push(`Contains banned word: "${word}"`);
    }
  });

  // Tone checks (simplified - in production would use LLM)
  if (brand.tone.includes("professional")) {
    const casualIndicators = ["lol", "omg", "wtf", "tbh", "ngl"];
    casualIndicators.forEach((indicator) => {
      if (contentLower.includes(indicator)) {
        score -= 5;
        violations.push(`Too casual for professional tone: "${indicator}"`);
      }
    });
  }

  if (brand.tone.includes("friendly")) {
    const coldIndicators = ["must", "required", "mandatory", "failure"];
    coldIndicators.forEach((indicator) => {
      if (contentLower.includes(indicator)) {
        score -= 3;
      }
    });
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    violations,
  };
}

/**
 * Score specificity of content
 */
export function scoreSpecificity(content: string): {
  score: number;
  hasNumbers: boolean;
  hasExamples: boolean;
  hasConcreteSteps: boolean;
} {
  let score = 50;
  const hasNumbers = /\d+/.test(content);
  const hasExamples = /for example|e\.g\.|such as|like when/i.test(content);
  const hasConcreteSteps = /step \d|first,|second,|then,|next,|\d\./i.test(content);

  if (hasNumbers) score += 20;
  if (hasExamples) score += 15;
  if (hasConcreteSteps) score += 15;

  return {
    score: Math.min(100, score),
    hasNumbers,
    hasExamples,
    hasConcreteSteps,
  };
}

/**
 * Score novelty/contrarian angle
 */
export function scoreNovelty(content: string): number {
  let score = 50;
  const contentLower = content.toLowerCase();

  // Contrarian indicators
  const contrarianPhrases = [
    "unpopular opinion",
    "most people think",
    "everyone says",
    "the truth is",
    "what nobody tells you",
    "counter-intuitive",
    "contrary to",
    "actually",
    "the real reason",
  ];

  contrarianPhrases.forEach((phrase) => {
    if (contentLower.includes(phrase)) score += 10;
  });

  // Fresh perspective indicators
  const freshIndicators = [
    "new approach",
    "different way",
    "unconventional",
    "reframe",
    "rethink",
    "overlooked",
  ];

  freshIndicators.forEach((indicator) => {
    if (contentLower.includes(indicator)) score += 8;
  });

  return Math.min(100, score);
}

/**
 * Calculate overall quality score
 */
export function calculateQualityScore(
  content: string,
  context: {
    hook: string;
    cta: string;
    topic: string;
    audience: string;
    offer: { valueProp: string; ctaDefaults: { soft: string; hard: string } };
    brand: { tone: string[]; bannedWords: string[] };
    platform: string;
  },
  minScore: number = DEFAULT_MIN_SCORE
): QualityScorecard {
  const components: ScoreComponent[] = [];
  const suggestions: string[] = [];

  // Hook strength
  const hookResult = scoreHook(context.hook, {
    topic: context.topic,
    audience: context.audience,
  });
  components.push({
    name: "Hook Strength",
    score: hookResult.score,
    weight: DEFAULT_WEIGHTS.hookStrength,
    feedback: `Clarity: ${hookResult.breakdown.clarity}, Curiosity: ${hookResult.breakdown.curiosity}, Relevance: ${hookResult.breakdown.relevance}`,
  });
  if (hookResult.score < 60) {
    suggestions.push("Strengthen hook with more curiosity triggers or specific numbers");
  }

  // Novelty
  const noveltyScore = scoreNovelty(content);
  components.push({
    name: "Novelty",
    score: noveltyScore,
    weight: DEFAULT_WEIGHTS.novelty,
  });
  if (noveltyScore < 50) {
    suggestions.push("Add a contrarian angle or fresh perspective");
  }

  // Specificity
  const specificityResult = scoreSpecificity(content);
  components.push({
    name: "Specificity",
    score: specificityResult.score,
    weight: DEFAULT_WEIGHTS.specificity,
    feedback: `Numbers: ${specificityResult.hasNumbers}, Examples: ${specificityResult.hasExamples}, Steps: ${specificityResult.hasConcreteSteps}`,
  });
  if (specificityResult.score < 60) {
    suggestions.push("Add specific numbers, examples, or concrete steps");
  }

  // Platform-specific scoring
  const isVideoplatform = ["TIKTOK", "INSTAGRAM", "YOUTUBE"].includes(context.platform.toUpperCase());
  if (isVideoplatform) {
    // Watch time design (simplified)
    const watchTimeScore = content.includes("...") || content.includes("but") ? 70 : 50;
    components.push({
      name: "Watch Time Design",
      score: watchTimeScore,
      weight: DEFAULT_WEIGHTS.watchTimeDesign,
    });
  } else {
    // Skimmability for text platforms
    const paragraphs = content.split("\n\n").length;
    const hasBullets = /[-•*]\s/.test(content);
    let skimmabilityScore = 50;
    if (paragraphs >= 3) skimmabilityScore += 15;
    if (hasBullets) skimmabilityScore += 20;
    if (content.length < 2000) skimmabilityScore += 15;
    
    components.push({
      name: "Skimmability",
      score: Math.min(100, skimmabilityScore),
      weight: DEFAULT_WEIGHTS.skimmability,
    });
  }

  // CTA Alignment
  const ctaScore = scoreCTAAlignment(context.cta, context.offer);
  components.push({
    name: "CTA Alignment",
    score: ctaScore,
    weight: DEFAULT_WEIGHTS.ctaAlignment,
  });
  if (ctaScore < 60) {
    suggestions.push("Align CTA more closely with offer value proposition");
  }

  // Brand Voice
  const brandResult = scoreBrandVoice(content, context.brand);
  components.push({
    name: "Brand Voice",
    score: brandResult.score,
    weight: DEFAULT_WEIGHTS.brandVoiceMatch,
    feedback: brandResult.violations.length > 0 ? brandResult.violations.join("; ") : undefined,
  });
  if (brandResult.violations.length > 0) {
    suggestions.push("Remove banned words or adjust tone to match brand voice");
  }

  // Calculate weighted overall score
  const overall = Math.round(
    components.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  const passed = overall >= minScore;
  const requiresRegeneration = overall < minScore;

  return {
    overall,
    components,
    passed,
    requiresRegeneration,
    suggestions: requiresRegeneration ? suggestions : [],
  };
}
