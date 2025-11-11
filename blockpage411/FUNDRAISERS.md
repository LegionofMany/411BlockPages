# Fundraisers & On-chain Donation Guide

This document explains the production setup for Fundraisers using on-chain donations (no Stripe). It includes environment variables, verification behavior, the poller, and operational notes.

Required env variables
- `MONGODB_URI` - MongoDB connection string
- `ETH_RPC_URL` - Ethereum-compatible RPC (Infura/Alchemy) for better tx/receipt access
- `POLYGON_RPC_URL` - (optional) Polygon RPC
- `BSC_RPC_URL` - (optional) BSC RPC
- `ETHERSCAN_API_KEY`, `POLYGONSCAN_API_KEY`, `BSCSCAN_API_KEY` - optional explorer API keys
- `REDIS_URL` - optional for queueing/workers
- `ADMIN_WALLET` / `NEXT_PUBLIC_ADMIN_WALLETS` - admin wallet(s)

On-chain verification
- Endpoint: `POST /api/fundraisers/verify-onchain` with body `{ fundraiserId, chain, txHash, donor?, amount? }`.
- Behavior:
  - Verifies that `txHash` is associated with `fundraiser.walletAddress`.
  - Uses a provider-backed detection for EVM chains (via `services/evm.ts`) that checks native transfers and ERC-20 `Transfer` logs and attempts to read token symbol/decimals to compute amounts.
  - Falls back to explorer APIs (Etherscan/Blockstream/Solscan/Tronscan) when provider detection is unavailable.
  - Creates an idempotent `Pledge` (externalId = txHash). If fundraiser.currency equals the detected token/native symbol, the fundraiser's `raised` amount is incremented automatically.

Token support
- ERC-20 token detection for EVM chains is implemented (best-effort). Some token contracts may block symbol/decimals reads. When those reads fail the system will store the pledge using available raw values and mark the currency as the token contract address when symbol is unavailable.
- SPL/TRC-20 detection is not fully automatic; the poller records pledges for non-EVM chains using explorer tx lists and leaves amount reconciliation to admins for now.

Poller
- Location: `scripts/poller.ts` (single-run) and `scripts/poller-worker.ts` (cron wrapper).
- Usage:

```powershell
# Run once (ts-node or compiled):
node scripts/poller.ts

# Run cron worker (runs poller every 2 minutes by default):
node scripts/poller-worker.ts
```

- The poller scans `Fundraiser` documents with `active: true`, fetches recent txs for the configured chain, and auto-creates `Pledge` records when it finds new tx hashes. For EVM chains it uses provider-backed detection to parse amounts and tokens.

Vercel deployment notes
-----------------------
- This app is a full Next.js application and is designed to run on Vercel. There is no external server required.
- The background poller is exposed as a serverless API at `/api/poller/run` and can be scheduled on Vercel using the Cron/CRON Jobs feature (or an external scheduler hitting the endpoint).
- Protect the poller endpoint by setting `POLLER_SECRET` in your Vercel environment variables or rely on Vercel's `x-vercel-cron` header.

Vercel setup checklist
- Add environment variables in the Vercel dashboard: `MONGODB_URI`, `REDIS_URL`, `ETH_RPC_URL`, `POLYGON_RPC_URL`, `BSC_RPC_URL`, `SOLANA_RPC_URL`, `TRON_NODE_URL`, `NEXT_PUBLIC_APP_URL`, `POLLER_SECRET`, `POLLER_SLACK_WEBHOOK` (optional).
- Enable Vercel Cron Jobs and create a job for `/api/poller/run` with your desired schedule (e.g., every 15 minutes).
- Ensure your MongoDB is configured as a replica set (required for transactions used by `createPledgeAtomic`).


Security & operational hardening
- Rate-limit requests to `/api/fundraisers/verify-onchain` and other public endpoints (a simple rate limiter exists at `lib/rateLimit.ts`). Consider moving to a Redis-backed sliding-window for production.
- Configure RPC providers (Infura/Alchemy) to avoid rate-limits and add retries/timeouts on provider calls.
- Add monitoring around the poller and provider errors; log failures to a central system.

Testing & CI
- A basic test harness is provided at `scripts/test-harness.ts`. Add unit tests for `services/evm.ts` and `pages/api/fundraisers/verify-onchain.ts` and guard these in CI.
- Recommended: add a GitHub Actions workflow to run `npm ci`, `npm run lint`, and `npm test` on PRs.

Deployment checklist
1. Configure production `.env` or secret store with RPC and MongoDB URIs.
2. Ensure `ETH_RPC_URL` is set (preferred) and explorer API keys as needed.
3. Run DB migrations if any.
4. Deploy app, start poller-worker (systemd/PM2/container cron), and monitor logs.

If you'd like, I can add a GitHub Actions CI file, expand tests, or improve token parsing for SPL/TRC chains next.
# Fundraisers & Webhook Setup

This document describes the migration, webhook, and pledge flow required to run Fundraisers in production.

Required env variables
- MONGODB_URI - MongoDB connection
- JWT_SECRET - JWT secret for admin tokens
- NEXT_PUBLIC_ADMIN_WALLETS - comma-separated admin wallet addresses
- ETHERSCAN_API_KEY - optional Etherscan API key (improves EVM verification)
- POLYGONSCAN_API_KEY - optional Polygonscan API key
- BSCSCAN_API_KEY - optional BscScan API key
- NEXT_PUBLIC_APP_URL - the public app url used for building links

Migration
- A migration script exists at `scripts/migrate_fundraisers.js` (CommonJS) and `scripts/migrate_fundraisers.ts`.
- Dry-run:

```powershell
node scripts/migrate_fundraisers.js --dry
```

- Apply:

```powershell
node scripts/migrate_fundraisers.js --apply
```

On-chain verification
- Endpoint: `pages/api/fundraisers/verify-onchain.ts` — POST { fundraiserId, chain, txHash, donor?, amount? }.
  - Verifies the transaction was sent to the fundraiser.walletAddress using block-explorer APIs or RPC providers.
  - Creates an idempotent `Pledge` (externalId = txHash) and, if fundraiser.currency matches the chain native token, increments `Fundraiser.raised`.
  - For token transfers (ERC-20/SPL/TRC-20) the server currently does not parse token amounts; token detection is a planned enhancement.

Webhook / polling
- This project uses on-chain verification rather than third-party payment webhooks. You can:
  - Manually paste tx hashes into the fundraiser page form (recommended for simple flows).
  - Run a background poller to scan the fundraiser.walletAddress for new transactions and auto-record pledges (recommended for production).

Admin
- Admin endpoint: `pages/api/fundraisers/admin.ts`.
- Supports either:
  - `x-admin-wallet` header set to an admin wallet defined in `NEXT_PUBLIC_ADMIN_WALLETS`, or
  - `Authorization: Bearer <token>` JWT where the payload contains `admin: true` or `address` that matches the admin list.

Admin APIs
- List pledges: `GET /api/fundraisers/admin/pledges?fundraiserId=<id>` (admin only) — returns recent pledges for moderation/export.

Testing locally
- Install dependencies: `npm install`
- Run lint: `npm run lint`
- Run build (after verifying envs): `npm run build`

Rate limiting & logging
- A simple rate limiter is applied to critical endpoints (pledge and verify-onchain) via `lib/rateLimit.ts` to limit abuse.
- Webhook signature failures and processing errors are logged to `logs/webhook-errors.log` by `lib/logger.ts`.

Admin CSV export
- Admin can export pledges as CSV via: `GET /api/fundraisers/admin/pledges?fundraiserId=<id>&format=csv` (admin only).
