import type { NextApiRequest, NextApiResponse } from 'next';
import { createAblyTokenRequest } from '../../../lib/ably';

// Small in-memory cache for token requests to avoid hammering Ably or causing repeated slow failures
const TOKEN_TTL_MS = 45_000; // 45 seconds
let cachedToken: { value: unknown; expiresAt: number } | null = null;
const CREATE_TIMEOUT_MS = 5000; // 5s timeout for creating Ably token

function isValidAblyKey(key?: string) {
  return !!key && key.includes(':');
}

function timeout<T>(ms: number, reason = 'timeout') {
  return new Promise<T>((_, reject) => setTimeout(() => reject(new Error(String(reason))), ms));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  // Fast-path: return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return res.status(200).json({ serverTimestamp: Date.now(), elapsedMs: 0, tokenRequest: cachedToken.value, cached: true });
  }

  // quick guard for config issues — avoid calling into Ably SDK when obviously misconfigured
  const key = process.env.ABLY_API_KEY;
  if (!isValidAblyKey(key)) {
    // ensure we return quickly instead of attempting to import or call Ably
    return res.status(503).json({ error: 'Realtime not configured (ABLY_API_KEY missing or malformed). Set ABLY_API_KEY in .env.local or Vercel env vars.' });
  }

  try {
    const start = Date.now();
    // race token creation against a short timeout so requests don't hang
    const tokenRequest = await Promise.race([createAblyTokenRequest(3600), timeout(CREATE_TIMEOUT_MS, 'Ably token create timed out')]);
    const elapsed = Date.now() - start;

    if (!tokenRequest) {
      // createAblyTokenRequest may return null when Ably is not configured or available
      console.warn('[/api/realtime/token] tokenRequest is null - Ably may be misconfigured');
      return res.status(503).json({ error: 'Realtime unavailable (token creation returned no data).' });
    }

    // cache the token request for a short time to avoid repeated SDK/HTTP calls
    try {
      cachedToken = { value: tokenRequest, expiresAt: Date.now() + TOKEN_TTL_MS };
    } catch (e) {
      console.warn('Failed to set in-memory token cache', e);
    }

    // add a header so browser-network tools can see server-side elapsed time
    res.setHeader('x-token-ms', String(elapsed));
    // include server timestamp to aid debugging
    const payload = { serverTimestamp: Date.now(), elapsedMs: elapsed, tokenRequest };
    const tokenReqRecord = tokenRequest as Record<string, unknown> | undefined;
    console.debug('[/api/realtime/token] created token', { elapsed, tokenRequestSummary: { keyName: tokenReqRecord?.['keyName'] } });
    res.status(200).json(payload);
  } catch (err) {
    console.error('token error', err);
    const message = (err as Error)?.message || 'Failed to create Ably token';
    // For known configuration/unavailability errors return 503 so callers can retry later
    if (message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('missing or invalid') || message.toLowerCase().includes('timed out')) {
      return res.status(503).json({ error: message });
    }
    res.status(500).json({ error: message });
  }
}
