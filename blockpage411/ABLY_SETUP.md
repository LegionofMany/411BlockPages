Ably setup and local testing

Overview
- This project can publish realtime transaction events to Ably using a serverless API route (`/api/realtime/publish`).
- The client (`app/components/landing/RealTimeTransactions.tsx`) subscribes to Ably when `NEXT_PUBLIC_ABLY_KEY` is present. If not present, it falls back to a local WebSocket at port 8080.

Vercel environment variables
- In your Vercel project settings add the following:
  - `ABLY_API_KEY` (secret) — your Ably REST key (format: `keyXXX:secretYYY`). Keep this secret.
  - `NEXT_PUBLIC_ABLY_KEY` (public) — your Ably client key for subscribing. This is safe to expose to the browser.

Local development (.env.local)
- You can add the following to `.env.local` for local testing (already present with placeholders):

```
ABLY_API_KEY=your_ably_rest_key_here
NEXT_PUBLIC_ABLY_KEY=your_ably_client_key_here
PUBLISH_URL=http://localhost:3000/api/realtime/publish
```

- Restart the dev server after changing environment variables.

How publishing works
- Serverless: `pages/api/realtime/publish.ts` will forward messages to Ably using `ABLY_API_KEY`.
- Client: the browser uses `NEXT_PUBLIC_ABLY_KEY` to subscribe to the `transactions` channel.

Testing locally
1) Start Next dev server

```powershell
npm run dev
```

2) (Optional) If you want to simulate a transaction producer and you have Ably keys configured, run:

```powershell
npm run simulate:tx
```

This posts simulated transactions to `/api/realtime/publish` which will forward them to Ably.

3) Visit http://localhost:3000 and open the Live Transaction Feed — it should show published events if Ably keys are configured.

Running without Ably
- If you prefer to run without Ably, the client falls back to connecting to a local WebSocket at `ws://localhost:8080`. To use that, run the legacy WS server:

```powershell
npm run start:ws
```

Security notes
- Do NOT put `ABLY_API_KEY` in any client-accessible variable — keep it as a server-side secret in Vercel.
- For production, consider implementing Ably token auth (the server issues short-lived tokens and the client uses those tokens instead of a static key). This reduces the blast radius if a client key is leaked.

Next steps (optional)
- I can add an `/api/realtime/token` route that issues Ably token requests (more secure). Tell me if you want that implemented and I will add it.

