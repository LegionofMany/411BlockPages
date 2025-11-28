**Deploy Charities (staging → production)**

- **Purpose:** Steps to prepare and deploy the charities feature and seed production data safely.

**Prerequisites (before deploy)**
- A production MongoDB instance and `MONGODB_URI`.
- A production Redis instance and `REDIS_URL` (or set `REDIS_URL=DISABLE_REDIS` to skip).
- A valid Giving Block production API key and webhook secret.
- A secure `JWT_SECRET` for auth and `SEED_SECRET` for guarding seed endpoints.
- CI/CD or hosting account (Vercel, Cloud Run, etc.) with environment variable configuration.

**Environment variables (must be set in host or CI, do NOT commit secrets to git)**
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `REDIS_URL` — Redis connection URL (or `DISABLE_REDIS` to disable caching)
- `GIVINGBLOCK_API_KEY` — Giving Block production API key
- `GIVINGBLOCK_BASE_URL` — e.g. `https://public-api.thegivingblock.com`
- `GIVINGBLOCK_WEBHOOK_SECRET` — secret used to validate Giving Block webhooks
- `SEED_SECRET` — secret used to protect seed endpoints (choose a strong random value)
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL` / `BASE_URL` — public URL of the deployed app
- Optional: `POLLER_SECRET`, `CRON_SECRET`, `POLLER_SLACK_WEBHOOK`, `NEXT_PUBLIC_ALCHEMY_KEY`, etc.

**Protect dev endpoints**
- The repo includes `pages/api/charities/seed-local.ts` and `pages/api/charities/seed-givingblock.ts`.
- These endpoints now accept a `secret` via query `?secret=...` or header `x-seed-secret` and will require `SEED_SECRET` when set in env.
- In production set `SEED_SECRET` in the host environment and DO NOT expose the seed endpoints publicly.

**Staging workflow (recommended)**
1. Create a staging environment with separate DB and Redis.
2. Set env vars in staging (use sandbox Giving Block API keys if you want). Do NOT use production DB in staging.
3. Deploy branch `staging` to your staging host or Vercel preview deployment.
4. Run smoke tests:
   - Fetch `/api/charities?q=health` and confirm response shape `{ results: [...] }`.
   - Visit `/charities` UI and verify list and search.
5. If seeding is needed in staging, call seed endpoints with `?secret=<SEED_SECRET>` or via header `x-seed-secret`.

**Production deploy (precise steps)**
1. In production host (Vercel, Cloud Run, etc.) set the required env vars listed above. Important ones:
   - `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, `GIVINGBLOCK_API_KEY`, `GIVINGBLOCK_BASE_URL`, `GIVINGBLOCK_WEBHOOK_SECRET`, `SEED_SECRET`, `NODE_ENV=production`, `NEXT_PUBLIC_APP_URL`, `BASE_URL`.
2. Ensure `GIVINGBLOCK_BASE_URL` is set to `https://public-api.thegivingblock.com` and `GIVINGBLOCK_WEBHOOK_SECRET` is set to a strong secret.
3. Deploy the production branch (e.g., `main` or `master`).
4. After deployment, verify logs and health endpoints. Run these checks:
   - `GET /api/charities` returns `{ results: [...] }` (may be cached)
   - `GET /api/charities?q=education` returns `{ results: [...] }`
   - `GET /api/me` for an authenticated user (requires JWT cookie or Authorization header)
5. If charities are missing, run the seed endpoint carefully from a protected environment (use `curl` from an admin machine):

```powershell
# Example (production) - run from a safe admin machine
$env:SEED_SECRET='YOUR_SECRET'
# call the givingblock seed endpoint (server will enforce withAdminAuth or SEED_SECRET)
curl -X POST "https://your-production-site.com/api/charities/seed-givingblock?secret=$env:SEED_SECRET" -H "Authorization: Bearer <ADMIN_TOKEN>"

# OR seed local data (if you have a data file on server)
curl -X POST "https://your-production-site.com/api/charities/seed-local?secret=$env:SEED_SECRET"
```

6. After seeding, the endpoint will clear related caches. Confirm data appears in `/charities`.

**Rollbacks & safety**
- If seeding created bad data, restore from DB backup or run scripts to clean entries. Always take a DB snapshot before mass changes.
- Rotate any API keys or secrets if they may have been exposed.

**Monitoring & Post-deploy**
- Enable logging and error tracking (Sentry) and set alerts for 5xx rates.
- Monitor Redis and DB performance; add indexes in Mongo if searches are slow.

**Notes**
- The API returns `results` (client code should read `data.results`). Client code should normalize responses if necessary.
- Seed endpoints are guarded by `SEED_SECRET` when set; keep `SEED_SECRET` secret and use ephemeral credentials for admin API calls.

***End of file***
