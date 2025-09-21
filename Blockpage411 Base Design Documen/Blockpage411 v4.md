let’s move on to **Blockpage411 v4**, building on top of v3.

So far:

* **v1** → wallet login, ETH lookup, flags/ratings.
* **v2** → multi-chain support (ETH, BSC, Polygon, Bitcoin), ENS/NFT enrichment.
* **v3** → user profiles with socials, phone apps, KYC gating, donations, verification score.

Now in **v4**, we introduce **community governance + admin tools**, making the platform more self-regulating.

---

# 📘 Blockpage411 v4 — Design Document

## 1. 🎯 **Goal**

Blockpage411 v4 empowers **admins and community moderators** with tools to manage the directory.
This ensures flagged wallets, donation abuse, and spammy profiles can be handled properly.

---

## 2. 🧩 **Core Features in v4**

### a) **Admin Roles & Permissions**

* Admins are selected wallets (configured in `.env` or DB).
* Permissions:

  * **Blacklist a wallet** (mark as unsafe → wallet hidden from search results).
  * **Dismiss a flag** (if community incorrectly flagged someone).
  * **Deactivate donation requests** (spam/scam donations).
  * **Ban user from updating profile** (if abusive).

---

### b) **Community Moderation (Admin UI)**

* A new **Community tab** on profiles, visible only to admins:

  * Inline tools (buttons):

    * 🗑️ Dismiss Flag
    * 🚫 Blacklist Wallet
    * ⏸️ Deactivate Donation
* Each action requires **confirmation modal** before execution.

---

### c) **Audit Trail / Logging**

* Every admin action is logged in DB (`AdminActions` collection):

```json
{
  "admin": "0xAdminWallet",
  "action": "blacklist_wallet",
  "target": "0xVictimWallet",
  "reason": "Repeated scam reports",
  "timestamp": "2025-09-15T12:00:00Z"
}
```

* Allows transparency + accountability.

---

### d) **Enhanced Search & Filters**

* Search results now:

  * Exclude blacklisted wallets.
  * Show **status tags** on profiles:

    * ✅ Verified
    * 🚩 Flagged (X flags)
    * ⛔ Blacklisted

---

## 3. 🏗️ **System Architecture (v4)**

### Frontend (Next.js + Tailwind)

* **Profile → Community Tab**:

  * Only visible if `user.address` is an admin wallet.
  * Contains moderation buttons.
  * Uses **confirmation modals** before executing.
* **Search Results Page**:

  * Displays profile cards with badges (Verified, Flagged, Blacklisted).

### Backend (Next.js API routes)

* New endpoints:

  * `/api/admin/blacklist` → POST `{ wallet, reason }`.
  * `/api/admin/dismissFlag` → POST `{ wallet, flagId }`.
  * `/api/admin/deactivateDonation` → POST `{ donationId }`.
* Middleware:

  * Only allow requests if signed-in wallet is in `ADMIN_WALLETS` list.

### Database (MongoDB Atlas)

* **Wallets** extended with:

```json
{
  "address": "0x123...",
  "blacklisted": true,
  "blacklistReason": "Fraudulent activity",
  "blacklistedAt": "2025-09-15"
}
```

* **AdminActions** collection for logging actions.

---

## 4. 🔑 **Security / Constraints**

* Only wallets in `ADMIN_WALLETS` (env config) can call admin endpoints.
* Rate limiting for admin actions (to prevent accidental spam).
* All admin actions logged immutably in DB.

---

## 5. 🚀 **Step-by-Step Implementation**

### Step 1: Extend Models

* `Wallet` model → add `blacklisted, blacklistReason, blacklistedAt`.
* Create `AdminAction` model.

### Step 2: Create API Routes

* `/api/admin/blacklist`
* `/api/admin/dismissFlag`
* `/api/admin/deactivateDonation`
  Each checks if user is admin, executes, then logs action.

### Step 3: Update Profile Page

* Add **Community Tab** for admins:

  * Buttons → confirm modal → call admin API.

### Step 4: Update Search

* Exclude blacklisted wallets from results.
* Show tags for Verified, Flagged, Blacklisted.

---

## 6. 📅 Roadmap Beyond v4

* **v5:** Background jobs (Redis + Bull or Cron) to refresh flagged wallets & popular wallets.
* **v6:** Performance optimizations (server-side caching headers).
* **v7:** DAO-style governance where **users vote** on blacklisting instead of only admins.

---

## ✅ Summary — Blockpage411 v4

* 🛡️ Admin tools: blacklist, dismiss flag, deactivate donation
* 👥 Community tab for inline moderation
* 📝 Admin actions logged (audit trail)
* 🔍 Enhanced search with blacklist filtering & status tags