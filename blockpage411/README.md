# Blockpage411 — local dev & seeding

This README describes how to seed the provider list, run the app locally, and run a small smoke test.

Prerequisites
- Node 18+ (for built-in fetch in node if running helper scripts)
- npm
- A MongoDB instance (Atlas). Provide `MONGODB_URI` in `.env.local` or environment.

Seed providers (uses `data/providers.json`)

The repository contains a small JS seeder that reads `data/providers.json` and inserts/updates providers in your MongoDB.

From the repository root (Windows PowerShell):

```powershell
# ensure your .env.local contains MONGODB_URI or set it in the shell
npm --prefix .\blockpage411 exec -- node .\scripts\seed_providers_node.js
```

Notes:
- The seeder will create Provider documents if they don't exist or update a matching provider by name.
- The seeder uses `.env.local` when present (it is loaded automatically).

Run the app (dev)

```powershell
npm --prefix .\blockpage411 run dev
```

Open `http://localhost:3000/search` to use the three-field search / report page. The report flow uses the `ethers` signer in your browser to optionally collect ownership signatures.

Run production (after build)

```powershell
npm --prefix .\blockpage411 run build
npm --prefix .\blockpage411 run start
```

Quick smoke tests (after server is running)

```powershell
# providers list
Invoke-RestMethod 'http://localhost:3000/api/providers' | ConvertTo-Json -Depth 3
# popular wallets
Invoke-RestMethod 'http://localhost:3000/api/wallet/popular' | ConvertTo-Json -Depth 3
```

If requests to `localhost:3000` fail, ensure your process is running and not blocked by a firewall. The server logs will show startup messages.


# Blockpage411 — User Guide & Access Instructions

Blockpage411 is a multi-chain wallet directory and reputation platform. Users can search, flag, rate, and view detailed profiles for blockchain wallet addresses across major chains. The app is accessible via a modern, mobile-friendly web UI.

---

## 🚀 How to Access and Use Blockpage411

### 1. Home & Landing Page
- **URL:** `/` (Home)
- **What you see:** Modern landing page with feature highlights, supported chains, and navigation.

### 2. Search & Report
- **URL:** `/search`
- **How to use:**
	- Enter a wallet address and select a blockchain (ETH, BSC, Polygon, BTC, etc.).
	- Click **Search** to view the wallet profile.
	- To flag or report a wallet, click **Flag / Report** and follow the modal instructions (sign with your wallet or confirm ownership).

### 3. Wallet Profile
- **URL:** `/wallet/[chain]/[address]`
- **How to use:**
	- View wallet details: address, chain, ENS (if ETH), NFT count, recent transactions, flags, ratings, and profile info (display name, avatar, bio, socials, phone apps, KYC, donation links).
	- **Edit Profile:** If you own the wallet, connect your wallet and click **Edit Profile** to update display name, avatar, bio, socials, phone apps, and donation links.
	- **Flag/Rate:** Community members can flag (e.g. scam, trusted) and rate (1-5 stars) per chain.

### 4. Login
- **URL:** `/login`
- **How to use:**
	- Connect your wallet (MetaMask, Coinbase, WalletConnect) to log in.
	- Once logged in, you can edit your wallet profile and submit reports.

### 5. Admin Dashboard
- **URL:** `/admin`
- **Access:** Requires admin wallet (see `ADMIN_WALLETS` in your environment config).
- **Features:**
	- View flagged wallets, suspicious activity, and analytics.
	- Run auto-promote actions and export promoted providers as CSV.
	- Review and approve/dismiss reports and moderation items.

### 6. Donate
- **URL:** `/donate`
- **How to use:**
	- View donation options and QR codes for supported chains.

### 7. Other Pages
- **Popular Wallets:** `/admin/popular-wallets` (admin only)
- **Suspicious Wallets:** `/admin/suspicious-wallets` (admin only)
- **Alerts:** `/admin/alerts` (admin only)
- **Fundraisers:** `/fundraisers` (if enabled)

---

## 🧑‍💻 User Requirements

- **General users:**
	- No login required to search and view wallet profiles.
	- To flag, rate, or edit a wallet profile, connect your wallet (MetaMask, Coinbase, WalletConnect).
- **Admins:**
	- Must connect a wallet listed in `ADMIN_WALLETS` (set in `.env.local` or Vercel env).
	- Admin pages are protected and require wallet authentication.

---

## 🗺️ Navigation Tips

- Use the dropdown navigation button at the top for quick access to Search, Admin Dashboard, Login, and Home.
- On mobile, navigation is accessible via the hamburger menu.
- Use the **Skip to content** link for accessibility.

---

## 🛠️ Running Locally

1. **Install dependencies:**
	 ```bash
	 npm install
	 ```
2. **Configure environment:**
	 - Copy `.env.example` to `.env.local` and fill in your secrets (MongoDB URI, API keys, etc.).
3. **Start the dev server:**
	 ```bash
	 npm run dev
	 ```
4. **Open:** [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architecture & Security

- **Frontend:** Next.js (React, SWR, wagmi, ethers, tailwindcss)
- **Backend:** Next.js API routes, MongoDB Atlas
- **APIs:** Etherscan, BscScan, Polygonscan, Blockstream
- **Security:**
	- Max 5 flags/day/user (across all chains)
	- 1 rating per user per chain per wallet
	- JWT authentication (wallet signature)
	- Transactions cached for 15 minutes
	- Fallback to cached data if chain API is down

---

## 📦 Deployment

- Deploy on [Vercel](https://vercel.com/) or your preferred platform.
- See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 📄 License

MIT

