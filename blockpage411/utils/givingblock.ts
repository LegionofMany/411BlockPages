// Use the global fetch available in Node 18+ / Next.js runtimes.
// If you need to support older Node versions, install 'node-fetch' and add types.
export async function fetchGivingBlockCharities(): Promise<unknown[]> {
  // The Giving Block public organizations endpoint (no auth) — if an API key is required,
  // set it in process.env.GIVINGBLOCK_API_KEY and add an Authorization header.
  const url = 'https://api.thegivingblock.com/v1/organizations';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.GIVINGBLOCK_API_KEY) headers.Authorization = `Bearer ${process.env.GIVINGBLOCK_API_KEY}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Giving Block fetch failed: ${res.status} ${res.statusText} ${text}`);
  }
  const js = await res.json() as unknown;
  // The API returns an array or an object with a `data` array — normalize to an array
  if (Array.isArray(js)) return js as unknown[];
  if (js && typeof js === 'object') {
    const obj = js as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as unknown[];
  }
  return [];
}

