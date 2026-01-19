# Notion RAG Integration

This guide explains how to set up and structure your Notion workspace for optimal content retrieval.

## Overview

The Viral Post Factory uses Retrieval-Augmented Generation (RAG) to:
1. Pull content from your Notion databases
2. Create semantic embeddings using OpenAI
3. Retrieve relevant context when generating content
4. Cite sources in generated content

## Setup

### 1. Create a Notion Integration

1. Go to [Notion Developers](https://developers.notion.com/)
2. Click "Create new integration"
3. Name it (e.g., "Viral Factory")
4. Select your workspace
5. Copy the "Internal Integration Secret"

### 2. Share Databases

For each database you want to sync:
1. Open the database in Notion
2. Click "..." menu → "Connections"
3. Add your integration

### 3. Configure Environment

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxx
NOTION_DATABASE_IDS=db1_id,db2_id,db3_id
```

Get database IDs from the URL: `notion.so/{workspace}/{database_id}?v=...`

## Structuring Your Vault

### Recommended Database Properties

For optimal retrieval, structure your content database with:

| Property | Type | Purpose |
|----------|------|---------|
| Title | Title | Page name (required) |
| Tags | Multi-select | Topics, themes, categories |
| Pillar | Select | Content pillar (e.g., "Marketing", "Sales") |
| Product | Select | Related product/offer |
| Type | Select | Content type (tip, story, case study) |
| Status | Select | Draft, Published, Archive |

### Content Organization

#### Option 1: Single Knowledge Base

One database with all content, categorized by tags:

```
📚 Knowledge Vault
├── 📄 5 Mistakes in Content Strategy [tags: content, mistakes]
├── 📄 How We Grew to 100k [tags: growth, case-study]
├── 📄 LinkedIn Algorithm Tips [tags: linkedin, tips]
└── ...
```

#### Option 2: Multiple Databases

Separate databases by content type:

```
🗂 Vault
├── 📚 Blog Posts
├── 📚 Case Studies  
├── 📚 Tips & Tricks
├── 📚 Industry Research
└── 📚 Customer Stories
```

### Content Best Practices

1. **Be Specific**: Include concrete numbers, steps, and examples
2. **Add Context**: Explain the "why" behind claims
3. **Include Sources**: Link to original research or data
4. **Use Clear Structure**: Headers, bullets, numbered lists
5. **Tag Thoroughly**: More tags = better retrieval

## How Retrieval Works

### Chunking

Pages are split into ~500 character chunks at paragraph boundaries. This means:
- Keep related content in the same paragraph
- Use headers to separate distinct topics
- Avoid very long paragraphs

### Embedding & Search

1. Each chunk gets a 1536-dimension embedding (text-embedding-3-small)
2. Query text is also embedded
3. Cosine similarity finds top-K most relevant chunks
4. Retrieved chunks are injected into prompts

### Citation Format

When content is retrieved, citations include:
- Page title
- Page URL
- Block anchor (if available)
- Relevance score

Example prompt injection:
```
## Context from Knowledge Vault

[Source: LinkedIn Algorithm Tips](notion.so/page123)
> The LinkedIn algorithm prioritizes engagement in the first hour.
> Posts with 3+ hashtags get 20% more reach.

[Source: Content Strategy Guide](notion.so/page456)
> Consistency beats virality. Post 3-5x per week minimum.
```

## Sync Configuration

### Full Sync

Pull all pages:
```bash
POST /api/vault/sync
```

### Selective Sync

Specify databases:
```bash
POST /api/vault/sync
{
  "databaseIds": ["specific_db_id"],
  "force": true
}
```

### Sync Schedule

In production, schedule syncs via cron:
```yaml
# Every 6 hours
0 */6 * * * curl -X POST https://yourapi.com/vault/sync
```

## Troubleshooting

### "No sources synced"

1. Check `NOTION_TOKEN` is correct
2. Verify databases are shared with integration
3. Check `NOTION_DATABASE_IDS` format (comma-separated, no spaces)

### "Chunks have no embeddings"

1. Verify `OPENAI_API_KEY` is set
2. Check Redis is running (embedding queue needs it)
3. View worker logs for errors

### Poor Retrieval Quality

1. Add more specific tags to pages
2. Ensure content is well-structured
3. Check chunk size (very short pages may not embed well)
4. Try increasing `topK` in search

## Advanced: Custom Metadata

The system extracts these Notion property types:
- `select` → single string value
- `multi_select` → array of strings
- `rich_text` → concatenated text

Custom properties are stored in `metadata` JSON and used for:
- Filtering during retrieval
- Organizing in the UI
- Building more targeted prompts

## Example Vault Structure

```
📚 VOX Knowledge Vault
│
├── 🏷️ Content Creation
│   ├── 📄 The Hook Formula That Gets 90% Scroll-Stop Rate
│   ├── 📄 7 Content Formats That Convert
│   └── 📄 How to Repurpose 1 Post into 10
│
├── 🏷️ Platform Strategy
│   ├── 📄 LinkedIn: Best Practices 2024
│   ├── 📄 TikTok Algorithm Decoded
│   ├── 📄 Instagram Carousel vs Reels: When to Use
│   └── 📄 Pinterest SEO Fundamentals
│
├── 🏷️ Case Studies
│   ├── 📄 How Client X Grew 500% in 6 Months
│   └── 📄 The $0 to $100k Newsletter Journey
│
└── 🏷️ Frameworks
    ├── 📄 PAS: Problem-Agitate-Solve
    ├── 📄 The Value Ladder CTA Method
    └── 📄 Hook-Proof-Value-CTA Structure
```

Each page should have:
- Clear, descriptive title
- Relevant tags
- Well-formatted content
- Links to sources for any claims
