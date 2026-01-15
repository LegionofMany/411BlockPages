import { getCache, setCache } from 'lib/redisCache';
import { createPublicClient, http, isAddress } from 'viem';
import { base, mainnet } from 'viem/chains';

const ethereumRpcUrl =
  process.env.ETHEREUM_RPC_URL ||
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ||
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  'https://cloudflare-eth.com';

const baseRpcUrl =
  process.env.BASE_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  'https://mainnet.base.org';

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(ethereumRpcUrl),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(baseRpcUrl),
});

export type ResolvedNames = {
  ensName: string | null;
  baseName: string | null;
  primaryName: string | null;
};

export async function resolveNames(address: string): Promise<ResolvedNames> {
  if (!address || !isAddress(address)) {
    return { ensName: null, baseName: null, primaryName: null };
  }

  const cacheKey = `names:v1:${address.toLowerCase()}`;
  const cached = (await getCache(cacheKey)) as ResolvedNames | null;
  if (cached && typeof cached === 'object') return cached;

  let ensName: string | null = null;
  let baseName: string | null = null;

  try {
    ensName = await ethClient.getEnsName({ address });
  } catch {
    ensName = null;
  }

  // Basenames are ENS-compatible names on Base for many wallets.
  // If resolution fails, we just return null.
  try {
    baseName = await baseClient.getEnsName({ address });
  } catch {
    baseName = null;
  }

  const primaryName = ensName || baseName || null;
  const payload: ResolvedNames = { ensName, baseName, primaryName };

  // Cache fairly aggressively; names change rarely.
  try {
    await setCache(cacheKey, payload, 24 * 60 * 60);
  } catch {
    // ignore
  }

  return payload;
}
