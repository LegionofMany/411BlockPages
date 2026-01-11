# Blockpage411

Real-time crypto donation transparency and wallet reputation for donors, nonprofits, and compliance teams.

Live product: https://www.blockpages411.com

Blockpage411 turns fragmented, opaque crypto donation flows into a single, transparent view. Donors can quickly verify where funds are going, nonprofits can prove impact, and compliance teams can monitor risk across wallets, campaigns, and chains.

---

## 1. Product Overview (Investor-Friendly)

### Problem

Crypto donations are growing, but today they are:

- Hard to verify end-to-end (from donor wallet to nonprofit use).
- Fragmented across chains, custodians, and donation platforms.
- Opaque for compliance and risk teams who must justify decisions to regulators.

### Solution

Blockpage411 is a real-time crypto donation intelligence layer that:

- Aggregates Giving Block donation data, on-chain transactions, and internal risk signals.
- Normalizes them into human-readable profiles for wallets, charities, fundraisers, and campaigns.
- Exposes this as a web dashboard and API for:
  - Donors and philanthropy teams.
  - Nonprofits and campaign operators.
  - Compliance, risk, and investigations.

### What you can do with Blockpage411

- Search any supported wallet and see donations, counterparties, and risk context in seconds.
- Browse a curated directory of Giving Block charities and fundraisers with live on-chain activity.
- Track live crypto donations and flows across multiple chains.
- Use the admin console as an internal risk and operations cockpit.

### At a glance

- **Chains supported:** Ethereum, Polygon, BNB Chain, Solana, Tron.
- **Primary integration:** The Giving Block (Public API + encrypted webhooks).
- **Core user groups:** Donors, nonprofits, compliance/risk teams, investigators.
- **Key use cases:** Due diligence on donation destinations, proving impact, monitoring suspicious flows, internal risk review.
- **Data sources:** Giving Block events, on-chain transactions, internal risk heuristics.
- **Delivery:** Cloud-hosted web app plus internal APIs.

### Investor FAQ

**What is the business model?**  
Blockpage411 is designed for B2B/B2G SaaS: paid seats for nonprofits, exchanges, and compliance teams, with potential tiered access to analytics and APIs.

**How is this different from generic blockchain explorers?**  
Traditional explorers show raw transactions. Blockpage411 is donation- and nonprofit-centric, with curated Giving Block data, wallet-level risk, and operator workflows (admin console, reviews, alerts).

**Who is the first integration partner?**  
The Giving Block: we ingest their encrypted webhooks and public API, enabling real-time visibility into crypto donations to vetted nonprofits.

**How does this help with regulation and compliance?**  
By centralizing donation flows, risk scores, and counterparties, compliance teams get an auditable view of wallets and campaigns that supports KYC/AML and reporting obligations.

**Can this extend beyond The Giving Block?**  
Yes. The architecture is built to add more donation platforms, custodians, and data providers over time while keeping a unified wallet and campaign graph.

---

## 2. Key Product Features

- **Wallet search & profiles**  
  Unified wallet page with chain activity, labels, and risk context. Designed to answer: “Who is this address and how do they behave?”

- **Charity & fundraiser directory**  
  Curated list of organizations synced from The Giving Block. View donation history, associated wallets, and campaign metadata.

- **Real-time Giving Block donations**  
  Encrypted webhooks from The Giving Block feed into a live activity stream. Donations are verified, decrypted, and normalized for display.

- **Multi-chain transaction visibility**  
  Ethereum, Polygon, BSC, Solana, and Tron support. Used for wallet details, fundraiser tracking, and anomaly detection.

- **Risk scoring & admin console**  
  Risk scores and categories per wallet, with an admin UI for overrides. Dashboards for suspicious wallets, popular wallets, and high-risk activity.

- **Operations & compliance tooling**  
  Admin-only pages for charities, fundraisers, Giving Block donations, and alerts. Wallet-based admin access (no passwords stored by the platform).

---

## 3. High-Level Architecture (For Contributors)

- **Frontend**
  - Next.js App Router (React + TypeScript).
  - TailwindCSS for styling.
  - MetaMask (injected + mobile deep link) + Coinbase Wallet SDK for EVM wallet connections.
  - SWR and custom hooks for data fetching.

- **Backend / APIs**
  - Next.js Route Handlers under `/api` for:
    - Wallet lookups and risk scoring.
    - Charity and fundraiser management.
    - Giving Block charity sync.
    - Giving Block webhooks and donation ingestion.
    - Admin checks and dashboards.
  - MongoDB (via Mongoose) for persistence:
    - Wallets, charities, fundraisers, donations.
    - Admin actions, reports, and internal alerts.
  - Optional Redis for caching and rate limiting.

- **Giving Block Integration**
  - Public API:
    - `POST /v1/login` and `POST /v1/refresh-tokens` for auth.
    - `GET /v1/charities` for charity sync.
  - Webhooks:
    - `/api/webhooks/givingblock` endpoint for encrypted donation events.
    - HMAC SHA-256 verification using `GIVINGBLOCK_WEBHOOK_SECRET`.
    - AES-256-CBC decryption using `GIVINGBLOCK_ENCRYPTION_KEY` and `GIVINGBLOCK_ENCRYPTION_IV`.

For environment variables and deployment details, see:

- docs/env-setup.md  
- docs/webhooks.md  
- docs/security.md  

---

## 4. Public Surface & API Overview

This repository is focused on the web app and internal APIs. The most important surface areas are:

### Web app

- `/` – landing page and high-level overview.
- `/search` – wallet search and profiles.
- `/fundraisers` and `/campaigns` – campaign and fundraiser views.
- `/realtime-transactions` – live transaction and donation feeds.

### Admin web (wallet-gated)

- `/admin` – admin home.
- `/admin/charities` – Giving Block charities.
- `/admin/fundraisers` – fundraiser management.
- `/admin/givingblock-donations` – decoded Giving Block donation events.
- `/admin/suspicious-wallets`, `/admin/popular-wallets`, `/admin/kyc-review` – risk and review tools.

### Key internal APIs (simplified)

- `GET /api/wallet/[chain]/[address]` – wallet details and risk context.
- `GET /api/wallet/risk` – computed risk score for a wallet.
- `POST /api/charities/sync` – admin-only Giving Block charity sync.
- `POST /api/webhooks/givingblock` – encrypted webhook receiver.
- `GET /api/admin/check` – server-side admin verification.

These endpoints are primarily consumed by the Next.js app itself. If you want to build external integrations, start by reviewing docs/api-routes.md and the handlers under `/api` in the codebase.

---

## 5. For Contributors

If you want to contribute to Blockpage411:

### 5.1 Read the docs

- docs/env-setup.md – environment variables, MongoDB, Redis, and Vercel.
- docs/api-routes.md – overview of API handlers and expected behavior.
- docs/webhooks.md – Giving Block webhook flow and security.
- docs/security.md – security posture and expectations.

### 5.2 Focus areas where help is welcome

- UX and accessibility improvements on the search, charity, and fundraiser flows.
- Additional risk heuristics and on-chain intelligence.
- Performance, caching, and observability.
- Better public API shape for third-party integrators.

### 5.3 Coding guidelines (high level)

- Prefer TypeScript throughout.
- Keep business logic in `lib/` or `services/`, not React components.
- Do not log or expose secrets; use structured logging via the existing logger utilities.
- Preserve existing public APIs unless there is a clear deprecation path.

---

## 6. Security & Privacy Principles

- **Donor and wallet privacy**  
  Only surface the information necessary to understand flows of funds and risk. Do not store private keys or non-essential PII.

- **Defense in depth**  
  HMAC verification on all Giving Block webhooks. Encrypted payload handling with strict key/IV management. Rate limiting and caching (Redis) available where configured.

- **Operational hygiene**  
  Rotate any leaked or test secrets immediately. Use separate credentials for local, staging, and production.

See docs/security.md for deeper guidance.

---

## 7. License

MIT – open collaboration welcome.