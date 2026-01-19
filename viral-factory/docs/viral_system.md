# Viral System: Formulas & Scoring

This document explains the viral engineering system, including hook formulas, retention techniques, persuasion frameworks, and quality scoring.

## Core Philosophy

**We optimize for virality probability, not virality promises.**

The system uses:
1. Proven content formulas from successful creators
2. Quantitative scoring to measure content quality
3. A/B testing to learn what works
4. Pattern mining to improve over time

## Hook Formulas

Hooks are the first 1-3 seconds of content. They determine if someone stops scrolling.

### Pattern Interrupt Hooks

| Formula | Template | Example |
|---------|----------|---------|
| Do This, Not That | "Stop doing {X}. Do {Y} instead." | "Stop posting 3x a day. Post once with purpose instead." |
| X Mistakes | "{N} {topic} mistakes costing you {result}" | "5 resume mistakes costing you interviews" |
| If I Started Over | "If I had to start {topic} from zero..." | "If I had to build my audience from zero, here's what I'd do" |
| Uncomfortable Truth | "The uncomfortable truth about {topic}..." | "The uncomfortable truth about entrepreneurship" |
| Stop Scrolling | "Stop scrolling if you want {outcome}" | "Stop scrolling if you want to double your income" |

### Curiosity Builders

| Formula | Template | Example |
|---------|----------|---------|
| This Is Why | "This is why {approach} doesn't work" | "This is why posting more doesn't grow your account" |
| Secret Nobody Tells | "The {topic} secret that {experts} won't tell you" | "The algorithm secret that top creators won't tell you" |
| POV Transformation | "POV: You finally {achieved outcome}" | "POV: You finally hit 10k followers" |
| Unpopular Opinion | "Unpopular opinion: {contrarian take}" | "Unpopular opinion: Hustle culture is overrated" |
| In X Seconds | "In {time} seconds, I'll show you {value}" | "In 30 seconds, I'll show you how to 10x productivity" |

### Hook Best Practices

1. **Under 100 characters** (ideally under 80)
2. **Speak directly** to the viewer ("you", not "people")
3. **Create curiosity** with open loops
4. **Include specifics** (numbers, timeframes)
5. **Match platform** (casual for TikTok, professional for LinkedIn)

## Retention Techniques

### Pattern Interrupts

Keep attention every 2-4 seconds:
- Visual: zoom, cut, text overlay
- Audio: sound effect, music change
- Movement: gesture, camera angle shift
- Information: new point, reveal, twist

### Open Loops

Create curiosity gaps that keep viewers watching:
- "In 10 seconds I'll show..."
- "But here's the catch..."
- "Before I tell you, you need to understand..."
- Stack loops: introduce new question before answering previous

### Payoff Timing

Strategic value delivery:
- Micro-payoffs every 5-10 seconds
- Major payoff at 60-70% mark
- Final punch at end for rewatch
- Never front-load all value

## Persuasion Frameworks

### PAS (Problem-Agitate-Solve)

Best for: Pain-point content, product launches

1. **Problem**: Identify the pain clearly
2. **Agitate**: Amplify consequences
3. **Solve**: Present your solution

### AIDA (Attention-Interest-Desire-Action)

Best for: Sales content, announcements

1. **Attention**: Bold claim or visual
2. **Interest**: Unique angle
3. **Desire**: Show transformation
4. **Action**: Clear CTA

### BAB (Before-After-Bridge)

Best for: Transformation content, testimonials

1. **Before**: Current painful situation
2. **After**: Ideal future state
3. **Bridge**: Your solution connects them

### Story-Stack-Offer

Best for: Long-form content, carousels

1. **Story**: Personal or customer hook
2. **Stack**: Layer value (lessons, tips)
3. **Offer**: Natural CTA transition

### Value Ladder CTA

Best for: Building trust, lead generation

1. **Free Value**: Actionable tip first
2. **Soft Bridge**: Mention more exists
3. **Low-friction CTA**: Comment, follow, DM
4. **Optional Hard CTA**: Direct link

## Platform-Specific Structures

### TikTok / Instagram Reels / YouTube Shorts

| Segment | Timing | Purpose |
|---------|--------|---------|
| Hook | 0-1s | Stop the scroll |
| Proof | 1-4s | Why should they listen |
| Value | 4-20s | Core content |
| CTA | Last 2s | Drive action |

### Pinterest

| Element | Focus | Example |
|---------|-------|---------|
| Title | SEO | "10 Minimalist Bedroom Ideas That Actually Work" |
| Description | SEO + Promise | "Transform your bedroom into a peaceful retreat..." |
| Overlay | Scannable | "10 BEDROOM IDEAS" |

### LinkedIn

| Element | Style | Purpose |
|---------|-------|---------|
| First Line | Punchy | Stop the scroll |
| Whitespace | Formatting | Easy to scan |
| Story | Middle | Build credibility |
| Takeaways | Bullets | Concrete value |
| CTA | End | Drive engagement |

## Quality Scoring System

Every asset receives a score from 0-100 based on weighted components:

### Score Components

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| Hook Strength | 25% | Clarity, curiosity, relevance |
| Novelty | 15% | Contrarian angle, fresh perspective |
| Specificity | 15% | Numbers, examples, concrete steps |
| Format | 10% | Skimmability (text) or watch time design (video) |
| CTA Alignment | 15% | Match with offer value proposition |
| Brand Voice | 10% | Tone and banned word compliance |

### Score Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Excellent | Auto-approve |
| 70-79 | Good | Approve |
| 60-69 | Needs Work | Auto-regenerate |
| 0-59 | Poor | Auto-regenerate (max 3x) |

### Scoring Logic

**Hook Strength:**
- +20: Under 100 chars
- +10: Under 15 words
- +5 each: Curiosity triggers ("secret", "truth", "why")
- +10: Contains numbers
- +5: Open loop ("...")

**Novelty:**
- +10 each: Contrarian phrases ("unpopular opinion", "what nobody tells")
- +8 each: Fresh perspective indicators ("new approach", "unconventional")

**Specificity:**
- +20: Contains numbers
- +15: Contains examples
- +15: Contains step-by-step format

**CTA Alignment:**
- +5 each: Action words ("get", "grab", "start")
- +5 each: Value prop keywords
- -10 each: Weak indicators ("maybe", "if you want")

## A/B Variant System

Each asset generates variants for testing:

### Variant Types

| Type | Variants | Purpose |
|------|----------|---------|
| Hook | A vs B | Test different openings |
| CTA | Soft vs Hard | Test direct vs indirect |
| Thumbnail | A vs B | Test visual options |
| Title | 5 options | Test clickability |

### Winner Selection

After metrics are collected:
1. Calculate engagement score per variant
2. Compare within variant groups
3. Mark winners
4. Feed patterns back into prompts

### Pattern Mining

The system learns from top performers:

```javascript
{
  platform: "TIKTOK",
  patternType: "hook",
  details: {
    patterns: [
      "Questions perform well",
      "Numbers in hooks perform well",
      "Negative framing performs well"
    ]
  },
  confidence: 0.7,
  sampleSize: 50
}
```

Patterns with high confidence are used to bias future generations.

## Implementation

The formulas are implemented in `@viral-factory/core`:

```
packages/core/src/
├── viral-formulas/
│   ├── hooks.ts        # Hook formula library
│   └── retention.ts    # Retention & persuasion frameworks
├── scoring/
│   ├── quality.ts      # Quality scorecard calculation
│   └── risk-gate.ts    # Risk assessment
└── prompts/
    ├── viral_ideation.md
    ├── platform_packager.md
    └── quality_rewrite.md
```

## Anti-Hallucination

To prevent false claims:

1. **Citation Required**: Stats and claims must have vault sources
2. **Claim-Light Fallback**: Without sources, use experience-based language
3. **Risk Gate**: Flag unverified statistics
4. **Manual Override**: High-risk content requires human approval

Example transformation:
- ❌ "Studies show 90% of people..."
- ✅ "In my experience, many people..."

This maintains engagement while avoiding misinformation.
