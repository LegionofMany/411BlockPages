Excellent — this README is a solid foundation.
Now, let’s **upgrade** it to match everything your client wants.

Below is your **updated and expanded README.md**, rewritten for clarity and alignment with your client’s full vision — including:
✅ The **three-field wallet search page (wallet, exchange, receiving address)**
✅ The **auto-prefilled dropdown** for top 100 exchanges (with “Other” option)
✅ The **flag/report workflow**
✅ The **user rating system (thumbs up/down + 5-star + comment)**
✅ The **wallet privacy rules (hide assets until flagged)**
✅ The **trust meter + transparency escalation**
✅ The **vision for exchange collaboration once 100k users are reached**

---

# 🧠 Blockpage411 — Next-Gen Wallet Reputation & Exchange Collaboration Platform

Blockpage411 is a multi-chain wallet intelligence platform designed to help users **search, flag, and rate** blockchain wallet addresses, while maintaining **user privacy** and building **trust-based relationships** with major cryptocurrency exchanges.

---

## 🚀 Key Features (New Vision)

### 🔍 Enhanced Search & Reporting Page (`/search`)

The search page now includes **three fields**:

1. **Your Wallet Address** — the user’s personal address
2. **Exchange (Prefilled Dropdown)** — select your wallet’s source exchange (e.g., Coinbase, Binance, Netcoins, Shakepay, etc.)

   * Prefilled with **Top 100 Cryptocurrency Exchanges** (sourced from CoinMarketCap)
   * Includes **“Other”** option where users can manually add missing exchanges or cold storages
   * Future updates will promote frequently added “Other” entries to the default list once 100K requests are reached
3. **Receiving Wallet Address** — the wallet you sent funds to, which can be flagged or reported

**Actions on this page:**

* Search any wallet address
* Flag or report a suspicious address
* Automatically record user-exchange associations for analytical tracking

---

### 🧾 Exchange Integration & Growth Vision

Once the user base reaches **100K verified reports per exchange**, the platform will:

* Initiate **collaborations with exchanges** for direct data integrations
* Enable verified exchanges to interact directly with user reports and transparency requests
* Use the **Top 100 exchange dataset** (stored in `data/exchanges.json`) for dropdown population and analytics

---

### 👤 User Profiles & Ratings

Each wallet profile now includes:

* **Thumbs Up/Down** quick trust indicator
* **5-Star Rating** with optional comment
* **Flag/Report button** for fraudulent or suspicious activity
* **Track Meter (Trust Index)** showing community reputation over time

**Privacy Controls:**

* Wallet **balances and assets remain hidden** by default
* Assets become **visible only when the wallet is heavily flagged** (for investigation and transparency)
* This prevents malicious actors from targeting high-value wallets (extortion protection)

---

### 🧩 Reporting Workflow

When a user reports a suspicious address:

1. They must confirm ownership of their own wallet (“This account must be yours before you continue ⚠️”).
2. The user signs the report using wallet signature (MetaMask, Coinbase, WalletConnect).
3. The system associates their exchange and address to track network patterns.
4. Multiple reports from verified users trigger transparency escalation:

   * Yellow ⚠️ (moderate suspicion)
   * Red 🔴 (confirmed scam, partial transparency)
   * Black ⚫ (fully flagged — transparent history visible to all)

---

## 🧠 System Architecture

**Frontend:**

* Next.js + React
* TailwindCSS for styling
* wagmi + ethers.js v6 for wallet connections
* SWR for data fetching and caching
* Dropdown components with **auto-prefill + “Other” option logic**

**Backend:**

* Next.js API Routes (Node/Express compatible)
* MongoDB Atlas (collections: `users`, `wallets`, `reports`, `exchanges`)
* Seeder script (`scripts/seed_exchanges.js`) for importing top 100 exchanges
* JWT authentication (wallet signature verification)
* Security Rules:

  * Max 5 flags per user/day
  * 1 rating per user per wallet
  * Hide assets until heavily flagged

---

## 🧰 Setup Instructions

### 1. Prerequisites

* Node 18+
* npm or yarn
* MongoDB Atlas (set `MONGODB_URI` in `.env.local`)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy `.env.example` → `.env.local`
Add your environment variables:

```
MONGODB_URI=your_connection_string
ADMIN_WALLETS=0x123,0x456,...
NEXT_PUBLIC_CHAIN_APIS=...
GIVINGBLOCK_API_KEY=...
GIVINGBLOCK_BASE_URL=https://public-api.sandbox.thegivingblock.com
GIVINGBLOCK_WEBHOOK_SECRET=...
GIVINGBLOCK_ENCRYPTION_KEY=...
GIVINGBLOCK_ENCRYPTION_IV=...
```

### 4. Seed Exchange List

A new script loads the **Top 100 Exchange Names** from `data/exchanges.json`:

```bash
npm run seed:exchanges
```

*(This populates the dropdown field on the search page.)*

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000/search](http://localhost:3000/search)

### 6. Production Build

```bash
npm run build
npm run start
```

---

## 📈 Analytics Vision

* Track **exchange usage statistics** to identify trends
* Count how many users are linked to each exchange
* Use aggregated data to negotiate **exchange partnerships**
* Enable future **exchange API connections** for automated scam mitigation

---

## 🧩 Example Search Flow

1. User opens `/search`
2. Selects **Netcoins** from exchange dropdown
3. Enters **their wallet address**
4. Enters **CFX receiving address**
5. Clicks **Search or Flag/Report**
6. System verifies ownership → stores relationship → updates trust meter

---

Note on naming: the project exposes both "fundraisers" and "campaigns" terminology. Web UI routes live under `/fundraisers` (for example `/fundraisers` and `/fundraisers/create`) and `/campaigns` is provided as a route alias that mirrors the same UI. Similarly, API routes under `/api/campaigns` are aliased to the existing `/api/fundraisers` handlers so both names work for integrations.


## 🕵️ Security and Ethics

Blockpage411 is designed to **protect honest users** and **expose scammers** without revealing sensitive wallet data.

| Rule                | Description                                    |
| ------------------- | ---------------------------------------------- |
| 🕶️ Privacy         | Hide wallet funds until flagged multiple times |
| ⚠️ Transparency     | Reveal wallet data gradually as flags increase |
| 🔐 Authentication   | Wallet signature required for reports          |
| 🚫 Abuse Prevention | Flag/rate limits per user/day                  |
| 🤝 Collaboration    | Data-driven exchange engagement                |

---

## 📊 Future Enhancements

* Integration with **soft/cold storage lists**
* **Geolocation tagging** (country auto-prefill)
* **AI-powered scam pattern detection**
* **Exchange dashboard** for real-time user analytics

---

## 📄 License

MIT — Open collaboration welcome.

---

Would you like me to include the **`data/exchanges.json` file** (with the top 100 exchanges prefilled and DB-ready)?
I can generate it immediately in both **CSV and JSON** formats for your `/data` folder.
