import 'dotenv/config';

// Use global fetch when available (Node 18+), otherwise try to import node-fetch dynamically
let fetchImpl: any = undefined;
try {
  if (globalThis.fetch) fetchImpl = globalThis.fetch;
} catch {}
if (!fetchImpl) {
  // dynamic require of node-fetch if present; if not, the script will fail with a clear message
  try {
     
    fetchImpl = require('node-fetch');
  } catch (e) {
    console.error('No global fetch available and node-fetch is not installed. Please run this script on Node 18+ or install node-fetch.', e);
    process.exit(1);
  }
}

const BASE = process.env.INTEGRATION_BASE || 'http://localhost:3000';
const TIMEOUT_MS = 5000;

function timeout(ms: number) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
}

async function fetchWithTimeout(path: string) {
  const controller = new AbortController();
  const sig = controller.signal;
  const p = fetchImpl(`${BASE}${path}`, { signal: sig });
  const r = await Promise.race([p, timeout(TIMEOUT_MS)]) as Response;
  return r;
}

async function run() {
  console.log('Integration test target base:', BASE);

  // 1) /api/realtime/token: Ably integration was removed and this endpoint may return 410 Gone.
  //    The script accepts either 410 (integration removed) or 503 (not configured). If an ABLY_API_KEY
  //    is present in the environment we still allow for a 200 (legacy behavior), but prefer 410/503.
  try {
    const r = await fetchWithTimeout('/api/realtime/token');
    console.log('/api/realtime/token ->', r.status);
    if (r.status === 410) {
      console.log('Token endpoint returned 410 (Ably integration removed)');
    } else if (r.status === 503) {
      console.log('Token endpoint returned 503 (Ably not configured)');
    } else if (r.status === 200) {
      console.log('Token endpoint returned 200 (legacy Ably token behavior)');
    } else {
      console.warn('Unexpected status from /api/realtime/token:', r.status);
    }
  } catch (err) {
    console.error('Error calling /api/realtime/token:', err);
    process.exit(3);
  }

  // 2) /api/wallet/popular should return 200 and JSON shape
  try {
    const r = await fetchWithTimeout('/api/wallet/popular');
    console.log('/api/wallet/popular ->', r.status);
    if (r.status !== 200) {
      console.error('Expected 200 from /api/wallet/popular, got', r.status);
      process.exit(4);
    }
    const body = await r.json();
    if (!body || typeof body !== 'object' || !('wallets' in body)) {
      console.error('Unexpected payload from /api/wallet/popular', body);
      process.exit(5);
    }
    console.log('Popular wallets OK; wallets length:', Array.isArray(body.wallets) ? body.wallets.length : 'unknown');
  } catch (err) {
    console.error('Error calling /api/wallet/popular:', err);
    process.exit(6);
  }

  // 3) /api/me should return 401 when no cookie is present
  try {
    const r = await fetchWithTimeout('/api/me');
    console.log('/api/me ->', r.status);
    if (r.status !== 401) {
      console.error('Expected 401 from /api/me when unauthenticated, got', r.status);
      process.exit(7);
    }
    console.log('/api/me unauthenticated check passed');
  } catch (err) {
    console.error('Error calling /api/me:', err);
    process.exit(8);
  }

  console.log('Integration tests completed successfully');
  process.exit(0);
}

run().catch((err) => {
  console.error('Integration test error', err);
  process.exit(1);
});
