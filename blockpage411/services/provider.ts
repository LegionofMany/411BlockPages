import { ethers } from 'ethers';
import { getCache, setCache } from '../lib/redisCache';

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_RETRIES = 3;
const CIRCUIT_OPEN_MS = 60_000; // open for 60s after failures

// simple in-memory circuit state per url
const circuitState: Record<string, { failures: number; openedAt?: number }> = {};

function providerForUrl(url?: string) {
  try {
    if (!url) return ethers.getDefaultProvider();
    return new ethers.JsonRpcProvider(url);
  } catch {
    return ethers.getDefaultProvider();
  }
}

export async function withProvider<T>(chain: string | undefined, cb: (prov: ethers.Provider) => Promise<T>, opts?: { timeoutMs?: number; retries?: number }) {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT;
  const retries = opts?.retries ?? DEFAULT_RETRIES;
  const url = chain === 'polygon' ? process.env.POLYGON_RPC_URL : chain === 'bsc' ? process.env.BSC_RPC_URL : process.env.ETH_RPC_URL;
  const provider = providerForUrl(url);

  let lastErr: Error | null = null;
  const key = url ?? 'default';
  const state = circuitState[key] ?? { failures: 0 };
  if (state.openedAt && Date.now() - state.openedAt < CIRCUIT_OPEN_MS) {
    throw new Error('provider circuit open');
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([cb(provider), new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))]);
    } catch (err) {
      lastErr = err as Error;
      // record failure
      state.failures = (state.failures || 0) + 1;
      circuitState[key] = state;
      // if failures exceed retries, open circuit
      if (state.failures > retries) {
        state.openedAt = Date.now();
      }
      // exponential backoff
      const backoffMs = Math.min(5000, 200 * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, backoffMs));
      // increment provider error metric (best-effort)
      try {
        fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/metrics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metric: 'provider_errors', increment: 1 }),
        } as any);
      } catch {
        // ignore
      }
    }
  }
  throw lastErr ?? new Error('provider failure');
}

export async function getTokenMetadata(provider: ethers.Provider, tokenAddress: string) {
  const cacheKey = `tokenmeta:${tokenAddress.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  const abi = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)'];
  try {
    const c = new ethers.Contract(tokenAddress, abi as unknown as string[], provider) as unknown as { symbol: () => Promise<string>; decimals: () => Promise<number> };
    const s = await c.symbol();
    const d = await c.decimals();
    const meta = { symbol: String(s), decimals: Number(d) };
    await setCache(cacheKey, meta, 24 * 3600);
    return meta;
  } catch {
    return null;
  }
}
