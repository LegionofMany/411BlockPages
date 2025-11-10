export async function fetchGivingBlockCharities(apiKey?: string) {
  const url = 'https://api.thegivingblock.com/v1/organizations';
  const headers: Record<string,string> = { 'Accept': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GivingBlock fetch failed: ${res.status}`);
  return res.json();
}
