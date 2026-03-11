# Detecting Bad URLs & Drainers (Clean Notes)

Date: 2026-03-11

This Markdown file is a cleaned, readable rewrite of the saved chat export in `Detecting Bad URLs & Drainers.html`.

- Original export (verbatim backup): `Detecting Bad URLs & Drainers.original.html`
- Clean HTML wrapper (after cleanup): `Detecting Bad URLs & Drainers.html`

## What the saved conversation was about
The saved conversation describes how to build a **URL auditor** for detecting:
- Phishing/clone sites (typosquats mimicking legit wallets/exchanges)
- Drainer flows (approve/transfer prompts, wallet-provider calls)
- “Airdrop / claim” bait (UI flows that only reveal malicious behavior after interaction)

The core idea is to combine **static analysis** (source inspection) with **dynamic analysis** (sandboxed headless browsing) and **clone detection** (fingerprinting known-good sites).

## Key recommendations (high level)
### 1) Static analysis (fast, cheap)
Fetch the URL and scan HTML/JS for common red flags:
- Wallet hooks: `window.ethereum`, `ethereum.request`, `eth_sendTransaction`, `wallet_switchEthereumChain`
- “Airdrop/claim” language: `claim`, `airdrop`, `reward`, `token`, `connect wallet`
- Obfuscation: `eval`, `Function(`, long base64 blobs, suspicious string decoding
- Known drainer patterns: approvals (`approve`, `setApprovalForAll`), `permit`, `transferFrom`

Output should include:
- Flag counts and which patterns matched
- A small excerpt/snippet list (not full source dumps by default)

### 2) Dynamic analysis (sandboxed Playwright)
Run the URL in a **containerized headless browser** and collect telemetry:
- Console logs
- Network requests (including POST endpoints and suspicious domains)
- DOM mutations / user-action events (what buttons were clicked)

**Important fix from the conversation:** many drainers do not trigger until the user clicks “Claim / Airdrop / Connect”.
So the dynamic sandbox should actively:
- Look for likely CTA buttons/links (claim/airdrop/reward/connect)
- Click through a small set of flows
- Wait for delayed/lazy-loaded scripts (several seconds)
- Instrument / intercept wallet-provider calls (e.g., `window.ethereum.request`) to detect attempted transactions

### 3) Clone detection (fingerprints)
Detect phishing clones by comparing a normalized page fingerprint against a DB of known legitimate sites.
A practical approach:
- Fetch HTML
- Remove volatile parts (scripts, tracking params, random IDs) and normalize whitespace
- Hash the normalized HTML (SHA-256)
- Compare with known-good fingerprints

### 4) Risk scoring
Combine signals into a single score (the conversation used a simple 0–10 style score; your product already uses 0–100 scoring for wallet risk). The important part is consistency:
- Clone hit should heavily increase risk
- Dynamic wallet-transaction attempts should heavily increase risk
- “Airdrop/claim” + approval patterns should increase risk

### 5) Persistence + monitoring
Store every audit (inputs + outputs) so you can:
- Review suspicious patterns over time
- Improve heuristics
- Trigger alerts for high-risk detections

The saved conversation proposes:
- A DB table/collection for audit results and logs
- Alerting when risk exceeds a threshold (email/Slack/Discord)
- Scheduled jobs for fingerprint DB refresh and recurring audits

## “First test suite” idea (from the conversation)
To validate your system without touching real malicious sites, the conversation recommends a small suite:
- Safe control URLs (expected low score)
- Typosquat / clone-like domains (or internal staging clones)
- Local test pages that simulate:
  - Airdrop claim flow (button click + console log)
  - Extractor-like behavior (network request on load)

## Production monitoring setup (from the conversation)
The transcript adds a suggested production ops layer:
- Store raw dynamic logs + network events
- Build an admin dashboard:
  - Recently flagged URLs
  - Risk trend over time
  - Dynamic log viewer
  - Clone alerts
- Add alerts at a threshold (e.g., risk >= 7 on a 0–10 scale)
- Optional: feed logs into ELK (Elasticsearch + Kibana)

---

# Updated implementation process (Blockpage411 repo)

This section updates the implementation steps to match the actual repo you have in `blockpage411/`:
- Next.js 15
- MongoDB/Mongoose
- Playwright already installed (used for e2e/a11y scripts)

## Design goal
Add a **URL auditing feature** alongside your existing wallet-risk features.

Constraints:
- Do not run untrusted URLs on the host machine.
- Default to safe/local test pages for development.
- Keep results auditable (store inputs + outputs).

## Step 0 — Choose where this lives
In this repo, API routes exist under `blockpage411/pages/api/*`.

Recommended minimal shape:
- API route: `POST /api/url/audit`
- Service module(s): `blockpage411/services/urlAudit/*`
- DB model: `blockpage411/models/UrlAudit.ts` (or reuse an existing collection pattern)
- Admin UI (optional later): `blockpage411/app/admin/url-audits/page.tsx`

## Step 1 — Define an audit result schema
Store enough detail for debugging, but avoid megabyte payloads by default.

Suggested fields:
- `url`, `requestedBy` (optional), `createdAt`
- `static`: matched patterns + counts
- `dynamic`: high-level flags + small sampled logs + sampled network requests
- `clone`: fingerprint + match status
- `riskScore` + `reasons[]`

## Step 2 — Static analysis implementation
Create a static analyzer that:
1) Fetches HTML (with a timeout)
2) Extracts inline scripts + external script URLs
3) Scores based on keyword/pattern matches

Keep it deterministic and return structured JSON.

## Step 3 — Dynamic sandbox implementation (Playwright)
You already have Playwright in the repo (see `blockpage411/playwright.config.ts` and scripts like `blockpage411/scripts/run_axe_playwright.js`).

Implementation notes:
- Use `chromium.launch({ headless: true })`
- Capture:
  - `page.on('console', ...)`
  - `page.on('request', ...)` and `page.on('response', ...)`
- Add a bounded interaction loop:
  - Query buttons/links
  - Click a few candidates
  - Wait for delayed scripts

Wallet interception:
- In a sandbox, you can inject a stub provider via `page.addInitScript` that defines `window.ethereum.request` and logs attempted calls.
- Do not connect real wallets.

## Step 4 — Fingerprinting + clone detection
Implement a utility:
- Fetch HTML
- Normalize (strip scripts, normalize whitespace)
- Hash (SHA-256)
- Compare against known-good fingerprint set

Store known-good fingerprints in a JSON file under `blockpage411/data/` or a Mongo collection.

## Step 5 — Risk scoring for URL audits
Keep URL-audit scoring separate from wallet scoring.

A simple approach:
- Start at 0
- Add points for:
  - Clone match
  - Wallet-provider calls during dynamic run
  - Airdrop/claim keywords + approval patterns
  - Suspicious outbound requests
- Clamp to 0–10 (or 0–100, but choose one and document it)

## Step 6 — Persistence + admin visibility
Persist every audit to Mongo and expose:
- Admin list endpoint: `GET /api/admin/url-audits`
- Admin detail endpoint: `GET /api/admin/url-audits/[id]`

For audit logging of admin actions, you already have patterns for audit logs (see existing admin audit log endpoints/models in the repo).

## Step 7 — Alerts / monitoring (incremental)
Once the pipeline is stable:
- Add threshold alerting (email via Nodemailer is already a dependency)
- Add scheduled jobs:
  - Refresh fingerprint DB
  - Re-audit recent high-risk URLs

## Step 8 — Safe QA loop (recommended)
- Add local “fake airdrop” and “fake extractor” HTML pages under a `tmp/` or `public/test-pages/` folder.
- Run audits only against `http://localhost/...` during early development.

---

## Notes on scope
The saved chat export also contained example code scaffolds and a suggested end-to-end stack. For Blockpage411, you can implement the same architecture using your existing Next.js + Mongo + Playwright stack without introducing a separate backend.
