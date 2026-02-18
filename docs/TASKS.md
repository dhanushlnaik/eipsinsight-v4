# EIPsInsight — Remaining Tasks

> Full audit: [Site Map](README.md)

---

## 🔴 Remaining (Top Priority)

### API & Access Control

| Task | Where | Notes |
|------|-------|-------|
| **Private API routes** | oRPC procedures | Enforce auth (session or `x-api-token`) for all data routes; currently some may be public |
| **API token management UI** | `/api-tokens` | Profile links here but page missing — create/revoke tokens, show usage, scopes |
| **Rate limiting per tier** | Middleware / procedures | Enforce `MembershipTier.requestLimit`; track usage per user/token |
| **Token scopes** | `ApiToken` model | Optional: read vs write, per-resource (e.g. analytics-only) |

### Payments & Monetization

| Task | Where | Notes |
|------|-------|-------|
| **Stripe payment tiers** | Checkout, webhooks | `MembershipTier` exists — add Stripe Products/Prices, checkout flow, subscription lifecycle |
| **Stripe webhooks** | `/api/webhooks/stripe` | Handle `checkout.session.completed`, `customer.subscription.updated/deleted` |
| **x402 agentic payments** | Scraping / API access | HTTP 402 Pay Required — pay-per-request for bots/scrapers; integrate x402 protocol |
| **Tier gating** | UI + procedures | Show upgrade prompts when free tier limit hit; gate premium analytics/export |

### Content & Features

| Task | Where | Notes |
|------|-------|-------|
| **News** | `/resources/news` | Placeholder → full timeline of EIP ecosystem updates |
| **Videos** | `/resources/videos` | Placeholder → video library/embeds |
| **Featured resources links** | `featured.ts` | Links to `/resources/blogs/eip-governance`, `dencun-upgrade` — create those posts or update links |
| **Social & Community Updates** | Home | Not clearly implemented |
| **Analytics export** | `analytics/layout.tsx` | `// TODO: Implement export functionality` |
| **`discussions_to` in proposals** | `proposals.ts` | Add field to schema/response |
| **EIP content from GitHub** | `proposals.ts` | Fetch markdown content |
| **Author page navigation** | `search-bar.tsx` | `// TODO: Navigate to author page when available` |

### Other

| Task | Where | Notes |
|------|-------|-------|
| **Move repo to Avarch org** | GitHub/GitLab | Transfer repo to Avarch organisation with full commit history preserved |
| **API documentation** | `/api-docs` or OpenAPI | Public docs for token-based access; examples, rate limits, tiers |
| **CORS for API** | RPC / API routes | Allow credentialed cross-origin requests for external clients |

---

## 🟡 Partial / Optional

| Task | Notes |
|------|-------|
| Documentation Links | `/resources/docs` exists; may need more curation |
| Latest News & Announcements | Home may show some; dedicated News is placeholder |
| Dencun | In timeline; may need dedicated page |
| Upgrade Archive | `/upgrade` lists upgrades; could be enhanced |

---

## ✅ Done

- **Blogs** — DB-backed, admin editor at `/admin/blogs`, public at `/resources/blogs`
- **FAQ** — `/resources/faq`
- **Dashboard, Explore, Search, Analytics, Standards, Tools, Insights, Network Upgrades** — implemented
- **Auth & Admin** — `requireAdmin`, role checks, admin layout
