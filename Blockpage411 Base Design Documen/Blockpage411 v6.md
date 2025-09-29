now we’ll evolve **Blockpage411 v6**.

So far:

* **v1** → wallet login + ETH lookup + flags/ratings.
* **v2** → multi-chain support (ETH, BSC, Polygon, BTC), ENS/NFT enrichment.
* **v3** → profiles, socials, KYC, donations, verification scoring.
* **v4** → admin tools, blacklisting, dismiss flags, audit trail, advanced search.
* **v5** → automation: background jobs, tx caching, suspicious wallet detection.

Now in **v6**, we move into **scaling + performance + security hardening**.

---

# 📘 Blockpage411 v6 — Design Document

## 1. 🎯 **Goal**

Take Blockpage411 from a **functional MVP** (v1–v5) into a **production-ready scalable system** by adding:

* API performance optimizations
* Caching strategies
* Rate limiting for abuse prevention
* Security & UX polish

---

## 2. 🧩 **Core Features in v6**

### a) **Server-Side Rate Limiting**

* Use `express-rate-limit` (if API routes) or `next-ratelimiter` (middleware).
* Rules:

  * **General users**: 60 requests/minute per IP.
  * **Flagging**: 5 flags/day per wallet (role-based throttling).
  * **Admins**: Higher or no rate limits.

---

### b) **Caching Headers + CDN Support**

* For `/api/txs` responses:

  * `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
* Add **ETag headers** for conditional requests.
* Integrate **CDN (Cloudflare/Next.js Image/CDN)** to cache heavy data (transaction histories).

---

### c) **Edge Functions for Hot Paths**

* Move **read-heavy APIs** (`/api/txs`, `/api/profile/:wallet`) to **Next.js Edge Middleware**.
* Benefits: faster response, lower DB load.

---

### d) **Optimized Database Queries (MongoDB Atlas)**

* Create indexes:

  * `wallet.address` (unique).
  * `flags.wallet + flags.createdAt`.
  * `donations.wallet + donations.expiresAt`.
* Use **MongoDB TTL Index** for auto-expiring donation requests after 60 days.

---

### e) **Enhanced Security**

* **Wallet login only** (via wagmi + RainbowKit + Coinbase + WalletConnect).
* No emails until **KYC flow**.
* Add **JWT session hardening**:

  * Short-lived access token + refresh token.
  * Wallet signature required for refresh.
* API key protection for admin endpoints.

---

### f) **Polished Responsive Design (Dark Mode)**

* TailwindCSS UI upgrade:

  * Dark theme by default.
  * Use tables/cards with search + pagination for:

    * Transactions
    * Flags
    * Suspicious wallets
  * Admin UI has **inline confirmation modals** (already in v4, polished here).

---

### g) **Testing & Monitoring**

* **Unit tests** (Jest + React Testing Library) for UI & API.
* **Integration tests** for wallet login, flagging, donation flow.
* Add **logging/monitoring** with:

  * `pino` (structured logs).
  * `Sentry` (error monitoring).

---

## 3. 🏗️ **System Architecture (v6)**

### Frontend (Next.js + Tailwind + Wagmi)

* Wallet-only login.
* Profile UI → badges (verified, suspicious, popular).
* Transaction UI → cached + paginated.
* Donation UI → 60-day TTL (MongoDB auto-expiry).

### Backend (Next.js API routes)

* **Rate limiter middleware** for `/api/*`.
* **ETag + Cache-Control** on `/api/txs`.
* **Edge Functions** for read-heavy endpoints.
* **Suspicious wallet job** continues (from v5).

### Database (MongoDB + Redis)

* Redis = job queues + tx cache.
* MongoDB = profiles, flags, donations.
* TTL index for donation expiry.

---

## 4. 🔑 **Security & Performance in v6**

* Prevent abuse with **rate limiting + wallet throttling**.
* Use **JWT with wallet-based refresh** (no passwords).
* Add **cache layers** (Redis + CDN).
* Scale heavy endpoints with **Edge Functions**.

---

## 5. 🚀 **Step-by-Step Implementation**

### Step 1: Add Rate Limiting Middleware

* Install `express-rate-limit` or Next.js middleware.
* Apply per-IP + per-wallet rules.

### Step 2: Implement Cache-Control Headers

* Add caching logic to `/api/txs`.
* Serve ETag responses to reduce bandwidth.

### Step 3: Add TTL Indexes in MongoDB

```js
db.donations.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### Step 4: Add Edge Functions

* Migrate `/api/txs` to edge runtime (`export const runtime = "edge"` in Next.js).

### Step 5: Add Tests & Monitoring

* Write unit tests for wallet login + flagging.
* Add integration test for donation expiry.
* Hook Sentry for error logs.

---

## 6. 📅 Roadmap Beyond v6

* **v7** → DAO Governance: flag/blacklist decisions voted by community.
* **v8** → AI/ML scam detection engine.
* **v9** → Full mobile app (React Native).

---

## ✅ Summary — Blockpage411 v6

* 🛡️ **Rate limiting** for abuse protection.
* ⚡ **Caching headers & CDN** for performance.
* 🔄 **Edge functions** for hot endpoints.
* 🗂️ **MongoDB TTL** for donation expiry.
* 🎨 **Dark responsive UI** with search + pagination.
* ✅ **Tests & monitoring** added.