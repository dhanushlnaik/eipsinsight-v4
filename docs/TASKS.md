# EIPsInsight — Remaining Tasks

> Full audit: [Site Map](sitemap.md) · [Architecture](architecture.md). Hours are rough estimates (single developer).

---

## 🔴 Remaining (Top Priority)

### Routing & Docs

| Task | Hours | Where | Notes |
|------|-------|-------|-------|
| **Fix /all route** | ~0.5h | `next.config.ts`, `persona.ts`, `navbar.tsx` | `/all` used by editor persona + navbar "Standards" but no route exists. Add `{ source: "/all", destination: "/standards", permanent: false }` or change persona/navbar to `/standards` |

### API & Access Control

| Task | Hours | Where | Notes |
|------|-------|-------|-------|
| **Private API routes** | 2–4h | oRPC procedures | Enforce auth (session or `x-api-token`) for all data routes; currently some may be public |
| **API token management UI** | 4–6h | `/api-tokens` | Profile links here but page missing — create/revoke tokens, show usage, scopes |
| **Rate limiting per tier** | 3–5h | Middleware / procedures | Enforce `MembershipTier.requestLimit`; track usage per user/token |
| **Token scopes** | 4–6h | `ApiToken` model | Optional: read vs write, per-resource (e.g. analytics-only) |

### Payments & Monetization

| Task | Hours | Where | Notes |
|------|-------|-------|-------|
| **Stripe payment tiers** | 8–12h | Checkout, webhooks | `MembershipTier` exists — add Stripe Products/Prices, checkout flow, subscription lifecycle |
| **Stripe webhooks** | 2–4h | `/api/webhooks/stripe` | Handle `checkout.session.completed`, `customer.subscription.updated/deleted` |
| **x402 agentic payments** | 8–12h | Scraping / API access | HTTP 402 Pay Required — pay-per-request for bots/scrapers; integrate x402 protocol |
| **Tier gating** | 2–4h | UI + procedures | Show upgrade prompts when free tier limit hit; gate premium analytics/export |

### Content & Features

| Task | Hours | Where | Notes |
|------|-------|-------|-------|
| **News** | 6–10h | `/resources/news` | Placeholder → full timeline of EIP ecosystem updates |
| **Videos** | 4–6h | `/resources/videos` | Placeholder → video library/embeds |
| **Featured resources links** | ~1h | `featured.ts` | Links to `/resources/blogs/eip-governance`, `dencun-upgrade` — create those posts or update links |
| **Social & Community Updates** | 4–8h | Home | Not clearly implemented |
| **Analytics export** | 2–4h | `analytics/layout.tsx` | `// TODO: Implement export functionality` |
| **`discussions_to` in proposals** | 1–2h | `proposals.ts` | Add field to schema/response |
| **EIP content from GitHub** | 2–4h | `proposals.ts` | Fetch markdown content |
| **Author page navigation** | 3–6h | `search-bar.tsx` | `// TODO: Navigate to author page when available` |

### Other

| Task | Hours | Where | Notes |
|------|-------|-------|-------|
| **Move repo to Avarch org** | ~0.5h | GitHub/GitLab | Transfer repo to Avarch organisation with full commit history preserved |
| **API documentation** | 4–8h | `/api-docs` or OpenAPI | Public docs for token-based access; examples, rate limits, tiers |
| **CORS for API** | ~1h | RPC / API routes | Allow credentialed cross-origin requests for external clients |

---

## 🟡 Partial / Optional

| Task | Hours | Notes |
|------|-------|-------|
| Documentation Links | 1–2h | `/resources/docs` exists; may need more curation |
| Latest News & Announcements | — | Overlaps with News task |
| Dencun | 1–2h | In timeline; may need dedicated page |
| Upgrade Archive | 2–4h | `/upgrade` lists upgrades; could be enhanced |

---

## ✅ Done

- **Blogs** — DB-backed, admin editor at `/admin/blogs`, public at `/resources/blogs`
- **FAQ** — `/resources/faq`
- **Dashboard, Explore, Search, Analytics, Standards, Tools, Insights, Network Upgrades** — implemented
- **Auth & Admin** — `requireAdmin`, role checks, admin layout
- **Personas** — `PERSONA_DEFAULTS`, `PERSONA_NAV_ORDER`, persona store, client-side redirects
- **Docs** — [sitemap](sitemap.md), [personas](personas.md), [architecture](architecture.md), [branding](branding.md)
