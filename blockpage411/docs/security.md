## Security, Auth & Privacy

### Authentication

- **Primary auth**: JWT-based, issued by `/api/auth/verify` after wallet signature.
- **JWT secret**: `JWT_SECRET` must be strong, long, and never checked in.
- **Token transport**: tokens are sent via HTTP-only cookies and/or `Authorization: Bearer` headers. Always use HTTPS in production.
- **Admin auth**:
  - Admin-only APIs (e.g. under `/api/admin/*`) validate that the caller wallet is in `ADMIN_WALLETS` / `NEXT_PUBLIC_ADMIN_WALLETS`.
  - Some admin pages send `x-admin-address` which is checked on the API side.
  - Keep admin wallet list small and review regularly.

### Rate Limiting

- **Redis-backed limiter**: `lib/redisRateLimit.ts` uses `REDIS_URL` to track per-IP usage.
- **Key endpoints with limits** (examples only):
  - `/api/events/create`: protects event spam.
  - `/api/flag/add`: prevents mass-flagging a wallet.
  - `/api/verify/social/request-simple`: request admin review for social verification.
- **Implementation notes**:
  - Limits are configured per-route (window + max requests) and keyed by IP.
  - When the limit is exceeded, APIs return `429` with a JSON error.
  - Redis must be available in production for these protections to work.

### Privacy & Wallet Visibility

- **Wallet model fields** (`lib/walletModel.ts`):
  - `isPublic`: explicit opt-in to showing balances publicly.
  - `unlockLevel`: numeric level representing how “unlocked” a wallet is.
  - `flagsCount`, `riskScore`, `riskCategory`: used for risk and reputation.
- **Visibility helper** (`services/walletVisibilityService.ts`):
  - `computeWalletVisibility(wallet, viewerAddress?, ctx?)` returns:
    - `canSeeBalance`: whether balances/tx details should be shown.
    - `isOwner`, `heavilyFlagged`, `isPublic`, `unlockLevel`.
  - Rules:
    - Owners always see their own balances.
    - Non-owners only see balances if the wallet is heavily flagged, explicitly public, or has sufficient `unlockLevel`.
- **Front-end behavior**:
  - Wallet and profile pages should respect `canSeeBalance` and hide sensitive fields when false.
  - Clients should not rely on this alone; server responses must also be filtered.

### Data Protection

- **MongoDB**:
  - Connection string uses `MONGODB_URI` (and optionally `MONGODB_DB`).
  - Use users/passwords and TLS for production clusters.
- **Redis**:
  - Configured via `REDIS_URL`, used for caching and rate limiting.
  - Protect Redis with authentication and network isolation.
- **Secrets handling**:
  - All API keys and secrets are read from environment variables (see `.env.example`).
  - Do not commit real secrets; use `.env.local` or deployment secrets.

### GivingBlock Webhooks & Encryption

- GivingBlock-related logic lives in `services/givingBlockService.ts` and `/api/webhooks/givingblock`.
- **Secrets**:
  - `GIVINGBLOCK_API_KEY`: used for outbound API calls.
  - `GIVINGBLOCK_WEBHOOK_SECRET`: shared secret used to verify webhook signatures.
  - `GIVINGBLOCK_ENCRYPTION_KEY` / `GIVINGBLOCK_ENCRYPTION_IV`: used for encrypting sensitive payload data at rest.
- Always set these values in production; do not use defaults.
