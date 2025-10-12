# Environment setup and Vercel deployment checklist

This document explains the environment variables required for local development and production (Vercel). Follow these steps before running migrations or deploying.

## Required variables
- MONGODB_URI — MongoDB connection string. Must point to a replica set for transactions (e.g., MongoDB Atlas cluster URI). Example:
  - mongodb+srv://user:pass@cluster0.gfzfiqs.mongodb.net/dbname?retryWrites=true&w=majority
- REDIS_URL — Redis connection string used for rate limiting and caches.
- ETH_RPC_URL, POLYGON_RPC_URL, BSC_RPC_URL — EVM RPC endpoints.
- SOLANA_RPC_URL — Solana RPC endpoint (used as fallback for transaction queries).
- TRON_NODE_URL — Tron RPC endpoint (used as fallback for transaction queries).
- NEXT_PUBLIC_APP_URL — Public app URL (used for metrics and links).
- POLLER_SECRET — Secret to protect `/api/poller/run` when not invoked by Vercel Cron.
- POLLER_SLACK_WEBHOOK — Optional Slack webhook for poller alerts.

## Optional but recommended
- ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY, BSCSCAN_API_KEY — improves tx verification.
- ABLY_API_KEY / NEXT_PUBLIC_ABLY_KEY — realtime messaging keys.
- BASE_URL — used by some services to post metrics (defaults to `http://localhost:3000`).

## Security: rotate secrets if exposed
If any secrets from `.env.local` have been committed or exposed, rotate them immediately in the provider (MongoDB user, Redis password, Ably key, etc.).

## Vercel setup
1. Go to your Vercel project > Settings > Environment Variables.
2. Add each variable (set the `Environment` to Preview/Production as appropriate).
3. For secrets like `POLLER_SECRET`, mark them as `Encrypted` in Vercel UI.
4. Create a Cron job in Vercel: call `GET /api/poller/run` on your desired schedule. Vercel will add the `x-vercel-cron` header automatically.

## Local testing
1. Create `.env.local` from `.env.local.example` and fill in values.
2. Install dependencies: `npm ci`.
3. Run migrations: `npx ts-node scripts/migrate_pledge_index.ts` (or `node -r ts-node/register scripts/migrate_pledge_index.ts`).
4. Verify locally: `npm run lint && npm test && npm run build`.

## Notes about MongoDB transactions
Transactions require a replica set. If you're using a single-node local MongoDB, transactions will not work. Use MongoDB Atlas with the free tier replica set for staging/production.
