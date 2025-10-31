# Blockpage411 v7 — Integration & Implementation Plan (upgrade from v6)

This document upgrades v6 into a focused v7 that implements the client's "wallet-search + provider seed + reporting" requirements while re-using and extending existing app functionality. It maps what's already implemented, removes duplication, and gives a step-by-step, developer-ready integration plan with exact files to change, DB and API additions, and a seed/import path for the top-100 provider list.

Goals (one paragraph)

Add a three-field wallet-search/report flow (My wallet, Provider/Exchange, Receiving address) with provider autocomplete seeded from a top-100 list, a lightweight "Other" provider workflow (pending → admin promote), ownership verification options (signature preferred), and admin analytics to count and threshold provider mentions — all integrated into the existing Blockpage411 codebase without duplicating current flags, admin, or wallet features.

# What the client is explicitly asking for (clean list)

1. **Search page with 3 input fields (not 1):**

   * User wallet (select prefilled or add new)
   * Exchange / Wallet provider (prefilled top-100 + autocomplete + “Other”)
   * Receiving address (the address user sent funds to; i.e., the suspect)

2. **Prefilled exchange list seeded from a trusted list** (they suggested CoinMarketCap top exchanges / they already sent a top-100 list).

   * Dropdown with autocomplete (like country selector).
   * Each option can show metadata (market cap / rank / small warning icon).

# Blockpage411 v7 — Integration & Implementation Plan (upgrade from v6)

This document upgrades v6 into a focused v7 that implements the client's "wallet-search + provider seed + reporting" requirements while re-using and extending existing app functionality. It maps what's already implemented, removes duplication, and gives a step-by-step, developer-ready integration plan with exact files to change, DB and API additions, and a seed/import path for the top-100 provider list.

Goals

Add a three-field wallet-search/report flow (My wallet, Provider/Exchange, Receiving address) with provider autocomplete seeded from a top-100 list, a lightweight "Other" provider workflow (pending → admin promote), ownership verification options (signature preferred), and admin analytics to count and threshold provider mentions — all integrated into the existing Blockpage411 codebase without duplicating current flags, admin, or wallet features.

What the client is explicitly asking for

1. Search page with 3 input fields (not 1):

   - User wallet (select prefilled or add new)
   - Exchange / Wallet provider (prefilled top-100 + autocomplete + “Other”)
   - Receiving address (the address user sent funds to; i.e., the suspect)

2. Prefilled exchange list seeded from a trusted list (CoinMarketCap top exchanges or the client's top-100 list).

   - Dropdown with autocomplete (like a country selector).
   - Each option can show metadata (market cap / rank / small warning icon).

3. Ability to add “Other” provider when not in prefilled list.

   - New entries stored as pending or as user-provided records until promoted after enough requests.

4. Flag / Report flow for a wallet address: users can flag a suspect receiving address after selecting their wallet/provider and confirming ownership of their wallet.

5. Verification hint/warning: before reporting require the user to confirm “This account must be yours before you continue” (checkbox + explanation). Optionally require wallet sign-in (MetaMask / Coinbase) to prove ownership.

6. Recognition / analysis: system should attempt to “recognize” relationships — e.g., detect if the user’s wallet and the receiving address are associated with known exchanges; this implies matching addresses to exchange labels where possible.

7. Admin / analytics: track counts for each exchange/wallet provider (how many users selected/added it / how many requests). Client intends to contact exchanges once there's scale (e.g., 100K users mentioning an exchange) to integrate cooperatively.

8. Data/UI extras: show a ⚠️ warning on certain items, display market-cap/rank info next to exchange names, and populate the dropdown with the provided top-100 list copy/pasted.

UI / UX details (recommended)

- Page layout — three fields stacked or on a single row (mobile-friendly):

  1. My Wallet (owner) — Select (dropdown/autocomplete) OR “Add new wallet” button
  2. Provider / Exchange — Autocomplete dropdown seeded with top-100; last item = “Other (add)”
  3. Receiving address — free text (with address validation by chain)

- Autocomplete behavior like a country selector:

  - Typing filters the top-100 list.
  - Show provider metadata (small text: rank / market cap / website).
  - If not found, “Add new provider” option opens modal asking for: name, type (exchange/cold storage), optional website, source of info.

- Flag / Report flow:

  1. User fills three fields.
  2. Clicks Flag/Report.
  3. Show modal: “⚠️ This account must be yours before you continue” with a checkbox. Explain options to verify (wallet signature or login).
  4. Optionally require signature: “Sign a message with MetaMask / Coinbase to confirm ownership” (recommended).
  5. Submit report — show success and a report id.

- Add Provider (Other):

  - On add: store as a user-submitted provider record with status pending. Show count of requests for that provider.
  - Admin interface to review/approve/promote into master list.

- Search behavior:

  - Searching wallet addresses should return matches and their labeled provider if known (e.g., address belongs to Netcoins). Use fuzzy matching for provider name.

Data & sources

- Seed list: import the top-100 exchanges (CoinMarketCap list or the client’s list). Store as provider records with fields: name, aliases, type, website, market_cap, rank, seeded: true.
- Provider aliases: allow multiple aliases (e.g., “Coinbase”, “Coinbase Pro”, “Coinbase Wallet”).
- Address labels: map known exchange deposit wallets / hot wallets to provider when possible.

Verification options (pro/con)

1. Message signature (recommended)

   - User signs a short nonce with their wallet (MetaMask / WalletConnect / Coinbase wallet). Proof is cryptographic and no funds move. Good UX for web wallets.
2. OAuth login (e.g., Coinbase login)

   - Possible for some exchanges; more complex and may require integrations.
3. Micro-transfer (small token transfer)

   - Strong proof but messy and slower. Not recommended for initial phase.
4. Checkbox + explanation only

   - Lowest friction but weak proof. Might be acceptable initially.

Recommendation: require signature for the user wallet where possible (optional for mobile/non-web wallets).

Backend design (high level)

DB tables (core):

- users
- providers (seeded top-100 + user-added)

  - id, name, aliases[], type, website, market_cap, rank, status (seeded/pending/approved)
- wallets

  - id, user_id, provider_id (nullable), address, chain, verified (bool), verification_proof
- reports

  - id, reporter_user_id, reporter_wallet_id (nullable), provider_id (nullable), suspect_address, chain, evidence[], status, created_at
- provider_request_counts (or compute via reports) — track counts for each provider
- admin_actions — approve provider/promote

APIs

- GET /providers?query=... — autocomplete
- POST /providers — add new provider (user)
- POST /reports — submit flag
- POST /wallets/verify — submit signature proof

Search index

- Index addresses and providers for fast lookup and recognition.

Admin & analytics

- Admin dashboard:

  - Review pending provider submissions
  - View counts for providers (requests, flags)
  - See top reported providers / suspect addresses
  - Export list when threshold reached (e.g., providers with X mentions)

- Threshold logic:

  - Track both unique users and report counts per provider.
  - Suggested rule: when total_reports_for_provider >= N and unique_reporters >= M, mark ready_for_outreach. Client wants 100K users as an aspirational milestone — store the counts and let client pick outreach thresholds.

Edge cases & assumptions

- The client says “100K users” — treat this as a count metric used later to decide outreach. Implementation should store counts and allow configurable thresholds.
- “Recognize my wallet to sender” — interpreted as attempt to auto-detect relationships (e.g., map known exchange addresses or identify same-exchange flows). Implement via address labeling and heuristics (same provider deposit addresses, clustering).
- Privacy/legal: storing wallet addresses and accusations might have legal implications — include a lightweight terms-of-use and a report moderation process to avoid defamation.

Acceptance criteria (what “done” looks like)

1. On the search page there are exactly 3 fields: My wallet, Provider/Exchange (prefilled + autocomplete + Other), Receiving address.
2. Provider dropdown is seeded with top-100 list and supports autocomplete and showing small metadata (rank/market cap).
3. User can add a provider via Other — submission stored as pending.
4. Users can flag/open a report after acknowledging ownership (checkbox + optional signature).
5. Reports are stored and visible in admin dashboard with counts per provider.
6. The system attempts to label addresses with known providers where mapping exists.
7. Admin can promote popular Other entries to the seeded list.
8. Counters exist so client can see how many users mention each provider (for outreach decisions).

Developer-ready to-do checklist (prioritized)

1. DB & API: create providers, wallets, reports tables and necessary endpoints.
2. Seed import: paste/import client’s top-100 list into providers with seeded=true. (Client asked: "Copy and past the top 100 so that when I look it up it will be there.")
3. Frontend: design the search page:

   - 3 fields + autocomplete provider dropdown.
   - “Other” option opens provider add modal.
   - Flag/report button & modal with ownership checkbox + sign option.
4. Wallet verification: implement message-signature verification (MetaMask / WalletConnect). If unavailable, allow checkbox fallback + store unverified.
5. Admin UI: basic dashboard to review pending providers, view provider counts, export provider report list.
6. Address labeling: add simple mapping for known exchange addresses (extendable).
7. Analytics: track unique users and report counts per provider; expose threshold state.
8. UX polish: show market cap/rank next to provider; show ⚠️ warning and explanation on report modal.
9. Moderation/legal: implement rate-limiting, spam detection, and a process to delete/appeal reports.

Small UI wording suggestions (copy you can paste)

- Provider dropdown placeholder: Select exchange or wallet provider — start typing (e.g., Coinbase, Netcoins)…
- Add provider modal title: Add a provider not listed
- Report modal warning: ⚠️ This account must be yours before you continue. Confirm ownership by signing a message with your wallet or ticking the checkbox.
- Success message: Report submitted — thank you. Report ID: #12345.

Final notes / recommendations

- Require signature verification for higher-confidence reports once you have a working flow — helps credibility when approaching exchanges later.
- Keep the provider list editable and support aliases (users will call the same place by slightly different names).
- Log everything (who added what, timestamps) — necessary for audits and later outreach.
- Add a “why we ask for verification” short copy to reduce user fear (client mentioned people are scared to help wallets).

CSV & JSON seed (shortened)

I included a full CSV/JSON seed in the previous draft. If you want I can add a trimmed `data/providers.json` file to the repo and a small seed script `scripts/seed_providers.ts` that imports the JSON into MongoDB / your DB of choice.

Implementation phases & rough estimates

- Phase 1 (MVP): ~2 weeks — seed list + search page + provider add + report submission (checkbox flow) + basic admin stats.
- Phase 2: +1–2 weeks — signature verification, address recognition, admin promotion automation.
- Phase 3: scale/analytics & outreach tooling.

If you'd like, I can:

 - Create the `data/providers.json` file in the repo and add `scripts/seed_providers.ts` that imports it into MongoDB (or your chosen DB).
 - Scaffold the frontend Search page (React + Tailwind) and provider modal components and wire them to simple API stubs.
 - Implement the minimal backend endpoints in `pages/api/` (Next.js API routes) to support autocomplete and report creation.

Tell me which of the three follow-ups above you'd like me to implement next and I'll scaffold it and run a quick build.
8,KuCoin,"KuCoin, KuCoin AU, KuCoin Korea",CEX,https://www.kucoin.com,8

9,OKX,"OKX, OKEx",CEX,https://www.okx.com,9
