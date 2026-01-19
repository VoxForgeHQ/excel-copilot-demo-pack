# Auto-Publishing & Risk Gates

This guide covers publishing modes, risk assessment, and safety configurations.

## Publishing Modes

### 1. Mock Mode (Default)

Simulates publishing without actually posting to platforms.

```json
POST /publish/:assetId
{
  "mode": "MOCK"
}
```

Use for:
- Testing the full workflow
- Development environments
- Demo purposes

### 2. Manual Mode

Creates a scheduled post that requires manual approval to publish.

```json
POST /assets/:id/schedule
{
  "scheduledAt": "2024-01-15T10:00:00Z",
  "publishMode": "MANUAL"
}
```

The post will:
1. Appear in the scheduled queue
2. Wait for explicit publish trigger
3. Send notification (if configured)

### 3. Auto Mode

Automatically publishes when scheduled time arrives, **IF**:
- `AUTO_PUBLISH_ENABLED=true`
- Risk Gate passes
- Not during quiet hours
- Asset is in "APPROVED" status

```json
POST /assets/:id/schedule
{
  "scheduledAt": "2024-01-15T10:00:00Z",
  "publishMode": "AUTO"
}
```

## Risk Gate

Every piece of content is assessed for potential risks before auto-publishing.

### Risk Categories

| Category | Severity | Description |
|----------|----------|-------------|
| Medical Claims | Critical | Claims about curing/treating conditions |
| Legal Claims | Critical | Legal advice or guaranteed outcomes |
| Financial Claims | Critical | Guaranteed income or "get rich" promises |
| Unverified Stats | Warning | Statistics without citations |
| Absolute Promises | Warning | "Always works", "Guaranteed success" |
| Political Content | Warning | Partisan statements |
| Sensitive Topics | Warning | Medical, legal, financial advice |
| Banned Words | Warning | Brand-specific banned words |

### Risk Levels

- **Low**: 0 warnings, 0 critical → Auto-publish allowed
- **Medium**: 1-2 warnings, 0 critical → Auto-publish allowed with flag
- **High**: 3+ warnings OR any critical → Auto-publish blocked

### What Happens When Risk Gate Fails

1. Auto-publish is blocked
2. Asset status stays "APPROVED"
3. Schedule status set to "PENDING" (requires manual review)
4. Risk flags are visible in the UI
5. Suggested rewrites are provided

## Configuration

### Environment Variables

```env
# Enable auto-publishing globally
AUTO_PUBLISH_ENABLED=true

# Quiet hours (UTC) - no auto-publishing during these hours
QUIET_HOURS_START=23
QUIET_HOURS_END=7

# Default timezone for scheduling
DEFAULT_TIMEZONE=America/New_York

# Topics requiring extra care
SENSITIVE_TOPICS=medical,legal,financial,political

# Minimum quality score for publishing
MIN_ASSET_SCORE=70
```

### Brand-Level Settings

Each brand can have custom banned words:

```json
{
  "name": "My Brand",
  "bannedWords": [
    "guarantee",
    "promise", 
    "viral",
    "easy money",
    "get rich"
  ]
}
```

## Quiet Hours

Quiet hours prevent auto-publishing during specified times (UTC):

```
QUIET_HOURS_START=23
QUIET_HOURS_END=7
```

This means no auto-publishing between 11 PM and 7 AM UTC.

When a scheduled post falls in quiet hours:
1. Post is automatically delayed
2. Reschedules for end of quiet hours
3. Logs the delay reason

## Claim-Light Rewrites

When content fails risk assessment, the system can generate safer alternatives:

**Before (risky):**
> "This strategy is guaranteed to double your income in 30 days"

**After (claim-light):**
> "This strategy has helped many entrepreneurs increase their revenue"

### Automatic Replacements

| Risky Pattern | Safer Alternative |
|---------------|-------------------|
| "guaranteed to" | "designed to help" |
| "will definitely" | "can potentially" |
| "always works" | "often works" |
| "100% success" | "high success rate" |
| "studies show" | "experience suggests" |

## Publishing Connectors

### Mock Connector (Always Available)

```javascript
// Simulates success with mock response
{
  success: true,
  externalId: "mock_instagram_1234567890",
  response: { mock: true, timestamp: "..." }
}
```

### Webhook Connectors

For integration with Zapier, Make, or custom webhooks:

```env
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/...
MAKE_WEBHOOK_URL=https://hook.make.com/...
```

Payload sent:
```json
{
  "platform": "INSTAGRAM",
  "payload": { ... full asset content ... },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Platform API Connectors

For direct publishing (when available):

```env
# Pinterest
PINTEREST_ACCESS_TOKEN=...
PINTEREST_BOARD_ID=...

# Instagram/Facebook  
META_ACCESS_TOKEN=...
META_INSTAGRAM_ACCOUNT_ID=...

# TikTok
TIKTOK_ACCESS_TOKEN=...

# YouTube
YOUTUBE_API_KEY=...
YOUTUBE_REFRESH_TOKEN=...

# LinkedIn
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_PERSON_URN=...
```

Note: Direct API publishing requires platform approval and compliance with their terms.

## Best Practices

### 1. Start in Safe Mode

Keep `AUTO_PUBLISH_ENABLED=false` until you're confident in content quality.

### 2. Review First Few Batches

Manually review generated content before enabling auto-publish.

### 3. Configure Quiet Hours

Match quiet hours to when your audience is least active.

### 4. Set Appropriate Thresholds

Increase `MIN_ASSET_SCORE` for higher quality standards:
- 60: Lenient (more content, some rough edges)
- 70: Balanced (default)
- 80: Strict (fewer posts, higher quality)

### 5. Add Brand-Specific Banned Words

Include terms that don't fit your brand or could cause issues:
- Competitor names
- Industry-specific sensitive terms
- Words that triggered issues before

### 6. Monitor and Adjust

Use the analytics dashboard to:
- Track which content performs well
- Identify patterns in flagged content
- Adjust risk settings based on experience

## Compliance Disclaimer

This system provides automated content generation and publishing with built-in safety checks. However:

1. **Human Review Recommended**: Always review auto-published content periodically
2. **Platform Compliance**: Ensure content meets each platform's community guidelines
3. **Industry Regulations**: Add industry-specific checks for regulated fields
4. **No Legal Advice**: This system does not provide legal compliance guarantees

For regulated industries (healthcare, finance, legal), consider:
- Keeping auto-publish disabled
- Adding mandatory human review steps
- Consulting compliance professionals
