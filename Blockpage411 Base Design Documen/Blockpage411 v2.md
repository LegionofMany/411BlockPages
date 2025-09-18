# 📘 Blockpage411 v2 — Design Document

## 1. 🎯 **Goal**

Blockpage411 v2 expands the 411 directory to support **multiple blockchains**, not just Ethereum.
Users can now look up wallets/addresses across **Ethereum, Binance Smart Chain (BSC), Polygon, and Bitcoin**.

---

## 2. 🧩 **Core Features in v2**

### a) **Multi-Chain Wallet Lookup**

* Search for wallet address on supported chains.
* Each wallet profile is chain-specific.
* Supported chains:

  * **Ethereum** → via Etherscan API
  * **BSC** → via BscScan API
  * **Polygon** → via Polygonscan API
  * **Bitcoin** → via Blockstream API

### b) **Unified Wallet Profile**

* Profile schema updated to include chain info:

```json
{
  "address": "0x456...",
  "chain": "ethereum",
  "flags": [...],
  "ratings": [...],
  "avgRating": 3.5,
  "lastRefreshed": "2025-09-15T12:00:00Z"
}
```

* Wallets are **unique per chain** (`address + chain` is composite key).

### c) **Transaction History**

* Ethereum/BSC/Polygon: transactions fetched from chain explorer APIs.
* Bitcoin: transactions fetched via Blockstream API.
* Results cached in MongoDB with `lastRefreshed` timestamp.

### d) **Flagging & Rating (Cross-Chain)**

* Users can flag/rate wallets **per chain**.
* Example:

  * `0x123` on Ethereum may be “trusted”
  * `0x123` on BSC may be “scammer”

### e) **Basic Profile Enrichment**

* Display **ENS name** if available (Ethereum only).
* Display **NFT count** for Ethereum wallets (optional, using OpenSea or Alchemy API).

---

## 3. 🏗️ **System Architecture (v2)**

### Frontend (Next.js)

* `/search` now includes **chain selector** (dropdown: Ethereum, BSC, Polygon, Bitcoin).
* `/wallet/[chain]/[address]` shows profile + transactions per chain.
* UI updated with **tabs or cards per chain** if same wallet is searched on multiple chains.

### Backend (Next.js API routes)

* `/api/wallet/[chain]/[address]` → returns wallet profile for that chain.
* `/api/flags` → POST with `{ chain, address, reason }`.
* `/api/ratings` → POST with `{ chain, address, score }`.
* `/api/me` remains same (user = wallet login).

### Database (MongoDB Atlas)

Collections:

* **Users** (same as v1)
* **Wallets**

  ```json
  {
    "address": "0x123...",
    "chain": "bsc",
    "flags": [],
    "ratings": [],
    "avgRating": 0,
    "ens": "alice.eth",
    "nftCount": 2,
    "lastRefreshed": "2025-09-15T12:00:00Z"
  }
  ```

---

## 4. 🔑 **Security / Constraints**

* Flags/rating rules same as v1:

  * Max **5 flags/day/user** (applies across all chains).
  * 1 rating per user per chain per wallet.
* Cache transactions for **15 minutes** to avoid API rate limits.
* Fallback if API is down: return cached data.

---

## 5. 🚀 **Step-by-Step Implementation**

### Step 1: Extend Wallet Schema

* Add `chain`, `ens`, `nftCount`, `lastRefreshed`.

### Step 2: API Integrations

* Create service modules:

  * `services/etherscan.ts` → Ethereum txs
  * `services/bscscan.ts` → BSC txs
  * `services/polygonscan.ts` → Polygon txs
  * `services/blockstream.ts` → Bitcoin txs
* Each returns `transactions[]`.

### Step 3: Backend Endpoints

* `/api/wallet/[chain]/[address]`:

  * Check DB cache (<= 15 min).
  * If stale, fetch new data from chain API.
  * Save in MongoDB.

### Step 4: Frontend Updates

* Add **chain selector** on search page.
* Add `/wallet/[chain]/[address]` route:

  * Show address
  * Show chain
  * Show transactions
  * Show flags & ratings

### Step 5: Profile Enrichment

* Ethereum only:

  * Use ENS resolution (`ethers.js`).
  * Query NFT balance (optional API).

---

## 6. 📅 Roadmap Beyond v2

* **v3:** Add social media fields + donation tab (profiles start looking like a Web3 identity).
* **v4:** Add admin tools (blacklist, dismiss flags).
* **v5:** Add background jobs + Redis caching.

---

## ✅ Summary — Blockpage411 v2

* 🔗 Multi-chain wallet lookup (ETH, BSC, Polygon, Bitcoin)
* 📊 Unified wallet profiles per chain
* 🚩 Flagging & ⭐ rating across chains
* 🕒 Transaction caching to reduce API calls
* 🧩 Profile enrichment (ENS + NFT count)
