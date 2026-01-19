# System Architecture

## Overview

The Viral Post Factory is a monorepo built with pnpm workspaces and Turborepo for build orchestration.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VIRAL POST FACTORY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Admin UI   │────▶│  Fastify API │────▶│   Workers    │                │
│  │  (Next.js)   │     │   (REST)     │     │  (BullMQ)    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SHARED PACKAGES                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  @core       │  │  @db         │  │  @worker     │              │   │
│  │  │  - Prompts   │  │  - Prisma    │  │  - Queues    │              │   │
│  │  │  - Formulas  │  │  - Models    │  │  - Jobs      │              │   │
│  │  │  - Scoring   │  │  - Client    │  │  - Handlers  │              │   │
│  │  │  - Schemas   │  │              │  │              │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         INFRASTRUCTURE                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  PostgreSQL  │  │    Redis     │  │   Notion     │              │   │
│  │  │  + pgvector  │  │   (BullMQ)   │  │     API      │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Vault Sync Flow

```
Notion → vaultSync Queue → Extract Text → embedChunks Queue → OpenAI Embeddings → pgvector
```

1. User triggers sync via API or UI
2. `vaultSync` worker fetches pages from Notion databases
3. Extracts clean text and metadata
4. Creates chunks (~500 chars each)
5. `embedChunks` worker generates OpenAI embeddings
6. Stores vectors in PostgreSQL with pgvector

### 2. Content Generation Flow

```
User Input → generateIdeas Queue → RAG Search → LLM → generateAssets Queue → scoreAssets Queue
```

1. User creates batch with topic, brand, offer, platforms
2. `generateIdeas` worker:
   - Searches vault for relevant context (top-K chunks)
   - Fetches active trend cards
   - Calls LLM with viral ideation prompt
   - Produces angles with hook variants
3. For each angle, `generateAssets` worker:
   - Calls LLM with platform packager prompt
   - Creates platform-native content
   - Saves asset with payload
4. `scoreAssets` worker:
   - Calculates quality scorecard
   - Runs risk gate assessment
   - Updates asset status

### 3. Regeneration Flow

```
Low Score Asset → rewriteLowScore Queue → LLM → scoreAssets Queue → (loop up to 3x)
```

1. Assets scoring below threshold (default: 70) queue for rewrite
2. `rewriteLowScore` worker:
   - Sends original + score feedback to LLM
   - Gets improved version
   - Re-scores
3. Loops until passing or max attempts reached

### 4. Publishing Flow

```
Approved Asset → Schedule → schedule Queue → Quiet Hours Check → publish Queue → Platform/Webhook
```

1. User schedules approved asset
2. `schedule` worker:
   - Checks quiet hours
   - Validates risk gate for AUTO mode
   - Queues for publishing at scheduled time
3. `publish` worker:
   - Uses configured connector (mock, webhook, direct API)
   - Creates post record
   - Updates asset status

### 5. Analytics Flow

```
Published Posts → metricsSync Queue → Platform APIs (mock) → patternMining Queue → Winning Patterns
```

1. Periodic metrics sync fetches engagement data
2. Pattern mining analyzes top performers
3. Identifies winning patterns (hooks, formats, etc.)
4. Patterns inform future generation prompts

## Queue Architecture

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| vaultSync | Sync Notion pages | 1 |
| embedChunks | Generate embeddings | 1 |
| generateIdeas | Viral ideation | 2 |
| generateAssets | Platform packaging | 5 |
| scoreAssets | Quality scoring | 5 |
| rewriteLowScore | Improve low scores | 3 |
| schedule | Process schedules | 10 |
| publish | Execute publishing | 5 |
| metricsSync | Fetch metrics | 2 |
| patternMining | Analyze patterns | 1 |

## Database Schema

See `packages/db/prisma/schema.prisma` for full schema.

Key relationships:
- Brand → Offers → ContentBatches → Assets → Variants
- NotionSource → VaultChunks (with embeddings)
- Asset → Schedules → Posts → MetricSnapshots
- Platform → WinningPatterns

## Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Monorepo | pnpm + Turbo | Fast installs, efficient caching |
| API | Fastify | Performance, TypeScript support |
| DB | PostgreSQL | Reliability, pgvector support |
| Vectors | pgvector | Unified DB, good performance |
| Queue | BullMQ + Redis | Reliable, battle-tested |
| Admin UI | Next.js | SSR, great DX |
| Styling | Tailwind + shadcn/ui | Rapid development |
| Logging | pino | Fast, structured logging |
