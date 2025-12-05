# Deployment Instructions

This project is a Next.js app. Vercel is the recommended deployment platform for Next.js applications.

## Vercel (recommended)

1. Create a project on Vercel and connect your GitHub repository.
2. Set the following environment variables in the Vercel dashboard (see `.env.example`):
   - `MONGODB_URI`, `NEXT_PUBLIC_APP_URL`, `ETHERSCAN_API_KEY`, `POLYGONSCAN_API_KEY`, `BSCSCAN_API_KEY`, `REDIS_URL`, `ADMIN_WALLETS`, `SENTRY_DSN`
   - Optional operational variables:
     - `SENTRY_DSN` — if set, server-side errors will be reported to Sentry (recommended for production).
     - `ADMIN_ACTION_RETENTION_DAYS` — number of days to retain admin audit logs (default: 365). A TTL index is created on the `AdminAction` collection using this value.
3. Build command: `npm run build`
4. Output directory: (leave blank; Vercel will detect Next.js)

Notes:
- Vercel does not support deploying an arbitrary Dockerfile. Use Vercel for frontend / serverless functions and a separate container host for custom background jobs if needed.

Note: Docker-related files have been removed from this repository. If you require container-based deployment, create a custom `Dockerfile` or use a platform-specific guide (Fly.io, Render, etc.). For most use cases we recommend Vercel for frontend and serverless functions.

## Environment

Copy `.env.example` to `.env.local` for local development and fill in values.

## Operational monitoring and audit logging

- Sentry: provide `SENTRY_DSN` in the environment to enable error reporting. The app will attempt to initialize Sentry on server startup; if `@sentry/node` is not installed the app continues to run but errors won't be sent.
- Audit logs: administrative actions are recorded in the `AdminAction` MongoDB collection. A TTL index is created using `ADMIN_ACTION_RETENTION_DAYS` (default 365 days) to automatically expire old audit entries. If you need longer retention for compliance, increase that value or implement an archiving strategy (e.g., export to a secure S3 bucket before expiry).

Recommendations:
- Keep Sentry enabled in staging and production to capture unexpected exceptions and performance issues. Configure Sentry alerts (email/Slack) for error rates.
- Use `ADMIN_ACTION_RETENTION_DAYS` to match your organization's policy; consider exporting audit logs to a secure long-term store if required for compliance before they expire.

## Secret handling & rotation

- Do not commit secrets, credentials, or private keys to git. Ensure local env files such as `.env.local` remain in `.gitignore` (this repo already ignores `.env*` except the example files).
- If you discover a secret committed in the repository history, rotate the secret immediately (revoke the old key) and then remove it from git history using a history rewrite tool such as `git filter-repo` or `git filter-branch`. Example with `git filter-repo`:

```powershell
# Install git-filter-repo (python)
pip install git-filter-repo
# Rewrite history to remove a key pattern (example):
git filter-repo --invert-paths --paths-glob 'path/to/file/with/secret'
```

Note: history rewrites rewrite commits — coordinate with your team and follow your organization's process. After rewriting history you'll need to force-push and have collaborators re-clone or reset.

- Use the included `scripts/scan_secrets.js` to search the workspace for common leaked secret patterns. It is a heuristic scanner and not a replacement for a proper secret scanning solution (e.g., GitHub Advanced Security, TruffleHog, or commercial tools).

- Rotation guidance:
  - Immediately revoke any secret found in the repo history or in a committed file.
  - Create a new key/secret in the service provider's console.
  - Update your deployment environment variables (e.g., in Vercel, Render, or Docker secrets) with the new value.
  - If you had to rewrite git history, rotate tokens used by CI/CD systems and update deploy keys.