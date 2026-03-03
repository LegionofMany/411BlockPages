import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import Wallet from '../../lib/walletModel';
import User from '../../lib/userModel';
import { EVM_CHAIN_PRIORITY, normalizeEvmChainId, type EvmChainId } from '../../lib/evmChains';
import { parseSearchInput } from '../../lib/search/input';
import { fetchEvmTxByHash } from '../../lib/evmTxLookup';
import { getEvmTxCount } from '../../lib/evmAddressProbe';
import { resolveWalletInput } from '../../services/resolveWalletInput';

// Types for Wallet document
type WalletDoc = {
  address: string;
  chain: string;
  ens?: string;
  avgRating?: number;
  nftCount?: number;
  blacklisted?: boolean;
  blacklistReason?: string;
  flags?: { reason: string; user: string; date: string }[];
  flagsCount?: number;
  kycStatus?: string;
  socials?: { displayName?: string; avatarUrl?: string };
  trustScore?: number;
  riskScore?: number;
};

function looksLikeMetadataUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return false;
  if (u.endsWith('.json')) return true;
  if (u.includes('/metadata/') && u.includes('.json')) return true;
  if (u.includes('metadata') && u.includes('.json')) return true;
  return false;
}

function looksLikeImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const u = url.trim();
  if (!u) return false;
  const lc = u.toLowerCase();
  if (looksLikeMetadataUrl(lc)) return false;
  if (lc.startsWith('data:image/')) return true;
  if (lc.startsWith('/uploads/avatars/') || lc.startsWith('/api/avatar/') || lc.startsWith('/avatars/')) return true;
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(lc)) return true;
  if (lc.startsWith('http://') || lc.startsWith('https://')) return true;
  return false;
}
// Helper to get status tags for a wallet
function getStatusTags(wallet: WalletDoc) {
  const tags: string[] = [];
  if (wallet?.blacklisted) tags.push('Blacklisted');
  if (wallet?.flagsCount && wallet.flagsCount > 0) tags.push(`Flagged (${wallet.flagsCount})`);
  if (wallet?.kycStatus === 'verified') tags.push('Verified');
  return tags;
}

async function resolveDomainToAddress(name: string): Promise<{ address: string; domain: string; chainHint?: string } | null> {
  const domain = String(name || '').trim();
  if (!domain) return null;
  try {
    const resolved = await resolveWalletInput(domain);
    if (!resolved?.address || resolved.resolvedFrom === 'address') return null;
    return { address: resolved.address, domain, chainHint: resolved.chainHint };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Search results should never be cached (avatars/names may change frequently).
  try { res.setHeader('Cache-Control', 'no-store'); } catch {}

  let { q, chain } = req.query;
  // Ensure q and chain are always strings
  q = Array.isArray(q) ? q[0] : q;
  chain = Array.isArray(chain) ? chain[0] : chain;
  await dbConnect();
  let input = (q || '').toString().trim();
  let resolvedDomain: string | undefined;

  const chainParam = typeof chain === 'string' ? chain.trim() : '';
  const normalizedChainHint = normalizeEvmChainId(chainParam);

  // If it's a tx hash, probe across EVM chains in priority order.
  // This ensures we don't claim "not found" when it exists on a different chain.
  const parsedInitial = parseSearchInput(input);
  if (parsedInitial.kind === 'txHash' && parsedInitial.txHash) {
    for (const evmChain of EVM_CHAIN_PRIORITY) {
      const tx = await fetchEvmTxByHash(evmChain, parsedInitial.txHash);
      if (tx) {
        res.status(200).json({ kind: 'tx', tx, results: [] });
        return;
      }
    }
    res.status(200).json({ kind: 'tx', tx: null, results: [] });
    return;
  }

  // Try resolving Unstoppable-style domains to an address first
  if (input) {
    const resolved = await resolveDomainToAddress(input);
    if (resolved) {
      input = resolved.address;
      resolvedDomain = resolved.domain;

      // If chain is not explicitly provided, carry through the resolver hint.
      if (!chainParam && resolved.chainHint) {
        chain = resolved.chainHint;
      }
    }
  }

  // Search strategy:
  // - For full wallet addresses, use an exact match (fast, uses indexes).
  // - For partial text, keep a regex fallback.
  const query: Record<string, unknown> = {};
  const parsedQuery = parseSearchInput(input);
  if (parsedQuery.kind === 'address' && parsedQuery.address) {
    query.address = String(parsedQuery.address).toLowerCase();
  } else if (input) {
    query.address = { $regex: input, $options: 'i' };
  }
  if (chain) query.chain = String(chain);
  // Do not filter out blacklisted here — return a safe public summary including blacklist flag.
  console.log('SEARCH API: query', query);
  const results = await Wallet.find(query).limit(20);
  console.log('SEARCH API: found', results.length, 'results');

  // Best-effort: hydrate socials (displayName/avatarUrl) from User profiles.
  // This ensures search results can show the uploaded avatar even when Wallet.socials
  // hasn't been created/mirrored yet.
  let userByAddr = new Map<string, { displayName?: string; avatarUrl?: string; nftAvatarUrl?: string }>();
  try {
    const addrs = Array.from(
      new Set(
        (results || [])
          .map((w: any) => String(w?.address || '').toLowerCase())
          .filter(Boolean)
      )
    );
    if (addrs.length) {
      const users = (await User.find({ address: { $in: addrs } })
        .select('address displayName avatarUrl nftAvatarUrl')
        .lean()) as any[];
      for (const u of users || []) {
        const a = String(u?.address || '').toLowerCase();
        if (!a) continue;
        userByAddr.set(a, {
          displayName: typeof u?.displayName === 'string' ? u.displayName : undefined,
          avatarUrl: typeof u?.avatarUrl === 'string' ? u.avatarUrl : undefined,
          nftAvatarUrl: typeof u?.nftAvatarUrl === 'string' ? u.nftAvatarUrl : undefined,
        });
      }
    }
  } catch {
    userByAddr = new Map();
  }

  let profiles = results.map((w: WalletDoc) => ({
    address: w.address,
    chain: w.chain,
    ens: w.ens || resolvedDomain,
    avgRating: w.avgRating,
    nftCount: w.nftCount,
    // public safety signals (non-PII)
    blacklisted: !!w.blacklisted,
    blacklistReason: w.blacklistReason ? String(w.blacklistReason).slice(0, 160) : undefined,
    flagsCount: w.flagsCount || (w.flags ? w.flags.length : 0),
    flagsSummary: (w.flags || []).slice(0, 3).map((f) => (f && f.reason ? String(f.reason).slice(0, 80) : 'flag')),
    kycStatus: w.kycStatus,
    socials: (() => {
      const addrLc = String(w.address || '').toLowerCase();
      const u = addrLc ? userByAddr.get(addrLc) : undefined;
      const ws = w.socials || undefined;

      const displayName = ws?.displayName || u?.displayName || undefined;
      const candidateAvatarUrl = ws?.avatarUrl || u?.avatarUrl || u?.nftAvatarUrl || undefined;
      const avatarUrl = looksLikeImageUrl(candidateAvatarUrl) ? candidateAvatarUrl : undefined;

      if (!displayName && !avatarUrl) return undefined;
      const clean: { displayName?: string; avatarUrl?: string } = {};
      if (displayName) clean.displayName = displayName;
      if (avatarUrl) clean.avatarUrl = avatarUrl;
      return clean;
    })(),
    trustScore: w.trustScore,
    riskScore: w.riskScore,
    statusTags: getStatusTags(w),
  }));

  // If no results, return a default profile for the searched address.
  // If chain is not provided and the input is an EVM address, try to infer the best chain
  // (first chain with a non-zero tx count; otherwise the first responsive chain).
  if (profiles.length === 0 && input) {
    const parsed = parseSearchInput(input);
    const isEvmAddress = parsed.kind === 'address' && !!parsed.address;

    let selectedChain: string | undefined = chainParam || undefined;

    if (!selectedChain && isEvmAddress) {
      selectedChain = normalizedChainHint || undefined;
    }

    if (isEvmAddress) {
      const preferred = normalizedChainHint;
      const order: EvmChainId[] = preferred
        ? [preferred, ...EVM_CHAIN_PRIORITY.filter((c) => c !== preferred)]
        : EVM_CHAIN_PRIORITY;

      let best: { chain: EvmChainId; txCount: number } | null = null;
      for (const evmChain of order) {
        const txCount = await getEvmTxCount(evmChain, parsed.address!, 2000);
        if (txCount === null) continue;
        if (txCount > 0) {
          best = { chain: evmChain, txCount };
          break;
        }
        if (!best) best = { chain: evmChain, txCount };
      }

      if (best) selectedChain = best.chain;
    }

    if (selectedChain) {
      // Best-effort: include User profile socials for exact-address searches even when
      // no Wallet document exists yet.
      let socials: { displayName?: string; avatarUrl?: string } | undefined;
      try {
        const addrLc = String(input || '').toLowerCase();
        const u = (await User.findOne({ address: addrLc }).select('displayName avatarUrl nftAvatarUrl').lean()) as any;
        const displayName = typeof u?.displayName === 'string' ? u.displayName : undefined;
        const candidateAvatarUrl = typeof u?.avatarUrl === 'string' ? u.avatarUrl : (typeof u?.nftAvatarUrl === 'string' ? u.nftAvatarUrl : undefined);
        const avatarUrl = looksLikeImageUrl(candidateAvatarUrl) ? candidateAvatarUrl : undefined;
        if (displayName || avatarUrl) {
          socials = {};
          if (displayName) socials.displayName = displayName;
          if (avatarUrl) socials.avatarUrl = avatarUrl;
        }
      } catch {
        socials = undefined;
      }

      profiles = [
        {
          address: input,
          chain: selectedChain,
          ens: resolvedDomain,
          avgRating: undefined,
          nftCount: undefined,
          blacklisted: false,
          blacklistReason: undefined,
          flagsCount: 0,
          flagsSummary: [],
          kycStatus: 'unverified',
          socials,
          trustScore: 0,
          riskScore: 0,
          statusTags: [],
        },
      ];
    }
  }

  res.status(200).json({ kind: 'wallet', results: profiles });
}
