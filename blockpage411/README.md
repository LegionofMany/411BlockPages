


# Blockpage411 v5

Blockpage411 is a professional, multi-chain 411 directory for blockchain wallets. Now with advanced identity, community, and donation features. Search, flag, and rate wallet addresses across Ethereum, BSC, Polygon, Bitcoin, Solana, Avalanche, Cardano, Tron, and XRP. Build trust, reputation, and support in Web3 with a modern, glassmorphic, blockchain-themed landing page and dynamic navigation.

---


## 🚀 Features (v5)

- **Multi-chain wallet lookup**: Search and view wallet profiles on Ethereum, BSC, Polygon, Bitcoin, Solana, Avalanche, Cardano, Tron, XRP, and more
- **Expanded user profiles**: Display name, avatar, bio, social links (Telegram, Twitter, Discord, website), phone apps
- **KYC status**: Request and display KYC verification (unverified, pending, verified, rejected)
- **Donation requests**: Add links to Gitcoin, OpenCollective, Patreon, and more
- **Verification score**: Community-driven trust metric
- **Unified wallet profiles**: Each profile is chain-specific (address + chain)
- **Transaction history**: View recent transactions per chain
- **Flagging & rating**: Community can flag and rate wallets per chain
- **Profile enrichment**: ENS name and NFT count for Ethereum wallets
- **Modern, responsive UI**: Accessible, mobile-friendly, and professional blockchain design
- **Glassmorphism & animated backgrounds**: Professional blockchain landing page with glassmorphism, animated SVG gradients, and feature highlight cards
- **Dynamic chain logo carousel**: Responsive carousel showing supported chain logos, adjusts to all screen sizes
- **Dropdown navigation**: Separate, animated dropdown navigation button for easy access to all pages

---

## 🛠️ Getting Started

## Getting Started


### 1. Install dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure environment variables

Create a `.env.local` file with the following (see example below):

```
MONGODB_URI=your_mongodb_atlas_uri
ETHERSCAN_API_KEY=your_etherscan_key
BSCSCAN_API_KEY=your_bscscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
JWT_SECRET=your_jwt_secret
```

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


Open [http://localhost:3000](http://localhost:3000) with your browser.


---



## 🧩 Usage

- **Login**: Connect your wallet (MetaMask, Coinbase, WalletConnect)
- **Search**: Enter a wallet address and select a chain
- **Profile**: View address, chain, ENS, NFT count, transactions, flags, ratings, and expanded profile fields (display name, avatar, bio, socials, phone apps, KYC, donation links)
- **Edit Profile**: Update your display name, avatar, bio, socials, phone apps, and donation links
- **KYC**: Request KYC verification and view status
- **Flag/Rate**: Community can flag (e.g. scam, trusted) and rate (1-5 stars) per chain
- **Navigation**: Use the separate dropdown navigation button at the top for quick access to Search, Admin Dashboard, Login, Demo Wallet, and Home

---

## 🧪 Testing Checklist

- [ ] Search for wallets on all supported chains (ETH, BSC, Polygon, BTC)
- [ ] View wallet profile, ENS, NFT count (ETH), and transaction history
- [ ] Flag and rate wallets (per chain)
- [ ] Validate error handling (invalid address, API down, etc.)
- [ ] Test login, logout, and session persistence
- [ ] Check UI on mobile and desktop
- [ ] Confirm rate limits (5 flags/day/user, 1 rating/user/chain/wallet)
- [ ] Review fallback to cached data if API is unavailable

---



## 🏗️ Architecture

- **Frontend**: Next.js (app directory, SWR, wagmi, ethers, tailwindcss)
- **Backend**: Next.js API routes, MongoDB Atlas
- **APIs**: Etherscan, BscScan, Polygonscan, Blockstream
- **Database**: Wallets collection (address, chain, flags, ratings, avgRating, ens, nftCount, lastRefreshed)
- **User collection**: Expanded user profiles (address, displayName, avatarUrl, bio, socials, phoneApps, kycStatus, donationRequests, verificationScore, timestamps)
- **UI/UX**: Glassmorphism, animated SVG backgrounds, dynamic chain logo carousel, feature highlight cards, dropdown navigation

### API Endpoints (v3)

- `GET /api/me` — Get your full user profile (all fields)
- `PATCH /api/me.patch.ts` — Update your profile fields (displayName, avatarUrl, bio, socials, phoneApps, donationRequests)
- `POST /api/kyc-request.ts` — Request KYC verification
- `POST /api/donation-request.ts` — Add a donation request link

---

## 🔒 Security & Constraints

- Max 5 flags/day/user (across all chains)
- 1 rating per user per chain per wallet
- JWT authentication (wallet signature)
- Transactions cached for 15 minutes
- Fallback to cached data if chain API is down

---


## 📦 Deployment

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

Deploy on [Vercel](https://vercel.com/) or your preferred platform. See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel


Deploy on [Vercel](https://vercel.com/) or your preferred platform. See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

## Alerts and Slack integration

This project includes an alerting system for the poller that posts to a Slack Incoming Webhook and persists alerts in MongoDB for audit and retries.

Environment variables:
- `POLLER_SLACK_WEBHOOK` - Slack incoming webhook URL (required for alerts)
- `NEXT_PUBLIC_APP_URL` or `BASE_URL` - public URL used to build fundraiser links
- `SLACK_MAX_ATTEMPTS` - max retry attempts (default 3)
- `SLACK_BACKOFF_MS` - base backoff in ms (default 500)

Serverless retry (Vercel-compatible):

The project now uses a serverless-friendly retry endpoint which can be invoked by Vercel Cron or manually to process pending alerts. No external worker is required.

Example: invoke the retry API via an authenticated request or Vercel Cron that sets `x-poller-secret` to your `POLLER_SECRET`:

PowerShell example:

```powershell
$env:POLLER_SECRET = 'your_poller_secret_here'
Invoke-RestMethod -Uri 'https://your-app.vercel.app/api/admin/alerts/retry' -Headers @{ 'x-poller-secret' = $env:POLLER_SECRET } -Method Post
```

Recommended Cron schedule (every 5 minutes) for Vercel Cron jobs: set the Request URL to `https://your-app.vercel.app/api/admin/alerts/retry` and add a header `x-poller-secret` with your `POLLER_SECRET` value.

Admin UI & API:
- Admin API: `GET /api/admin/alerts` — lists recent alerts (requires admin auth or `x-admin-wallet` header)
- Admin UI: `/admin/alerts` — simple UI to view alerts (protected by your admin auth flow)


---

## 📄 License

MIT
