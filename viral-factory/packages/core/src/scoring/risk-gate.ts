/**
 * Risk Gate System
 * 
 * Classifies content for sensitive claims and determines if manual review is needed.
 */

export interface RiskAssessment {
  passed: boolean;
  riskLevel: "low" | "medium" | "high";
  flags: RiskFlag[];
  requiresManualReview: boolean;
  suggestedRewrites: string[];
}

export interface RiskFlag {
  type: RiskType;
  severity: "warning" | "critical";
  description: string;
  matchedText?: string;
}

export type RiskType =
  | "medical_claim"
  | "legal_claim"
  | "financial_claim"
  | "political"
  | "unverified_stat"
  | "absolute_promise"
  | "banned_word"
  | "sensitive_topic";

const SENSITIVE_PATTERNS: { type: RiskType; patterns: RegExp[]; severity: "warning" | "critical" }[] = [
  {
    type: "medical_claim",
    patterns: [
      /\b(cure[sd]?|heal[sd]?|treat[sd]?|prevent[sd]?)\s+(cancer|diabetes|disease|illness|condition)/i,
      /\b(doctor|physician|medical)\s+(recommended|approved|endorsed)/i,
      /\b(clinically\s+proven|scientifically\s+proven)\b/i,
      /\b(lose\s+\d+\s+(pounds?|lbs?|kg)\s+(in|within)\s+\d+\s+(days?|weeks?))/i,
    ],
    severity: "critical",
  },
  {
    type: "legal_claim",
    patterns: [
      /\b(legal\s+advice|not\s+legal\s+advice)\b/i,
      /\b(lawsuit|sue|attorney|lawyer)\s+(guaranteed|promise)/i,
      /\b(100%\s+legal|completely\s+legal|totally\s+legal)\b/i,
    ],
    severity: "critical",
  },
  {
    type: "financial_claim",
    patterns: [
      /\b(guaranteed\s+(returns?|income|profit))\b/i,
      /\b(make\s+\$?\d+[k,]*\s+(per|a)\s+(day|week|month))\b/i,
      /\b(get\s+rich\s+(quick|fast))\b/i,
      /\b(financial\s+freedom\s+in\s+\d+\s+(days?|weeks?|months?))\b/i,
      /\b(passive\s+income\s+guaranteed)\b/i,
    ],
    severity: "critical",
  },
  {
    type: "unverified_stat",
    patterns: [
      /\b(\d+%\s+of\s+(people|users|customers|businesses))\b/i,
      /\b(studies\s+show|research\s+proves|data\s+shows)\b/i,
      /\b(according\s+to\s+(a\s+)?study)\b/i,
    ],
    severity: "warning",
  },
  {
    type: "absolute_promise",
    patterns: [
      /\b(guarantee[sd]?|promise[sd]?)\s+(success|results?|viral|growth)/i,
      /\b(100%\s+(success|guaranteed|effective))\b/i,
      /\b(always\s+works?|never\s+fails?)\b/i,
      /\b(will\s+(definitely|certainly|absolutely)\s+(work|succeed))\b/i,
    ],
    severity: "warning",
  },
  {
    type: "political",
    patterns: [
      /\b(democrat|republican|liberal|conservative)\s+(is|are)\s+(wrong|right|bad|good)/i,
      /\b(vote\s+for|vote\s+against)\b/i,
    ],
    severity: "warning",
  },
];

const BANNED_WORDS_DEFAULT = [
  "guarantee",
  "promise",
  "get rich quick",
  "easy money",
  "100% success",
  "never fail",
  "miracle",
  "secret formula",
];

/**
 * Assess content for risk factors
 */
export function assessRisk(
  content: string,
  options: {
    bannedWords?: string[];
    sensitiveTopics?: string[];
    citations?: { claim: string; source: string }[];
  } = {}
): RiskAssessment {
  const flags: RiskFlag[] = [];
  const suggestedRewrites: string[] = [];
  const bannedWords = options.bannedWords ?? BANNED_WORDS_DEFAULT;
  const sensitiveTopics = options.sensitiveTopics ?? ["medical", "legal", "financial", "political"];
  const citations = options.citations ?? [];
  const contentLower = content.toLowerCase();

  // Check sensitive patterns
  for (const { type, patterns, severity } of SENSITIVE_PATTERNS) {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        flags.push({
          type,
          severity,
          description: getDescriptionForType(type),
          matchedText: match[0],
        });

        // Check if this claim has a citation
        const hasCitation = citations.some((c) =>
          c.claim.toLowerCase().includes(match[0]?.toLowerCase() ?? "")
        );

        if (!hasCitation) {
          suggestedRewrites.push(getSaferAlternative(type, match[0] ?? ""));
        }
      }
    }
  }

  // Check banned words
  for (const word of bannedWords) {
    if (contentLower.includes(word.toLowerCase())) {
      flags.push({
        type: "banned_word",
        severity: "warning",
        description: `Contains banned word: "${word}"`,
        matchedText: word,
      });
      suggestedRewrites.push(`Remove or replace "${word}" with safer language`);
    }
  }

  // Check sensitive topics
  for (const topic of sensitiveTopics) {
    if (contentLower.includes(topic)) {
      // Only flag if making claims about it
      const claimIndicators = ["is", "are", "will", "can", "should", "must"];
      for (const indicator of claimIndicators) {
        const pattern = new RegExp(`${topic}\\s+${indicator}\\s+\\w+`, "i");
        if (pattern.test(content)) {
          flags.push({
            type: "sensitive_topic",
            severity: "warning",
            description: `Makes claims about sensitive topic: ${topic}`,
          });
          break;
        }
      }
    }
  }

  // Determine overall risk level and pass status
  const criticalCount = flags.filter((f) => f.severity === "critical").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;

  let riskLevel: "low" | "medium" | "high";
  let passed: boolean;
  let requiresManualReview: boolean;

  if (criticalCount > 0) {
    riskLevel = "high";
    passed = false;
    requiresManualReview = true;
  } else if (warningCount >= 3) {
    riskLevel = "high";
    passed = false;
    requiresManualReview = true;
  } else if (warningCount >= 1) {
    riskLevel = "medium";
    passed = true; // Can pass with warnings
    requiresManualReview = true;
  } else {
    riskLevel = "low";
    passed = true;
    requiresManualReview = false;
  }

  return {
    passed,
    riskLevel,
    flags,
    requiresManualReview,
    suggestedRewrites,
  };
}

function getDescriptionForType(type: RiskType): string {
  const descriptions: Record<RiskType, string> = {
    medical_claim: "Contains unverified medical claim that may require professional disclaimer",
    legal_claim: "Contains legal claim that may require attorney review",
    financial_claim: "Contains financial promise that may violate FTC guidelines",
    political: "Contains political content that may alienate audience segments",
    unverified_stat: "Contains statistic without verified source citation",
    absolute_promise: "Makes absolute promise that cannot be guaranteed",
    banned_word: "Contains word from brand's banned list",
    sensitive_topic: "Discusses sensitive topic requiring extra care",
  };
  return descriptions[type];
}

function getSaferAlternative(type: RiskType, original: string): string {
  const alternatives: Partial<Record<RiskType, string>> = {
    medical_claim: `Replace "${original}" with experience-based language like "In my experience..." or "Many people find..."`,
    financial_claim: `Replace "${original}" with results-may-vary language like "Potential to earn..." or "Results depend on..."`,
    unverified_stat: `Either cite source for "${original}" or replace with qualitative language like "Many people..." or "Often..."`,
    absolute_promise: `Replace "${original}" with softer language like "designed to help..." or "optimized for..."`,
  };
  return alternatives[type] ?? `Consider rephrasing "${original}" with safer language`;
}

/**
 * Rewrite content to be claim-light (removes unverified claims)
 */
export function rewriteToClaimLight(content: string): {
  rewritten: string;
  changesCount: number;
  changes: string[];
} {
  let rewritten = content;
  const changes: string[] = [];

  // Replace common claim patterns with safer alternatives
  const replacements: [RegExp, string][] = [
    [/\bguaranteed?\s+(to\s+)?/gi, "designed to "],
    [/\bwill\s+definitely\b/gi, "can potentially"],
    [/\balways\s+works?\b/gi, "often works"],
    [/\bnever\s+fails?\b/gi, "rarely fails"],
    [/\b100%\s+/gi, "highly "],
    [/\bproven\s+to\b/gi, "shown to potentially"],
    [/\bstudies\s+show\b/gi, "experience suggests"],
    [/\bresearch\s+proves\b/gi, "observations indicate"],
    [/\bscientifically\s+proven\b/gi, "well-documented"],
  ];

  for (const [pattern, replacement] of replacements) {
    const matches = rewritten.match(pattern);
    if (matches) {
      for (const match of matches) {
        changes.push(`"${match}" → "${replacement.trim()}"`);
      }
      rewritten = rewritten.replace(pattern, replacement);
    }
  }

  return {
    rewritten,
    changesCount: changes.length,
    changes,
  };
}
