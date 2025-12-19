## Webhooks

### GivingBlock Webhook

- **Endpoint**: `/api/webhooks/givingblock`
- **Purpose**: Receive donation events from The Giving Block, update internal charity and donation records.

#### Authentication & Verification

- Webhook requests are validated using `GIVINGBLOCK_WEBHOOK_SECRET`.
- The handler checks the signature/header (see `services/givingBlockService.ts`) and rejects invalid requests.
- Only requests that pass signature verification are processed.

#### Payload Handling

- Incoming payloads are parsed and normalized into internal models (charity, donation, donor metadata as available).
- Sensitive fields can be encrypted using `GIVINGBLOCK_ENCRYPTION_KEY` and `GIVINGBLOCK_ENCRYPTION_IV` before storage.
- Related charity records may be created/updated via `models/Charity`.

#### Idempotency & Retries

- GivingBlock may retry webhook deliveries on network errors or 5xx responses.
- The handler should be written to be **idempotent**:
  - Use external IDs (e.g. GivingBlock donation ID) to ensure a donation is only created/updated once.
  - Ignore duplicate events with the same external ID.
- On server errors, respond with `5xx` to signal a retry is appropriate.

#### Observability

- Failures should be logged (and optionally sent to Slack via `lib/slack.ts`).
- In production, enable Sentry via `SENTRY_DSN` to capture webhook errors.

#### Integration Overview (For GivingBlock Review)

- **Auth to Public API**
  - Server-side integration lives in `services/givingBlockService.ts`.
  - Supports both a legacy static `GIVINGBLOCK_API_KEY` and the recommended **Public API user login + refresh tokens** (`GIVINGBLOCK_USERNAME` / `GIVINGBLOCK_PASSWORD`).
  - Tokens are obtained from `POST /v1/login` and refreshed via `POST /v1/refresh-tokens`; both endpoints are called against `GIVINGBLOCK_BASE_URL`.
  - Access/refresh tokens are cached in memory only (per server process) and never logged.

- **Charity Sync**
  - `/api/charities/sync` (admin-only) calls `fetchCharities()` from `services/givingBlockService.ts`, which in turn calls `/v1/charities?page=...` on The Giving Block.
  - Results are normalized via `normalizeCharity` and upserted into `models/Charity` using `charityId` as the stable external key.
  - A separate seed helper `/api/charities/seed-givingblock` uses `utils/givingblock.ts` and is protected by `SEED_SECRET` and/or admin auth; it is intended for controlled seeding, not general traffic.

- **Donations & Pledges**
  - `/api/webhooks/givingblock` listens for `donation.created` and `donation.updated` events.
  - Each donation is upserted into `models/Pledge`, keyed by `{ fundraiserId, externalId }`, with `raw.source = 'givingblock'` and the full (non-secret) payload for future reconciliation.
  - The handler is idempotent and safe for Giving Block retries.

- **Testing & Safety**
  - A helper endpoint `/api/webhooks/givingblock-test` exists only to facilitate **local** testing of signed webhooks.
  - It is **hard-disabled in production** (`NODE_ENV === 'production'` returns 404) so no external party can use it to generate or replay signed requests.
  - All secrets (`GIVINGBLOCK_WEBHOOK_SECRET`, encryption key/IV, Public API user credentials) are provided via environment variables; none are committed to the repository.
