# VOXFORGE Viral Post Factory

> 🚀 Generate high-quality, platform-native content designed to maximize shareability, retention, saves, clicks, and conversions.

A production-ready monorepo that ingests your Notion knowledge vault via RAG, generates viral content using proven formulas, scores quality automatically, and publishes to Pinterest, Instagram, TikTok, YouTube, and LinkedIn.

## ⚡ 5-Minute Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Notion integration token (for vault sync)
- OpenAI API key (for content generation)

### Quick Start

```bash
# 1. Clone and navigate
cd viral-factory

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your API keys

# 4. Start databases
pnpm db:up

# 5. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 6. Seed demo data
pnpm db:seed

# 7. Start development servers
pnpm dev
```

Open:
- **Admin UI**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 📁 Project Structure

```
viral-factory/
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # Next.js Admin UI
├── packages/
│   ├── core/         # Prompts, formulas, scoring
│   ├── db/           # Prisma schema & client
│   └── worker/       # BullMQ job processors
├── docs/             # Documentation
└── docker-compose.yml
```

## 🔑 Environment Variables

See `.env.example` for all available options. Critical ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `NOTION_TOKEN` | Notion integration secret |
| `NOTION_DATABASE_IDS` | Comma-separated Notion DB IDs |
| `OPENAI_API_KEY` | OpenAI API key |
| `AUTO_PUBLISH_ENABLED` | Enable auto-publishing (default: false) |

## 🔄 Core Workflow

1. **Sync Vault** - Pull content from Notion, create embeddings
2. **Create Batch** - Define brand, offer, topic, and target platforms
3. **Generate** - AI creates platform-native content using viral formulas
4. **Score** - Quality gate evaluates each asset (0-100)
5. **Review** - Low scores auto-regenerate; approve passing assets
6. **Schedule/Publish** - Queue for publishing with timezone awareness
7. **Analyze** - Track metrics and mine winning patterns

## 🧠 Notion RAG Integration

The system uses your Notion workspace as a "Knowledge Vault":

1. Create a Notion integration at https://developers.notion.com
2. Share target databases with the integration
3. Add database IDs to `NOTION_DATABASE_IDS`
4. Call `POST /vault/sync` to pull and embed content

See [docs/notion_rag.md](docs/notion_rag.md) for best practices.

## 📊 Quality Scoring

Every asset receives a quality scorecard:

- **Hook Strength** (25%): Clarity, curiosity, relevance
- **Novelty** (15%): Contrarian angle, fresh perspective
- **Specificity** (15%): Numbers, examples, concrete steps
- **Skimmability/Watch Time** (10%): Format optimization
- **CTA Alignment** (15%): Match with offer value prop
- **Brand Voice** (10%): Tone and banned words
- **Risk Gate** (pass/fail): Claims, sensitive topics

Assets below threshold auto-regenerate up to 3 times.

## 🎯 Supported Platforms

| Platform | Asset Types |
|----------|-------------|
| Pinterest | Pin (title, description, keywords, overlay text) |
| Instagram | Carousel, Reel script with timing |
| TikTok | 15-35s scripts, hooks, shot list |
| YouTube | Shorts script, titles, thumbnails |
| LinkedIn | Authority post, Story post |

## 🔐 Safety & Compliance

- **Safe Mode** (default): Manual approval required
- **Auto Mode**: Optional, requires Risk Gate pass
- **Anti-hallucination**: Claims without sources degrade to experience-based language
- **Quiet Hours**: No auto-publishing during configured hours

See [docs/auto_publish.md](docs/auto_publish.md) for configuration.

## 📖 API Endpoints

### Vault
- `GET /vault/status` - Sync status
- `GET /vault/sources` - List synced sources
- `POST /vault/sync` - Trigger sync
- `POST /vault/search` - Semantic search

### Batches
- `GET /batches` - List batches
- `GET /batches/:id` - Get batch details
- `POST /batches` - Create batch
- `POST /batches/:id/generate` - Start generation

### Assets
- `GET /assets` - List assets
- `GET /assets/:id` - Get asset details
- `POST /assets/:id/regenerate` - Regenerate asset
- `POST /assets/:id/approve` - Approve asset
- `POST /assets/:id/schedule` - Schedule asset

### Publishing
- `POST /publish/:id` - Publish asset
- `GET /publish/scheduled` - List scheduled
- `GET /publish/posts` - List published

### Analytics
- `GET /analytics/weekly` - Weekly summary
- `GET /analytics/patterns` - Winning patterns
- `GET /analytics/calendar` - Calendar view

## 🛠 Development

```bash
# Run all services
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Database commands
pnpm db:up          # Start Docker services
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema changes
pnpm db:migrate     # Create migration
pnpm db:seed        # Seed demo data
pnpm db:studio      # Open Prisma Studio
```

## 📚 Documentation

- [Architecture](docs/architecture.md) - System design and flow
- [Notion RAG](docs/notion_rag.md) - Setting up your knowledge vault
- [Auto Publish](docs/auto_publish.md) - Publishing and risk gates
- [Viral System](docs/viral_system.md) - Formulas and scoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint && pnpm build`
5. Submit a pull request

## ⚠️ Disclaimer

This system optimizes for *virality probability* with testing and feedback loops. It does **not** promise or guarantee viral results. Content performance depends on many factors including audience, timing, platform algorithms, and content quality.

## 📄 License

Private - All rights reserved.
