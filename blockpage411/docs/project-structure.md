# Blockpage411 — Project Structure

This document describes the repository layout for the Blockpage411 Next.js application, including where UI routes live, how API endpoints are organized, and where core business logic (risk scoring, providers, URL audits) sits.

## At a Glance (Top-Level)

At the root of the app (the `blockpage411/` folder), the most important directories are:

- **app/** — Next.js App Router UI (public pages + admin pages)
- **pages/** — Next.js Pages Router (primarily API routes under `pages/api/*`, plus a few legacy pages)
- **components/** — shared React UI components
- **lib/** — server-side infrastructure + Mongoose models + helpers (DB, auth, logging, rate limit, notifications)
- **services/** — core business logic and integrations (chain explorers, risk scoring, URL auditing)
- **models/** — additional data/model helpers (project-specific)
- **utils/** / **types/** — shared utilities and type definitions
- **__tests__/** — Jest tests (API and service-level)
- **e2e/** — Playwright end-to-end tests
- **docs/** — contributor and operations documentation

Other notable folders:

- **public/** — static assets
- **styles/** — global styles and Tailwind-related styles
- **scripts/** — maintenance tasks, migrations, dev helpers
- **audits/** — artifacts/reports used for analysis and review
- **data/** — static data inputs (including URL fingerprint lists)

## Routing Model (UI vs API)

This repo uses *both* Next.js routing systems:

### App Router (UI)

UI pages are primarily implemented as App Router routes in app/.

Common entrypoints:

- App shell/layout: app/layout.tsx
- Landing page: app/page.tsx
- Global error boundaries: app/error.tsx, app/global-error.tsx
- Not found handling: app/not-found.tsx and app/_not-found.tsx

Examples of App Router route directories:

- app/admin/… — admin UI (wallet-gated + admin-only flows)
- app/profile/… — user profile
- app/search/… — search
- app/wallet/… — wallet pages

### Pages Router (API)

API routes live under pages/api/ and are consumed by the Next.js UI.

Examples:

- pages/api/admin/* — admin-only APIs protected by admin middleware
- pages/api/webhooks/* — inbound integration webhooks (e.g., Giving Block)
- pages/api/wallet/* — wallet and chain data APIs

There are also a few non-API Pages Router pages (legacy/utility), e.g. pages/admin-actions.tsx.

## Middleware / Access Control

- Request-level auth redirect middleware: middleware.ts
  - Guards certain prefixes (e.g. `/profile`, `/admin`) and redirects to `/login` when missing a session token.

- Admin authorization is handled separately in server-side API middleware utilities in lib/.

## Core Server-Side “Infrastructure” (lib/)

The lib/ directory is the backbone for server-side code:

- Database
  - lib/db.ts — MongoDB connection
  - lib/redis.ts / lib/redisCache.ts / lib/redisRateLimit.ts — Redis utilities (optional)

- Auth + Admin gating
  - lib/adminMiddleware.ts — admin route protection and admin identity

- Persistence (Mongoose models)
  - lib/*Model.ts files contain schemas/models used by API routes and services
  - Example (URL audits): lib/urlAuditModel.ts

- Notifications and alerting
  - lib/notify.ts — Slack/admin notification
  - lib/notifyEmail.ts — email notifications

- Rate limiting
  - lib/rateLimit.ts — lightweight per-request limiting

- Logging/observability
  - lib/logger.ts
  - lib/sentry.ts

## Business Logic & Integrations (services/)

The services/ directory contains the bulk of “real logic” (and is what API routes usually call).

Major areas:

- Multi-chain support and explorers
  - services/etherscan.ts, services/bscscan.ts, services/polygonscan.ts
  - services/solana.ts, services/solscan.ts
  - services/tronscan.ts

- Risk scoring
  - services/riskScorer.ts
  - services/risk/*
  - services/reputation/*

- Giving Block integration
  - services/givingBlockService.ts

- URL auditing (bad URLs / drainer-style detection)
  - services/urlAudit/auditUrl.ts — main audit pipeline (static fetch + heuristics + fingerprint/clone checks + optional dynamic signals)
  - services/urlAudit/fingerprints.ts — known-good fingerprint loading/matching helpers
  - services/urlAudit/dynamicSandbox.ts — optional Playwright-based dynamic scan (environment-gated; skipped on Vercel)

## URL Threat Scan Feature (End-to-End)

This feature is split across UI, API, service logic, and persistence.

### Public UI

- app/url-threat-scan/page.tsx
  - Public-facing UX (“URL Threat Scan”)
  - Submits URL to a public API endpoint and renders the resulting risk score and reasons.

### Public API

- pages/api/url/audit.ts
  - Public POST endpoint
  - Runs `auditUrl()` and stores results
  - Triggers alerting when the score exceeds a threshold

### Admin UI + Admin APIs

- app/admin/url-audits/page.tsx
  - Admin view: submit a URL and browse recent audits

- pages/api/admin/url-audits.ts
  - Admin list + create audit

- pages/api/admin/url-audits/[id].ts
  - Admin fetch by id

### Persistence

- lib/urlAuditModel.ts
  - Stores URL, host, content-type, status, risk score/category, reasons, and `signals` (mixed)

### Fingerprints / Clone Detection

- data/url-fingerprints.known-good.json
  - Local list of known-good normalized fingerprints (used to detect “same content on a different hostname” clones)

### Dynamic Analysis (Optional)

- services/urlAudit/dynamicSandbox.ts
  - Uses Playwright (if installed) to:
    - load the page
    - click a small set of CTA-like elements
    - capture attempted `window.ethereum.request()` calls
    - capture limited console/network sampling

Dynamic analysis is gated by environment variables and is skipped when running on Vercel.

#### Production dynamic analysis (Vercel-safe worker)

To support dynamic analysis in production on Vercel, this repo can enqueue an external worker and accept a signed callback:

- Enqueue happens after the static audit is stored.
- The worker posts results back to a callback API route.
- The callback recomputes `riskScore`, `riskCategory`, and `reasons` by applying the dynamic scoring delta on top of the stored base score.

Callback route:

- `POST /api/url/audit-dynamic-callback`
  - Requires header: `x-bp411-signature` (HMAC-SHA256 over the raw JSON body)
  - Body shape (minimal): `{ "auditId": string, "dynamic": { enabled: boolean, walletRequests?: Array<{method:string}>, clicked?: string[] }, "jobId"?: string }`

Required env vars:

- `DYNAMIC_WORKER_URL` — base URL of your worker service (the app posts to `${DYNAMIC_WORKER_URL}/url-audit/dynamic`)
- `DYNAMIC_WORKER_SECRET` — shared secret used to sign enqueue requests and verify callbacks

Worker reference implementation (runs outside Vercel):

- `scripts/url_audit_dynamic_worker.ts`
  - Run it on a VM/container with Node.js 20+ and Playwright installed.
  - Suggested commands:
    - `npm run install:playwright`
    - `DYNAMIC_WORKER_SECRET=... PORT=8787 npx ts-node scripts/url_audit_dynamic_worker.ts`

Render deployment (recommended quick path):

- Blueprint file at repo root: `render.yaml`
- Worker Dockerfile: `blockpage411/Dockerfile.dynamic-worker`
- Worker health check: `GET /healthz`

On Render:

- Create a **New → Blueprint** from this repo (Render will read `render.yaml`).
- Set env var `DYNAMIC_WORKER_SECRET` on the worker service.

After deploy:

- Copy the worker public URL (e.g. `https://blockpage411-dynamic-worker.onrender.com`).
- Set in Vercel (Blockpage411 app):
  - `DYNAMIC_WORKER_URL` = that URL (no trailing path)
  - `DYNAMIC_WORKER_SECRET` = same value as worker
  - `SITE_ORIGIN` = `https://www.blockpages411.com`

Related env vars:

- `SITE_ORIGIN` or `NEXT_PUBLIC_SITE_ORIGIN` — used to build the absolute callback URL (recommended in production)
- `URL_AUDIT_ALERT_SCORE` — score threshold (0–100) for Slack/email alerts
- `ENABLE_URL_AUDIT_DYNAMIC` — enables local Playwright sandboxing (not recommended on Vercel)

## Shared UI Components

- components/ contains cross-route components (cards, badges, layout blocks)
- Admin layouts commonly live under app/components or are imported into admin routes

Example:

- components/RiskBadge.tsx — displayed in URL Threat Scan and other risk UIs

## Tests

- Unit/integration tests: __tests__/
  - Focus on API route behavior and core service logic.

- End-to-end tests: e2e/ + playwright.config.ts

- Jest setup/config
  - jest.config.js, jest.setup.js

## Scripts / Tooling

- package.json scripts provide the main dev workflow:
  - `npm run dev` — local dev
  - `npm run build` / `npm run start` — production build + run
  - `npm test` — Jest test suite
  - `npm run test:e2e` — Playwright

- scripts/ contains:
  - migrations
  - dev polling helpers
  - websocket utilities
  - data sync helpers

## Configuration Files

Key configuration entrypoints:

- next.config.ts — Next.js config (rewrites, image patterns, webpack alias shims)
- tsconfig.json — TS config and path aliases (e.g. `@/*`)
- tailwind.config.js + postcss.config.js — Tailwind pipeline
- vercel.json + VERCEL_CONFIG.md — deployment guidance
- next-sitemap.config.js — sitemap generation (`postbuild`)

## Deployment Notes (Vercel)

- Static URL auditing (fetch + heuristics + fingerprint matching) is designed to run in serverless.
- Dynamic sandboxing (Playwright browser automation) is intentionally environment-gated and skipped on Vercel; for production dynamic scanning, use a separate worker runtime (container/VM) and call it asynchronously.

---

## API Index (`pages/api/*`)

This is a **developer-oriented index** of the Next.js API routes implemented under `pages/api/`.

- For webhook specifics, see docs/webhooks.md.

### How routing works in this repo

- Files under `pages/api/**` map to URLs under `/api/**`.
- `pages/api/foo.ts` → `GET/POST /api/foo`
- `pages/api/foo/index.ts` → `GET/POST /api/foo`
- Dynamic segments use Next’s bracket syntax:
  - `pages/api/wallet/[chain]/[address].ts` → `/api/wallet/:chain/:address`

### Common server patterns (what most routes do)

- **DB connection**: most handlers call `lib/db` (Mongoose/MongoDB).
- **Auth / admin gating**:
  - Admin APIs typically use `lib/adminMiddleware` (`withAdminAuth`).
  - UI route gating (redirects to `/login`) is handled by middleware.ts.
- **Rate limiting**: some public endpoints call `lib/rateLimit`.
- **Alerts / notifications**:
  - Slack/admin notification: `lib/notify`.
  - Email notification: `lib/notifyEmail`.

### API groups

#### Diagnostics

- `/api/_diag` — quick diagnostic endpoint
  - Source: `pages/api/_diag.ts`

#### Auth & session

- `/api/auth/nonce` — nonce generation for wallet signature
  - Source: `pages/api/auth/nonce.ts`
- `/api/auth/verify` — verify signature and issue session/JWT
  - Source: `pages/api/auth/verify.ts`
- `/api/auth/status` — session status (used by UI)
  - Source: `pages/api/auth/status.ts`
- `/api/auth/logout` — clear session
  - Source: `pages/api/auth/logout.ts`

#### Current user & profile

- `/api/me` — current user profile
  - Source: `pages/api/me.ts`
- `/api/me.patch` — patch/update profile fields
  - Source: `pages/api/me.patch.ts`

- `/api/profile` — profile entrypoint (list/create depending on method)
  - Source: `pages/api/profile/index.ts`
- `/api/profile/[address]` — fetch profile by wallet address
  - Source: `pages/api/profile/[address].ts`
- `/api/profile/update` — update profile
  - Source: `pages/api/profile/update.ts`
- `/api/profile/social-links` — social links management
  - Source: `pages/api/profile/social-links.ts`

#### Verification (email + social)

- `/api/verify/email/request` — request email verification
  - Source: `pages/api/verify/email/request.ts`
- `/api/verify/email/confirm` — confirm email verification
  - Source: `pages/api/verify/email/confirm.ts`

- `/api/verify/social/request-simple` — request social verification review
  - Source: `pages/api/verify/social/request-simple.ts`
- `/api/verify/social/request-bulk` — request social verification review (bulk)
  - Source: `pages/api/verify/social/request-bulk.ts`
- `/api/verify/social/request` — social verification request (legacy/alternate flow)
  - Source: `pages/api/verify/social/request.ts`
- `/api/verify/social/confirm` — confirm social verification (legacy/alternate flow)
  - Source: `pages/api/verify/social/confirm.ts`

#### Wallets & resolution

- `/api/wallet/[chain]/[address]` — wallet profile/details
  - Source: `pages/api/wallet/[chain]/[address].ts`
- `/api/wallet/risk` — wallet risk scoring endpoint
  - Source: `pages/api/wallet/risk.ts`
- `/api/wallet/popular` — popular wallets
  - Source: `pages/api/wallet/popular.ts`
- `/api/wallet/suspicious` — suspicious wallets
  - Source: `pages/api/wallet/suspicious.ts`
- `/api/wallet/updateMetadata` — user-supplied metadata updates
  - Source: `pages/api/wallet/updateMetadata.ts`
- `/api/wallet/exchange-metadata` — exchange metadata for UI
  - Source: `pages/api/wallet/exchange-metadata.ts`

- `/api/wallets/verify` — verify wallet ownership
  - Source: `pages/api/wallets/verify.ts`

- `/api/resolve-wallet` — resolve input to wallet address (multi-chain)
  - Source: `pages/api/resolve-wallet.ts`

#### Search

- `/api/search` — primary search endpoint
  - Source: `pages/api/search.ts`
- `/api/searchFlags` — search flags
  - Source: `pages/api/searchFlags.ts`

#### Flags, ratings, reports

- `/api/flag/add` — add a flag
  - Source: `pages/api/flag/add.ts`
- `/api/flag/status/[chain]/[address]` — flag status lookup
  - Source: `pages/api/flag/status/[chain]/[address].ts`

- `/api/flags` — flags list/moderation helpers
  - Source: `pages/api/flags.ts`
- `/api/flags/remaining` — remaining flags quota
  - Source: `pages/api/flags/remaining.ts`
- `/api/flags/deleteFlag` — delete a flag
  - Source: `pages/api/flags/deleteFlag.ts`
- `/api/flags/hideFlagComment` — hide/moderate a flag comment
  - Source: `pages/api/flags/hideFlagComment.ts`

- `/api/ratings` — create/fetch ratings
  - Source: `pages/api/ratings.ts`
- `/api/tx/ratings` — transaction rating helpers
  - Source: `pages/api/tx/ratings.ts`

- `/api/reports` — reports entrypoint
  - Source: `pages/api/reports/index.ts`
- `/api/report-wallet` — report a wallet
  - Source: `pages/api/report-wallet.ts`

#### Providers & exchanges

- `/api/providers` — provider list
  - Source: `pages/api/providers/index.ts`

- `/api/exchanges` — exchange list
  - Source: `pages/api/exchanges/index.ts`
- `/api/exchanges/sync` — sync exchanges into provider data
  - Source: `pages/api/exchanges/sync.ts`

#### Charities

- `/api/charities` — main charities endpoint
  - Source: `pages/api/charities/index.ts`
- `/api/charities/list` — list for selection
  - Source: `pages/api/charities/list.ts`
- `/api/charities/[id]` — charity detail
  - Source: `pages/api/charities/[id].ts`

Admin/seed utilities:

- `/api/charities/seed-local` — Source: `pages/api/charities/seed-local.ts`
- `/api/charities/seed-givingblock` — Source: `pages/api/charities/seed-givingblock.ts`
- `/api/charities/sync` — Source: `pages/api/charities/sync.ts`
- `/api/charities/refresh-cache` — Source: `pages/api/charities/refresh-cache.ts`

#### Fundraisers

- `/api/fundraisers` — fundraiser list
  - Source: `pages/api/fundraisers.ts`
- `/api/fundraisers/[address]` — fundraiser by address
  - Source: `pages/api/fundraisers/[address].ts`
- `/api/fundraisers/id/[id]` — fundraiser by internal id
  - Source: `pages/api/fundraisers/id/[id].ts`

Workflows:

- `/api/fundraisers/pledge` — Source: `pages/api/fundraisers/pledge.ts`
- `/api/fundraisers/verify-onchain` — Source: `pages/api/fundraisers/verify-onchain.ts`
- `/api/fundraisers/invite` — Source: `pages/api/fundraisers/invite.ts`

Admin views:

- `/api/fundraisers/admin` — Source: `pages/api/fundraisers/admin.ts`
- `/api/fundraisers/admin/pledges` — Source: `pages/api/fundraisers/admin/pledges.ts`

#### Campaigns

- `/api/campaigns` — campaigns entrypoint
  - Source: `pages/api/campaigns/index.ts`
- `/api/campaigns/list` — list
  - Source: `pages/api/campaigns/list.ts`
- `/api/campaigns/create` — create
  - Source: `pages/api/campaigns/create.ts`
- `/api/campaigns/[address]` — campaign by address
  - Source: `pages/api/campaigns/[address].ts`
- `/api/campaigns/id/[id]` — campaign by internal id
  - Source: `pages/api/campaigns/id/[id].ts`

Workflows:

- `/api/campaigns/pledge` — Source: `pages/api/campaigns/pledge.ts`
- `/api/campaigns/verify-onchain` — Source: `pages/api/campaigns/verify-onchain.ts`
- `/api/campaigns/invite` — Source: `pages/api/campaigns/invite.ts`

Admin views:

- `/api/campaigns/admin` — Source: `pages/api/campaigns/admin.ts`
- `/api/campaigns/admin/pledges` — Source: `pages/api/campaigns/admin/pledges.ts`

#### Events

- `/api/events/create` — Source: `pages/api/events/create.ts`
- `/api/events/list` — Source: `pages/api/events/list.ts`
- `/api/events/byUser` — Source: `pages/api/events/byUser/index.ts`
- `/api/events/byUser/[id]` — Source: `pages/api/events/byUser/[id].ts`

#### Realtime & poller

- `/api/realtime/token` — Source: `pages/api/realtime/token.ts`
- `/api/realtime/publish` — Source: `pages/api/realtime/publish.ts`
- `/api/realtime/admin-publish` — Source: `pages/api/realtime/admin-publish.ts`
- `/api/realtime/simulate` — Source: `pages/api/realtime/simulate.ts`

- `/api/poller/run` — trigger poller job (secret-gated)
  - Source: `pages/api/poller/run.ts`

#### Webhooks

- `/api/webhooks/givingblock` — Giving Block webhook receiver
  - Source: `pages/api/webhooks/givingblock.ts`
- `/api/webhooks/givingblock-test` — local/test helper
  - Source: `pages/api/webhooks/givingblock-test.ts`

#### KYC

- `/api/kyc-request` — Source: `pages/api/kyc-request.ts`
- `/api/kyc-webhook` — Source: `pages/api/kyc-webhook.ts`
- `/api/kyc/challenge` — Source: `pages/api/kyc/challenge.ts`
- `/api/kyc/verify` — Source: `pages/api/kyc/verify.ts`

#### URL Threat Scan / URL audits

- `/api/url/audit` — public URL audit endpoint (rate limited)
  - Source: `pages/api/url/audit.ts`

Admin:

- `/api/admin/url-audits` — list/create URL audits (admin-gated)
  - Source: `pages/api/admin/url-audits.ts`
- `/api/admin/url-audits/[id]` — fetch a single URL audit
  - Source: `pages/api/admin/url-audits/[id].ts`

#### Admin APIs (operations console)

All routes under `/api/admin/*` are intended for internal/admin operations (moderation, dashboards, settings, etc.). Start with:

- `/api/admin/check` — Source: `pages/api/admin/check.ts`
- `/api/admin/summary` — Source: `pages/api/admin/summary.ts`
- `/api/admin/stats` — Source: `pages/api/admin/stats.ts`
- `/api/admin/alerts` (+ `/api/admin/alerts/health`, `/api/admin/alerts/retry`) — Source: `pages/api/admin/alerts.ts`

For the full list, browse the folder: `pages/api/admin/`.

### Notes

- This index intentionally avoids duplicating every single `/api/admin/*` sub-route description; those routes are numerous and best understood by opening the handler file.
- If you want a fully exhaustive list (including detected HTTP methods), it can be generated directly from the filesystem and kept updated.
