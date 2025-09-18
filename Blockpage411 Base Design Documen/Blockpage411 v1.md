# 📘 Blockpage411 v1 
frome work: NEXT.JS

## 1. 🎯 **Concept / Goal**

Blockpage411 v1 is a **blockchain-powered 411 directory**, like a phone book for wallets.
Users can:

* **Log in with their wallet** (no email/password).
* **Look up wallet addresses** and see their **transactions**.
* **Flag wallets** (e.g., *trusted*, *scammer*).
* **Rate wallets** to build reputation scores.

👉 The v1 release is the **MVP (minimum viable product)**: it proves the concept with **wallet login, search, flagging, and rating**.

---

## 2. 🧩 **Core Features in v1**

### a) **Authentication**

* **Login with Wallet only** (MetaMask, Coinbase Wallet, WalletConnect).
* Nonce + Signature flow for secure login:

  1. Backend issues a **nonce**.
  2. User signs it with wallet.
  3. Backend verifies signature and creates a session (JWT).

### b) **Wallet Search**

* Input: wallet address.
* Output: wallet’s **basic profile** (if created) + **transaction history**.
* For v1, transactions are pulled from **Etherscan API** (Ethereum mainnet only).

### c) **Flagging & Rating**

* Logged-in users can:

  * **Flag a wallet** (e.g., scam/trusted).
  * **Rate a wallet** (1–5 stars).
* Role-based throttling:

  * Max **5 flags per user per day**.
  * Prevents spam/abuse.

### d) **Profile Basics**

* Every wallet has a **default profile** created on first lookup.
* Profile includes:

  * Wallet address (primary ID).
  * Flags (list of reports).
  * Average rating.
* No social/KYC yet (that comes later versions).

---

## 3. 🏗️ **System Architecture (v1)**

### Frontend (Next.js)

* UI pages:

  * `/login` → wallet login
  * `/search` → search wallet
  * `/wallet/[address]` → wallet profile with transactions, flags, ratings
* Libraries:

  * `wagmi` + `ethers.js` → wallet connection
  * `swr` → data fetching
  * `tailwindcss` → styling (dark theme by default)

### Backend (Next.js API routes)

* `/api/auth/nonce` → issue login nonce
* `/api/auth/verify` → verify signature, return JWT
* `/api/me` → fetch current user profile
* `/api/wallet/[address]` → fetch wallet profile & transactions
* `/api/flags` → POST to flag a wallet
* `/api/ratings` → POST to rate a wallet

### Database (MongoDB Atlas)

Collections:

* **Users**

  ```json
  {
    "address": "0x123...",
    "nonce": "random-string",
    "nonceCreatedAt": "2025-09-15T12:00:00Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```
* **Wallets**

  ```json
  {
    "address": "0x456...",
    "flags": [
      { "user": "0x123...", "reason": "scam", "date": "..." }
    ],
    "ratings": [
      { "user": "0x123...", "score": 4, "date": "..." }
    ],
    "avgRating": 3.5
  }
  ```

---

## 4. 🔑 **Security / Constraints**

* Nonce expires in 5 minutes (prevents replay attacks).
* Rate limiting on flags & ratings:

  * Max 5 flags/day per user.
  * Max 1 rating per user per wallet.
* JWT stored in **HttpOnly Secure Cookies**.

---

## 5. 🚀 **Step-by-Step Implementation**

### Step 1: Setup Next.js + MongoDB

* `npx create-next-app blockpage411`
* Install deps:

  ```bash
  npm install mongoose ethers wagmi tailwindcss swr jsonwebtoken
  ```
* Setup MongoDB Atlas connection in `lib/db.ts`.

### Step 2: Authentication Flow

* `/api/auth/nonce` → generate nonce & store in User doc.
* `/api/auth/verify` → verify wallet signature → issue JWT cookie.
* Frontend: use `wagmi` for wallet connect, then call API with signature.

### Step 3: Wallet Profile

* `/api/wallet/[address]`:

  * Look up wallet in DB (create if new).
  * Fetch txs from Etherscan API.
  * Return profile + transactions.

### Step 4: Flags & Ratings

* `/api/flags` → POST a flag for wallet (respect 5/day limit).
* `/api/ratings` → POST a rating (1–5 stars).
* Update wallet doc with flags & ratings.
* Compute avg rating.

### Step 5: UI

* `/login` → button for MetaMask/Coinbase login.
* `/search` → enter wallet address.
* `/wallet/[address]` → show:

  * Wallet address
  * Transaction list
  * Flags table
  * Rating stars

---

## 6. 📅 Roadmap Beyond v1

* **v2:** Multi-chain support (BSC, Polygon, Bitcoin).
* **v3:** Profile expansion (socials, phone apps, donations).
* **v4:** Admin tools (blacklist, deactivate, badges).
* **v5+:** Background jobs (Redis), analytics, KYC, DAO governance.

---

✅ So **Blockpage411 v1** =
🔑 Wallet login
🔍 Wallet search
🚩 Flagging
⭐ Rating
📊 Basic profiles (Ethereum-only)

