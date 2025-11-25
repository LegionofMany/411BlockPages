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
