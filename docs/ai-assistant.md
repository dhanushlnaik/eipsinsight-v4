# AI Assistant — Architecture & Upgrade Spec

## What is this

A conversational assistant embedded in EIPsInsight that answers natural-language questions about the database — "Which editor has merged the most EIPs this year?", "Show me open PRs waiting on editor review for status-change proposals" — by generating and executing safe, read-only SQL queries, then formatting the result in plain English.

This is **Text-to-SQL** + **RAG**: the LLM never sees raw data, only the schema. It generates a query, we run it, we hand the result back to the LLM to narrate. No fine-tuning. No model hosting. No data leaves the server beyond the schema description.

---

## Current State

The bulk of this is already implemented in [`src/server/orpc/procedures/search.ts`](../src/server/orpc/procedures/search.ts). Here's what exists:

### Already built

| Piece | Location | Notes |
|---|---|---|
| Schema context string | `ANALYTICS_SQL_SCHEMA` (line 37) | All 20 queryable tables with their columns |
| Workflow context string | `ASSISTANT_WORKFLOW_CONTEXT` (line 62) | Plain-English explanation of pipeline conventions |
| Table allowlist | `ALLOWED_ANALYTICS_TABLES` (line 75) | Explicit set — any table not listed is blocked |
| SQL blocklist regex | `SQL_BLOCKLIST` (line 99) | Blocks INSERT, UPDATE, DELETE, DROP, ALTER, etc. |
| SQL validation | `enforceSelectOnlySql()` (line 399) | Must start with SELECT/WITH; max 6000 chars; enforces LIMIT ≤ 200 |
| SQL generation | `generateAnalyticsSql()` (line 437) | Calls Cohere `command-r-08-2024`, returns `{title, description, sql}` |
| Query execution | `runAnalyticsQuery()` (line 514) | `prisma.$queryRawUnsafe`, normalizes all cell types |
| Deterministic queries | `runDeterministicAnalyticsQuery()` (line 565) | Hard-coded SQL for "waiting on editor" pattern — bypasses LLM for known queries |
| Answer refinement | `refineAnswerWithCohere()` (line 265) | Takes facts, writes a 1-2 sentence natural-language answer |
| Intent detection | `isAnalyticsQuestion()` (line 351) | Regex-based heuristic to decide whether to run SQL at all |
| Conversation history | `buildEffectiveQuery()` (line 181) | Merges prior user turns for short follow-up queries |
| Main procedure | `answerAndRecommend` (line 1028) | Orchestrates the full pipeline, returns `{answer, confidence, recommendations, dataQuery}` |

### Current LLM: Cohere

Both SQL generation and answer refinement use Cohere `command-r-08-2024` via `env.COHERE_API_KEY`. It works, but Cohere's SQL quality on complex joins is inconsistent. The upgrade path is Claude (see below).

---

## Architecture

```
User question
      │
      ▼
 buildEffectiveQuery()          ← merge with history for short follow-ups
      │
      ├─ isWorkflowContextQuestion?  → return static pipeline summary
      ├─ parseProposalReference?     → exact DB lookup, format answer
      │
      └─ isAnalyticsQuestion?
              │
              ├── runDeterministicAnalyticsQuery()  ← known patterns (fast, no LLM)
              │         └── hits PostgreSQL directly
              │
              └── generateAnalyticsSql()            ← LLM generates SQL
                        │  schema + workflow context
                        │  + conversation history
                        │  → {title, description, sql}
                        │
                  enforceSelectOnlySql()             ← validate: SELECT only,
                        │                              allowed tables, LIMIT cap
                        │
                  prisma.$queryRawUnsafe()           ← execute against Postgres
                        │
                  summarizeDataQueryResult()         ← extract top-row snapshot
                        │
              refineAnswerWithCohere()               ← LLM writes final prose
                        │
                        ▼
         {answer, confidence, recommendations, dataQuery}
```

The `dataQuery` field carries the full result set (columns + rows) to the client so the UI can render a table or chart — the prose answer is a supplement, not the only output.

---

## Security Model

Three layers prevent SQL injection or data exfiltration:

**1. Table allowlist**
```
ALLOWED_ANALYTICS_TABLES = { eips, eip_snapshots, pull_requests, pr_events, ... }
```
Any table not in this set → query rejected. Auth, payment, and session tables are never listed.

**2. SQL blocklist regex**
```
/\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|...)\b/i
```
Any write/DDL keyword → query rejected.

**3. Structural validation in `enforceSelectOnlySql()`**
- Must start with `SELECT` or `WITH`
- Max 6000 characters
- Auto-clamps `LIMIT` to 200 if missing or too high
- Strips trailing semicolons (prevents statement stacking)

The LLM is given **only the schema** (table and column names), never actual data. The generated SQL is validated before execution — the LLM output is treated as untrusted input.

---

## Upgrade: Cohere → Claude

Replace both Cohere calls with the Anthropic SDK. Claude 3.5 Sonnet is significantly better at multi-table SQL joins and understands the Ethereum domain context without extra prompting.

### 1. Install the SDK

```bash
bun add @anthropic-ai/sdk
```

### 2. Add env var

In `src/env.ts`, add:
```ts
ANTHROPIC_API_KEY: z.string().optional(),
```

### 3. Replace `generateAnalyticsSql()`

```ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

async function generateAnalyticsSql(input: {
  question: string
  history: AssistantTurn[]
}): Promise<{ sql: string; title: string; description: string } | null> {
  if (!env.ANTHROPIC_API_KEY) return null

  const prior = input.history
    .slice(-8)
    .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
    .join('\n')

  const systemPrompt = `You are a PostgreSQL analytics query planner for EIPsInsight, an Ethereum standards observability platform.

Generate one SAFE read-only SQL query and short metadata.

Rules:
- Output JSON only. No markdown, no explanation.
- Use only SELECT/WITH and the allowed schema.
- Always include LIMIT <= 100 unless the query is an aggregate returning few rows.
- Prefer grouping by repository when relevant.
- Never reference auth, payment, membership, or user-private tables.
- Valid PostgreSQL syntax only.

Domain context:
${ASSISTANT_WORKFLOW_CONTEXT}

Allowed schema:
${ANALYTICS_SQL_SCHEMA}

Return shape (JSON only):
{"title":"...","description":"...","sql":"..."}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    temperature: 0,
    system: systemPrompt,
    messages: [
      ...(prior ? [{ role: 'user' as const, content: `Prior conversation:\n${prior}` }] : []),
      { role: 'user' as const, content: input.question },
    ],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text : null
  if (!text) return null

  const jsonText = extractJsonObject(text)
  if (!jsonText) return null

  const parsed = JSON.parse(jsonText) as { sql?: string; title?: string; description?: string }
  if (!parsed.sql) return null

  const safeSql = enforceSelectOnlySql(parsed.sql)
  if (!safeSql) return null

  return {
    sql: safeSql,
    title: parsed.title?.trim() || 'Custom analysis',
    description: parsed.description?.trim() || 'Generated from your question.',
  }
}
```

### 4. Replace `refineAnswerWithCohere()`

```ts
async function refineAnswerWithClaude(input: {
  question: string
  baseAnswer: string
  exactProposal: ProposalRow | null
  topMatches: ProposalRow[]
  topGuides: SiteGuide[]
}): Promise<string | null> {
  if (!env.ANTHROPIC_API_KEY) return null

  const facts = { /* same as before */ }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',  // Haiku is fast enough for prose formatting
    max_tokens: 200,
    temperature: 0.1,
    system: `You are a concise assistant for an Ethereum standards website.
Answer in 1-2 short sentences (max 55 words).
Use only the provided facts. If facts are insufficient, say so briefly.
Do not mention links or navigation.`,
    messages: [
      {
        role: 'user',
        content: `Question: ${input.question}\nFacts: ${JSON.stringify(facts)}`,
      },
    ],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text?.trim() : null
  if (!text) return null
  return text.replace(/\s+/g, ' ').slice(0, 420)
}
```

Keep the `COHERE_API_KEY` path as a fallback — if neither key is set, the assistant falls through to deterministic answers only.

---

## Extending: Adding More Deterministic Queries

For any question pattern you can fully anticipate, bypass the LLM entirely in `runDeterministicAnalyticsQuery()`. This is faster, cheaper, and always returns the right result.

Current deterministic patterns:
- "waiting on editor [review]" — any combination

To add a new pattern:

```ts
// Inside runDeterministicAnalyticsQuery()
const asksTopEditors = /\b(top|most active|who.*merged|most.*merge)\b.*\b(editor|editors)\b/.test(q)

if (asksTopEditors) {
  const sql = `
    SELECT actor, COUNT(*) AS merge_count
    FROM contributor_activity
    WHERE action_type = 'merged' AND role = 'editor'
    GROUP BY actor
    ORDER BY merge_count DESC
    LIMIT 10
  `
  // ... run and return
}
```

The deterministic path always runs first (`||` short-circuits to LLM only if deterministic returns null).

---

## UI Integration

The `answerAndRecommend` procedure returns:

```ts
{
  answer: string,            // prose answer (1-2 sentences)
  confidence: 'high' | 'medium' | 'low',
  recommendations: Array<{ title: string; url: string; reason: string }>,
  dataQuery: {               // null if no SQL was run
    title: string
    description: string
    sql: string
    columns: string[]
    rows: Array<Record<string, string | number | boolean | null>>
    rowCount: number
  } | null
}
```

**Suggested UI layout:**

```
┌─────────────────────────────────────────────┐
│  [Chat input: "Which editor merged most..."] │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  answer (prose)                             │
│                                             │
│  [data table if dataQuery != null]          │
│  ┌──────────┬────────────┐                  │
│  │ actor    │ merge_count│                  │
│  │ ansgar   │ 142        │                  │
│  │ lightclient│ 98       │                  │
│  └──────────┴────────────┘                  │
│                                             │
│  "You might also want:"                     │
│  → Analytics Hub  → Standards Explorer      │
└─────────────────────────────────────────────┘
```

The `dataQuery.sql` field can be shown in a collapsed "View query" disclosure for power users. The `confidence` field drives a subtle UI signal (green/yellow dot or no indicator).

---

## Adding Tables to the Schema Context

When new tables are added to Prisma schema, update two places in `search.ts`:

1. **`ANALYTICS_SQL_SCHEMA`** — add the table and its columns
2. **`ALLOWED_ANALYTICS_TABLES`** — add the table name to the Set

If the table contains private user data (email, payment info, session tokens), do **not** add it to either.

---

## What This Is Not

- **Not a chatbot** — it doesn't remember conversations beyond the `history` array passed per request. Session state is the client's responsibility.
- **Not a general LLM** — it only answers questions answerable from the database schema. It won't discuss Ethereum lore, explain cryptography, or hallucinate data.
- **Not a hosted model** — we call an external API (Cohere or Anthropic). Latency is ~1-3s for SQL gen + ~0.5s for execution + ~0.5s for prose. Total p95 ~5s.

---

## Open Questions

- **Streaming**: Should the prose answer stream token-by-token? Both Cohere and Anthropic support SSE streaming. ORPC supports streaming via `eventIterator`. Worth adding once the basic flow is solid.
- **Rate limiting**: `answerAndRecommend` hits the LLM on every call. The middleware layer (`src/server/orpc/middleware/`) has rate limiting hooks — apply a stricter limit (e.g., 20 req/min per user) on this procedure specifically.
- **Caching**: Common questions ("how many EIPs are Final?") return the same SQL result for hours. Redis cache with a 5-min TTL on the `(sql, hour)` key would cut DB load significantly.
- **Homepage placement**: A full-page chat at `/ask` or `/assistant`, or a persistent floating input in the sidebar? The sidebar location keeps it accessible without a route change.
