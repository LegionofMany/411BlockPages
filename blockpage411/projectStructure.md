Excellent — that’s clear and detailed enough to integrate.
Here’s what your **client is asking for**, broken down and translated into technical updates for your current **Blockpage411** project.

---

## 🧩 Summary of Client’s New Requirements

The client wants to **extend Blockpage411** beyond wallet reputation into a **charity and donation platform** that:

* Lists **verified charities** (auto-seeded from *The Giving Block* API).
* Allows **users to host charity events** directly from their profiles (e.g. “help my surgery”, “fire recovery”, etc.).
* Enables **direct peer-to-peer donations** — no funds handled by the app itself.
* Optionally integrates with **The Giving Block donation card embed**.
* Introduces **time-limited campaigns (max 90 days)**.
* Boosts **trust score / visibility** of users who connect **verified socials and phone apps** (WhatsApp, Telegram, etc.).

---

## 🚀 Updated Project Scope

Blockpage411 will now become a **multi-chain wallet reputation + charity funding network**.

| Feature Area                          | Description                                                                                                                            | Implementation Plan                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Charity Integration (API)**         | Fetch verified charities from [The Giving Block API](https://docs.thegivingblock.com/docs/getting-started) and seed them into MongoDB. | Add new folder `data/charities.json` and a script `scripts/seed_charities.js` that reads from the API and populates the DB.                           |
| **Charity Listings UI**               | New route `/charities` to display a searchable list of charities (name, category, wallet, donation URL, tags).                         | Add a `CharitiesPage.jsx` in `/pages/charities`, fetching data via `/api/charities`.                                                                  |
| **User Charity Campaigns**            | Allow users to create time-limited donation campaigns from their wallet profile (e.g. “Need help for X”).                              | Extend wallet schema with `campaigns: [{ title, description, goal, wallet, expiry }]`. Add new form & modal under “Edit Profile” → “Create Campaign”. |
| **Direct Donations (P2P)**            | Each campaign shows the recipient wallet address and QR for donations.                                                                 | Generate dynamic QR codes via a lightweight lib like `qrcode.react`. No intermediary custody.                                                         |
| **The Giving Block Embed (optional)** | For verified charities, allow embedding their donation widget.                                                                         | Add iframe support if `givingBlockEmbedUrl` is present in the charity document.                                                                       |
| **Charity Time Limits**               | Limit personal campaigns to 90 days from creation. Auto-expire them via backend cron or check before display.                          | Add background job or scheduled check using `node-cron`.                                                                                              |
| **Social Boost / Reputation Scoring** | Each connected social or phone dapp (WhatsApp, Telegram, Twitter, etc.) increases the trust score.                                     | Extend profile schema with `socials: {...}`, and calculate `trustScore` dynamically on backend.                                                       |

---

## 🧠 Folder & File Structure Additions

```bash
blockpage411/
│
├── data/
│   ├── providers.json
│   ├── charities.json                  # ← new local data cache for seeded charities
│
├── scripts/
│   ├── seed_providers_node.js
│   ├── seed_charities.js               # ← new script for charity seeding
│
├── models/
│   ├── Provider.js
│   ├── Wallet.js
│   ├── Charity.js                      # ← new model
│
├── pages/
│   ├── charities/                      # ← new route
│   │   └── index.jsx
│
├── pages/api/
│   ├── charities/
│   │   ├── index.js                    # GET list of charities
│   │   ├── [id].js                     # GET single charity
│   ├── campaigns/
│   │   ├── create.js                   # POST create new user campaign
│   │   ├── list.js                     # GET active campaigns
│
├── components/
│   ├── CharityCard.jsx
│   ├── CampaignForm.jsx
│   ├── DonationQR.jsx
│   ├── TrustScoreBadge.jsx
│
├── utils/
│   ├── givingblock.js                  # ← API wrapper for The Giving Block
│   ├── scoring.js                      # ← social link → trust score logic
│
└── README.md                           # updated with new setup steps
```

---

## ⚙️ Step-by-Step Implementation Plan

### 1. Integrate The Giving Block API

* **Create a helper:** `/utils/givingblock.js`

```js
import fetch from 'node-fetch';

export async function fetchGivingBlockCharities() {
  const res = await fetch('https://api.thegivingblock.com/v1/organizations');
  if (!res.ok) throw new Error('Failed to fetch charities');
  return res.json();
}
```

* **Seed script:** `/scripts/seed_charities.js`

```js
import { connectToDB } from '../lib/mongodb.js';
import Charity from '../models/Charity.js';
import { fetchGivingBlockCharities } from '../utils/givingblock.js';

(async () => {
  await connectToDB();
  const charities = await fetchGivingBlockCharities();
  for (const c of charities) {
    await Charity.updateOne(
      { name: c.name },
      {
        $set: {
          name: c.name,
          description: c.mission,
          website: c.website,
          logo: c.logoUrl,
          givingBlockEmbedUrl: c.donationWidget,
          wallet: c.cryptoWalletAddress,
        },
      },
      { upsert: true }
    );
  }
  console.log(`Seeded ${charities.length} charities.`);
  process.exit(0);
})();
```

### 2. Extend MongoDB Schema

`models/Charity.js`

```js
import mongoose from 'mongoose';
const CharitySchema = new mongoose.Schema({
  name: String,
  description: String,
  website: String,
  logo: String,
  wallet: String,
  givingBlockEmbedUrl: String,
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.Charity || mongoose.model('Charity', CharitySchema);
```

`models/Wallet.js` → add campaigns and socials

```js
campaigns: [{
  title: String,
  description: String,
  goal: Number,
  expiry: Date,
  wallet: String,
  active: { type: Boolean, default: true },
}],
socials: {
  twitter: String,
  telegram: String,
  whatsapp: String,
  instagram: String,
},
trustScore: { type: Number, default: 0 },
```

### 3. Charity & Campaign API Routes

Provide new routes under `/api/charities` and `/api/campaigns`.

### 4. Frontend Pages

* `/charities` → list charities (logo, name, donation QR, optional embed).
* `/wallet/[chain]/[address]` → new “Charity Campaigns” section under profile.
* `/fundraisers` → public list of active campaigns.

### 5. Donation & Expiry

* Donations: Display wallet address or QR.
* Expiry: Add `expiresIn < 90 days` validation on creation.

### 6. Scoring Logic

`utils/scoring.js`

```js
export function calculateTrustScore(wallet) {
  let score = 0;
  if (wallet.socials?.twitter) score += 10;
  if (wallet.socials?.telegram) score += 10;
  if (wallet.socials?.whatsapp) score += 5;
  if (wallet.socials?.instagram) score += 5;
  return Math.min(score, 100);
}
```

---

## 📄 README Addendum (What to Add)

* Add section: **“Charity & Donation Features”**
* Document `.env` variable for The Giving Block API key (if required).
* Add command to seed charities:

  ```bash
  npm --prefix ./blockpage411 exec -- node ./scripts/seed_charities.js
  ```

-