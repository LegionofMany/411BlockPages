// Use the global fetch available in Node 18+ / Next.js runtimes.
// If you need to support older Node versions, install 'node-fetch' and add types.
import { getCache, setCache } from '../lib/redisCache';

// Cache key and TTL (seconds) for Giving Block orgs
const GB_CACHE_KEY = 'givingblock:organizations';
const GB_CACHE_TTL = Number(process.env.GIVINGBLOCK_CACHE_TTL || '21600'); // 6 hours by default

// The Giving Block public organizations endpoint (no auth) — if an API key is required,
// set it in process.env.GIVINGBLOCK_API_KEY and add an Authorization header.
const GIVINGBLOCK_URL = 'https://api.thegivingblock.com/v1/organizations';

export async function fetchGivingBlockCharities(): Promise<unknown[]> {
  // try cache first
  try {
    const cached = await getCache(GB_CACHE_KEY) as unknown[] | null;
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
  } catch {
    // ignore cache errors and continue
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.GIVINGBLOCK_API_KEY) headers.Authorization = `Bearer ${process.env.GIVINGBLOCK_API_KEY}`;

  const res = await fetch(GIVINGBLOCK_URL, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Giving Block fetch failed: ${res.status} ${res.statusText} ${text}`);
  }
  const js = await res.json() as unknown;
  // The API returns an array or an object with a `data` array — normalize to an array
  let out: unknown[] = [];
  if (Array.isArray(js)) out = js as unknown[];
  else if (js && typeof js === 'object') {
    const obj = js as Record<string, unknown>;
    if (Array.isArray(obj.data)) out = obj.data as unknown[];
  }

  // write to cache, best-effort
  try {
    await setCache(GB_CACHE_KEY, out, GB_CACHE_TTL);
  } catch {
    // ignore
  }

  return out;
}

// Helper: validate whether an embed URL is trusted (only allow The Giving Block domains)
// (embed host validator moved to utils/embed.ts to keep the givingblock helper server-only)

