let’s move on to **Blockpage411 v3**, building directly on top of v2.

In **v1**, we had: wallet login + Ethereum wallet lookup + flags/ratings.
In **v2**, we expanded to **multi-chain support (ETH, BSC, Polygon, Bitcoin) + profile enrichment (ENS/NFT count)**.

Now in **v3**, we introduce **identity & community features** to turn Blockpage411 into a **Web3 directory of people, not just addresses**.

---

# 📘 Blockpage411 v3 — Design Document

## 1. 🎯 **Goal**

Blockpage411 v3 evolves from a **wallet lookup tool** into a **blockchain-powered directory of profiles**.
Users can build **profiles with optional verification**, connect **social media + phone apps**, and request **donations**.

---

## 2. 🧩 **Core Features in v3**

### a) **Profile Expansion**

* Wallet profile now includes optional user-added details:

  * **Social Media Dropdown**: Instagram, Facebook, Twitter/X
  * **Phone Apps**: Telegram, Discord, WhatsApp
  * **Telegram Handle**: separate field
* The more fields filled, the **higher the verification score**.

---

### b) **KYC Flow**

* Base login = wallet only (MetaMask, Coinbase Wallet).
* After login:

  * **Optional KYC verification** (upload docs via integrated provider or stub in v3).
  * If KYC-verified → user can unlock **social media + phone app fields**.
  * Verification badge shown on profile.

---

### c) **Donation Tab**

* Users can create **donation requests** linked to their profile.
* Features:

  * **Description** → why they’re requesting support.
  * **Wallet selection** → which wallet to receive donations.
  * **Timeline** → requests expire in **60 days** automatically.
* Donations are displayed **publicly** on profile until expiry.

---

### d) **Verification Score**

* A calculated score that increases as profile is completed:

  * Base = Wallet login ✅
  * * ENS name ✅
  * * NFT count ✅
  * * Socials filled in ✅
  * * Phone apps connected ✅
  * * KYC completed ✅
* Displayed as a **badge** (Bronze, Silver, Gold, Diamond).

---

## 3. 🏗️ **System Architecture (v3)**

### Frontend (Next.js + Tailwind)

* New **Profile Page Enhancements**:

  * Show wallet + chain details (from v2).
  * **Profile card** with verification score + badges.
  * **Social links section** (icons for IG, FB, Twitter).
  * **Phone app section** (Discord, Telegram, WhatsApp).
  * **Donation tab** with description + countdown timer.
* Login still **wallet-only**, email reserved for KYC provider.

### Backend (Next.js API routes)

* `/api/profile/update` → PUT endpoint (requires KYC) to update socials/phone apps.
* `/api/donations` → POST endpoint to create donations (expires in 60 days).
* `/api/profile/[chain]/[address]` → fetches profile + donation + verification score.

### Database (MongoDB Atlas)

* **Users**

  ```json
  {
    "address": "0x123...",
    "chain": "ethereum",
    "kycVerified": true,
    "socials": {
      "instagram": "@alice",
      "facebook": "alice.fb",
      "twitter": "@alice_eth"
    },
    "apps": {
      "telegram": "@aliceTG",
      "discord": "alice#1234",
      "whatsapp": "+123456789"
    },
    "verificationScore": 85
  }
  ```

* **Donations**

  ```json
  {
    "owner": "0x123...",
    "description": "Raising funds for NFT project",
    "receiveWallet": "0x123...",
    "createdAt": "2025-09-15",
    "expiresAt": "2025-11-15",
    "active": true
  }
  ```

---

## 4. 🔑 **Security / Constraints**

* Social media & phone apps **only editable if KYC-verified**.
* Donations automatically deactivated after 60 days.
* Flags/ratings (from v2) remain in place.
* Rate limiting:

  * Profile updates: max 5/day.
  * Donations: max 1 active per user at a time.

---

## 5. 🚀 **Step-by-Step Implementation**

### Step 1: Extend Models

* Add `socials`, `apps`, `kycVerified`, `verificationScore` to **User** schema.
* Add `Donation` schema with expiry logic.

### Step 2: Add API Endpoints

* `PUT /api/profile/update` → updates socials/apps if `kycVerified`.
* `POST /api/donations` → creates donation (sets `expiresAt = now + 60 days`).
* `GET /api/profile/[chain]/[address]` → returns user + donation + computed verification score.

### Step 3: Frontend Enhancements

* Update **Profile Page**:

  * Social media dropdowns.
  * Phone app connect buttons.
  * Donation tab with description & countdown.
  * Verification score + badges.

### Step 4: Donation Expiry Job

* Cron or background worker:

  * Runs daily to set `active = false` for expired donations.

---

## 6. 📅 Roadmap Beyond v3

* **v4:** Admin community tools (blacklist wallet, dismiss flags, deactivate donations).
* **v5:** Background jobs with Redis (transaction refresh, analytics).
* **v6+:** DAO-based governance for moderation.

---

## ✅ Summary — Blockpage411 v3

* 👤 Expanded profiles: socials, apps, Telegram handle
* ✅ KYC flow gates profile expansion
* 💸 Donation tab with 60-day expiry
* 🏅 Verification score & badges (Bronze → Diamond)
* 🔗 Continues multi-chain support from v2

