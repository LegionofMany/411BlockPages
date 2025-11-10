Charities Page — How to Access & Use

Overview

This document explains how to find, use, and test the Charities (Giving Block) page in this project. It covers development steps (running the app, seeding sample charities), UI elements you will interact with, accessibility behavior, and troubleshooting tips.

Files involved

- `pages/charities/index.tsx` — the charities listing page (pages router).
- `components/CharityCard.tsx` — per-charity UI: logo, name, description, donate toggle (Giving Block embed), wallet address, copy button, Explorer link, and QR.
- `components/DonationQR.tsx` — QR image generator / display used by `CharityCard`.
- `pages/api/charities` — API route that serves charities data (searchable via `?q=`).
- `pages/api/charities/seed-local.ts` — dev-only POST endpoint to seed `data/charities.json` into MongoDB.
- `scripts/seed_charities.js` — CLI script to seed sample charities (used during development).
- `data/charities.json` — sample charity data used by the seed script and dev endpoint.

Quick start (development)

1. Install dependencies (if not already done):

```powershell
cd C:\Users\user\Desktop\Block411\blockpage411
npm install
```

2. Seed sample charities locally (optional but recommended):

- Using the CLI script:

```powershell
node .\scripts\seed_charities.js
```

- Or using the dev-only API endpoint (works when running the dev server):

Open your browser to:

http://localhost:3000/charities

Click the "Seed sample (dev)" button (requires confirmation). This calls `POST /api/charities/seed-local?allow=1`.

3. Run the development server:

```powershell
npm run dev
```

4. Open the page in your browser:

http://localhost:3000/charities

What you will see (UI elements)

- Header: "Charities" — the title of the page.
- Search box: Search charities by name, website, or wallet address. Typing filters the list.
- Refresh button: Re-fetches the charities list from the API.
- Seed sample (dev) button: Seeds sample charity data into your local MongoDB via the dev-only API route.
- Listing: Cards for each charity (grid view).

Charity card features (per-card)

- Logo: loaded via Next.js `Image` with a blur placeholder and local SVG fallback (if remote image fails).
- Name & website: click-through for the site's details (if implemented elsewhere).
- Description: short text describing the charity.
- Chain badge: shows `ETH`, `BTC`, `SOL`, etc. when detected or set in the charity document.
- Donate (Giving Block) toggle: toggles an inline embed iframe showing the Giving Block donation widget — this is sandboxed and accessible via keyboard.
- Wallet: visible address (if available) with:
  - Copy Wallet button — copies the address to clipboard and shows an alert confirmation.
  - View on Explorer — opens the appropriate chain explorer derived via `lib/explorer.ts`, or falls back to the site's internal search when unknown.
  - QR code — small QR image to scan and pay directly.

Accessibility & keyboard

- Donate toggle is keyboard-accessible (Enter/Space toggles) and uses `aria-expanded` and `aria-controls` so screen readers announce the state.
- Copy button has `aria-label` describing the action.
- A "Skip to content" link lives in the page layout (top-left) so keyboard users can jump to the main content quickly.

Troubleshooting & notes

- If you don't see populated charities:
  - Make sure your `MONGODB_URI` is set in `.env.local` or use the provided seed script which uses the same configuration.
  - Use the seed script or Seed button to insert sample data.

- If logos or QR images fail to load:
  - The page will use a local SVG placeholder (`/public/icons/charity-placeholder.svg`) automatically.

- If you don't see style changes (contrast/background):
  - The project has global layout styles (`app/layout.tsx`) that set a body background. `pages/charities/index.tsx` includes inline and `style jsx global` overrides to increase contrast. If you still don't see changes, clear browser cache or test in an incognito window.

- If embeds do not render due to CSP / X-Frame-Options:
  - The Giving Block embed may be blocked by the remote site. The donate toggle still provides a link to open the external donation page in a new tab when iframe is blocked.

Advanced: Add or edit charities

- You can add more items to `data/charities.json` and re-run the seed script to upsert them.
- The Charity model supports optional `chain` and `wallet` fields. Providing `chain` (e.g., `ETH`, `BTC`, `SOL`) will make explorer linking deterministic.

Questions or customizations

If you want me to:

- Add a per-charity `Donate` button that opens the Giving Block page in a new tab instead of an iframe, I can add that easily.
- Replace the external QR image generator with a local SVG QR generator (removes external dependency), I can implement that and add a small, fast library.
- Make the charity cards editable by admins (create/update forms + secured API), I can scaffold admin routes and API endpoints.

Contact

If anything above fails or you want enhancements, tell me which change you'd like next and I'll implement it.
