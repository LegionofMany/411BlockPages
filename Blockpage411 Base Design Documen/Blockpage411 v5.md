Perfect ✅ — now let’s evolve **Blockpage411 v5**.

So far:

* **v1** → wallet login + ETH lookup + flags/ratings.
* **v2** → multi-chain support (ETH, BSC, Polygon, BTC), ENS/NFT enrichment.
* **v3** → user profiles, socials, KYC gating, donations, verification score.
* **v4** → admin tools, blacklisting, dismiss flags, audit trail, enhanced search.

Now in **v5**, we focus on **automation + intelligence**. Instead of only manual moderation, we add **background jobs, automated wallet monitoring, and alerts**.

---

# 📘 Blockpage411 v5 — Design Document

## 1. 🎯 **Goal**

Shift the platform from **reactive admin control** (v4) → to **proactive automated monitoring**.
Wallets flagged, trending, or suspicious are automatically refreshed, scanned, and surfaced.

---

## 2. 🧩 **Core Features in v5**

### a) **Background Jobs (Redis + Bull / Cron)**

* Use **BullMQ (Redis-based job queue)** or `node-cron` for background tasks.
* Tasks:

  * 🔄 **Refresh Cached Transactions**: For flagged wallets every X minutes.
  * 📊 **Track Popular Wallets**: Top searched wallets refreshed more often.
  * 🚨 **Suspicious Activity Alerts**: Auto-flag wallets with unusual transaction patterns.

---

### b) **Transaction Caching & Refresh**

* Txs are cached in Redis (or MongoDB with TTL index).
* **Refresh job** runs:

  * Flagged wallets every 10 min.
  * Popular wallets every 30 min.
  * Regular wallets daily.

---

### c) **Suspicious Activity Detection (Basic Rules)**

* If wallet has **10+ incoming txs < \$5 within 5 minutes** → auto-flag as spam.
* If wallet receives **funds from 3+ blacklisted wallets** → auto-suspicious.
* If wallet triggers suspicion → admin notified in dashboard.

---

### d) **Notifications & Alerts**

* Admins can see a **“Suspicious Wallets” dashboard**.
* Optional **email/Telegram alerts** (future v6).

---

### e) **UI Enhancements**

* **Wallet Profile Badge Updates**:

  * 🔴 Suspicious (auto-flagged by system).
  * ⚡ Popular (highly searched).
* **Dashboard**:

  * Tab for “Suspicious Wallets” (sortable by risk score).
  * Tab for “Popular Wallets” (tracked by background jobs).

---

## 3. 🏗️ **System Architecture (v5)**

### Frontend (Next.js + Tailwind)

* New **Admin Dashboard Tabs**:

  * Suspicious Wallets → shows auto-detected issues.
  * Popular Wallets → shows wallets with most recent searches.
* Profile pages → new **badge system** (Suspicious, Popular).

### Backend (Next.js API routes)

* **Job Scheduler (Bull or Cron)**:

  * `/jobs/refreshTxs` → refreshes cached transactions.
  * `/jobs/scanSuspicious` → runs detection logic.
* **API Endpoints**:

  * `/api/wallet/suspicious` → list suspicious wallets.
  * `/api/wallet/popular` → list popular wallets.

### Database (MongoDB + Redis)

* **Redis**:

  * `tx_cache:{wallet}` → cached transactions.
  * `popular_wallets` → sorted set by search count.
* **MongoDB**:

  * Add `suspicious` flag + `suspicionReason` to wallets.

---

## 4. 🔑 **Security / Constraints**

* Background jobs must run safely (with retry & backoff).
* Suspicious wallet detection is **advisory only**, requires admin confirmation.
* Popular wallet tracking is anonymized (not tied to specific user search logs).

---

## 5. 🚀 **Step-by-Step Implementation**

### Step 1: Setup Redis + Bull

* Install `bullmq`.
* Create worker files for:

  * `refreshTxs.worker.ts`
  * `scanSuspicious.worker.ts`

### Step 2: Implement Job Scheduling

* Flagged wallets → refresh every 10 min.
* Popular wallets → refresh every 30 min.
* Regular wallets → once per day.

### Step 3: Add Suspicious Activity Rules

* Write detection logic.
* Mark wallets with `wallet.suspicious = true` + reason.

### Step 4: Update Dashboard & Profile UI

* Add new badges (Suspicious, Popular).
* Add “Suspicious Wallets” & “Popular Wallets” tabs in admin dashboard.

---

## 6. 📅 Roadmap Beyond v5

* **v6:** Add server-side caching headers, CDN support, API rate limiting.
* **v7:** Introduce **community DAO voting** on suspicious/blacklist actions.
* **v8:** AI/ML integration for scam-pattern detection.

---

## ✅ Summary — Blockpage411 v5

* 🔄 Automated background jobs (Redis + Bull / Cron).
* 🗂️ Cached transaction refresh cycles for flagged/popular wallets.
* 🚨 Suspicious activity detection (basic rules).
* 👥 Admin dashboard for suspicious & popular wallets.
* 🎨 Profile badges for Suspicious & Popular wallets.