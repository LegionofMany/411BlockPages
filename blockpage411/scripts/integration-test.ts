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

  // 1) /api/realtime/token should return 503 when ABLY_API_KEY is not configured
  const ablyConfigured = !!process.env.ABLY_API_KEY;
  try {
    const r = await fetchWithTimeout('/api/realtime/token');
    console.log('/api/realtime/token ->', r.status);
    if (!ablyConfigured) {
      if (r.status !== 503) {
        console.error('Expected 503 when ABLY_API_KEY unset, got', r.status);
        process.exit(2);
      } else {
        console.log('Token endpoint returned 503 as expected (Ably not configured)');
      }
    } else {
      // if ABLY_API_KEY is provided, we expect a 200 (best-effort). If Ably key is invalid or network blocks it, we may still get 503; in that case just warn
      if (r.status === 200) console.log('Token endpoint returned 200 (Ably configured)');
      else console.warn('Token endpoint returned', r.status, 'even though ABLY_API_KEY is set — this may be due to network/invalid key');
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
