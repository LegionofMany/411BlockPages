## API Routes Overview

This is a high-level overview of key API routes, grouped by feature area. For full request/response details, inspect the corresponding files under `pages/api`.

### Auth & Profile

- `/api/auth/nonce` – Generate nonce for wallet signature.
- `/api/auth/verify` – Verify signature, issue JWT.
- `/api/me` – Fetch current user profile.
- `/api/me.patch` – Update profile fields (validated via Zod).
- `/api/profile/social-links` – Manage social links attached to a profile.

### Wallets & Reputation

- `/api/wallet/[chain]/[address]` – Fetch wallet details, flags, ratings, txs.
- `/api/wallet/[chain]/[address]/transactions` – Paginated transactions.
- `/api/wallet/exchange-metadata` – Static metadata for exchange/wallet dropdown.
- `/api/wallet/popular` – Most-viewed wallets.
- `/api/wallet/suspicious` – Wallets flagged as suspicious.
- `/api/wallet/updateMetadata` – User-provided metadata (exchange, storage type).
- `/api/wallets/verify` – Verify ownership of a wallet.

### Flags, Ratings & Reports

- `/api/flag/add` – Add a flag to a wallet.
- `/api/flag/status/[chain]/[address]` – Flag status for a wallet.
- `/api/flags` – List flags (admin/reporting).
- `/api/flags/remaining` – Remaining flags the user can submit.
- `/api/flags/deleteFlag`, `/api/flags/hideFlagComment` – Moderate flags.
- `/api/ratings` – Create and fetch ratings for wallets.
- `/api/reports` – Create and list high-level reports.

### Providers & Exchanges

- `/api/providers` – List providers (exchanges, wallets, other).
- `/api/exchanges` – Cached list of top exchanges for dropdowns.
- `/api/exchanges/sync` – Sync top-100 exchanges from CoinGecko into `Provider`.

### Charities & Events

- `/api/charities` – Main charities endpoint.
- `/api/charities/list` – List charities for selection.
- `/api/charities/[id]` – Fetch charity details.
- `/api/charities/seed-local`, `/api/charities/seed-givingblock`, `/api/charities/sync`, `/api/charities/refresh-cache` – Admin/seed utilities.
- `/api/events/create` – Create a fundraising event (Zod-validated, rate-limited).
- `/api/events/list` – List events, with filters.
- `/api/events/byUser` – Events for the current user.
- `/api/events/byUser/[id]` – Events for a specific user.

### Fundraisers & Campaigns

- `/api/fundraisers` and `/api/fundraisers/[address]` – Public fundraiser data.
- `/api/fundraisers/id/[id]` – Fundraiser by internal ID.
- `/api/fundraisers/pledge` – Create a pledge.
- `/api/fundraisers/verify-onchain` – Verify on-chain donations.
- `/api/fundraisers/admin`, `/api/fundraisers/admin/pledges` – Admin views.
- `/api/campaigns/*` – Campaign creation, listing, pledging, and onchain verification.

### Social Verification

- `/api/verify/social/request-simple` – Request admin review for a social handle (admins will approve/reject).
 - `/api/verify/social/request-simple` – Request admin review for a social handle (admins will approve/reject).
 - `/api/verify/social/request-bulk` – Request admin review for multiple handles at once (used by profile UI "Request Verification").

Note: The previous code-based verification endpoints were retired; requests now go through admin review.

### Admin & Metrics

- `/api/admin/*` – Various admin-only routes for moderation, analytics, KYC, etc.
- `/api/metrics` – Internal metrics ingestion.
- `/api/_diag` – Simple diagnostic endpoint.

### Realtime & Poller

- `/api/realtime/*` – Realtime publish/token helpers.
- `/api/poller/run` – Trigger donation poller (secured by `POLLER_SECRET`).

### Webhooks

- `/api/webhooks/givingblock` – Inbound GivingBlock donation webhooks (see `docs/webhooks.md`).
