
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { getBalanceFlagThreshold } from 'lib/config';
import ProviderWallet from 'lib/providerWalletModel';
import Provider from 'lib/providerModel';
import { computeRiskScore, WalletLike } from 'lib/risk';
import { Transaction } from 'lib/types';
import { getCache, setCache } from 'lib/redisCache';
import redisRateLimit from 'lib/redisRateLimit';
import { computeWalletVisibility } from 'services/walletVisibilityService';
import jwt from 'jsonwebtoken';
import { FetchRequest, JsonRpcProvider, formatEther } from 'ethers';
import TxRating from 'lib/txRatingModel';
import { EVM_CHAIN_PRIORITY, normalizeEvmChainId, type EvmChainId } from 'lib/evmChains';
import { getEvmTxCount } from 'lib/evmAddressProbe';
import AddressReputation from 'lib/addressReputationModel';
import { computeReputation } from 'services/reputation/computeReputation';

// Types for Wallet document
type WalletDoc = {
  address: string;
  chain: string;
  ens?: string;
  avgRating?: number;
  nftCount?: number;
  blacklisted?: boolean;
  flags?: { reason: string; user: string; date: string }[];
  kycStatus?: string;
};
// Helper to get status tags for a wallet
function getStatusTags(wallet: WalletDoc) {
  const tags = [];
  if (wallet?.blacklisted) tags.push('Blacklisted');
  if (wallet?.flags && wallet.flags.length > 0) tags.push(`Flagged (${wallet.flags.length})`);
  if (wallet?.kycStatus === 'verified') tags.push('Verified');
  return tags;
}

// ...existing code...
import { fetchSolanaTxs } from '../../../../services/solscan';
import { fetchTronTxs } from '../../../../services/tronscan';
// (removed duplicate import)
// Fetch XRP transactions using public API (xrpscan) and map to Transaction type
async function fetchXrpTxs(address: string) {
  try {
    const { data } = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
    // xrpscan returns {transactions: [...]}
    const txs = Array.isArray(data.transactions) ? data.transactions : Array.isArray(data) ? data : [];
    return txs.map((item: Record<string, unknown>) => ({
      hash: typeof item.hash === 'string' ? item.hash : typeof item.tx_hash === 'string' ? item.tx_hash : '',
      from: typeof item.tx === 'object' && item.tx !== null && 'Account' in item.tx ? (item.tx as Record<string, unknown>).Account as string : '',
      to: typeof item.tx === 'object' && item.tx !== null && 'Destination' in item.tx ? (item.tx as Record<string, unknown>).Destination as string : '',
      value: typeof item.tx === 'object' && item.tx !== null && typeof (item.tx as Record<string, unknown>).Amount === 'string' ? (item.tx as Record<string, unknown>).Amount as string : (typeof item.tx === 'object' && item.tx !== null && typeof (item.tx as Record<string, unknown>).Amount === 'object' ? ((item.tx as Record<string, unknown>).Amount as Record<string, unknown>).value as string : ''),
      date: typeof item.date === 'string' ? item.date : typeof item.tx === 'object' && item.tx !== null && 'date' in item.tx ? (item.tx as Record<string, unknown>).date as string : '',
      type: typeof item.tx === 'object' && item.tx !== null && 'TransactionType' in item.tx ? (item.tx as Record<string, unknown>).TransactionType as string : '',
    }));
  } catch {
    return [];
  }
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;

function getRpcUrlForChain(chain: string): string | null {
  const c = String(chain || '').toLowerCase();
  if (c === 'ethereum' || c === 'eth') return process.env.ETH_RPC_URL || process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://cloudflare-eth.com';
  if (c === 'base') return process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
  if (c === 'polygon') return process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com';
  if (c === 'bsc') return process.env.BSC_RPC_URL || process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
  return null;
}

function getEthersNetworkForChain(chain: string): { name: string; chainId: number } | null {
  const c = String(chain || '').toLowerCase();
  if (c === 'ethereum' || c === 'eth') return { name: 'homestead', chainId: 1 };
  if (c === 'base') return { name: 'base', chainId: 8453 };
  if (c === 'polygon') return { name: 'matic', chainId: 137 };
  if (c === 'bsc') return { name: 'bsc', chainId: 56 };
  return null;
}

function getNativeTokenIdForChain(chain: string): { coingeckoId: string; symbol: string } | null {
  const c = String(chain || '').toLowerCase();
  if (c === 'ethereum' || c === 'eth') return { coingeckoId: 'ethereum', symbol: 'ETH' };
  if (c === 'base') return { coingeckoId: 'ethereum', symbol: 'ETH' };
  if (c === 'polygon') return { coingeckoId: 'matic-network', symbol: 'MATIC' };
  if (c === 'bsc') return { coingeckoId: 'binancecoin', symbol: 'BNB' };
  return null;
}

async function fetchUsdPrice(coingeckoId: string): Promise<number | null> {
  const id = String(coingeckoId || '').trim();
  if (!id) return null;
  const cacheKey = `price:cg:v1:${id}`;
  try {
    const cached = await getCache(cacheKey);
    const n = typeof cached === 'number' ? cached : typeof cached === 'string' ? Number(cached) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    // ignore
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
    const { data } = await axios.get(url, { timeout: 6500 });
    const usd = data && data[id] && typeof data[id].usd === 'number' ? data[id].usd : null;
    if (typeof usd === 'number' && Number.isFinite(usd) && usd > 0) {
      try {
        await setCache(cacheKey, usd, 60);
      } catch {
        // ignore
      }
      return usd;
    }
  } catch {
    // ignore
  }

  return null;
}

async function fetchEvmNativeBalance(chain: string, address: string): Promise<{ amountNative: number; symbol: string; priceUsd: number | null; amountUsd: number | null } | null> {
  const rpcUrl = getRpcUrlForChain(chain);
  const token = getNativeTokenIdForChain(chain);
  if (!rpcUrl || !token) return null;

  try {
    const net = getEthersNetworkForChain(chain);
    const req = new FetchRequest(rpcUrl);
    req.timeout = 8000;
    const provider = net ? new JsonRpcProvider(req, net, { staticNetwork: net } as any) : new JsonRpcProvider(req);

    const balWei = await Promise.race([
      provider.getBalance(address),
      new Promise((_, rej) => setTimeout(() => rej(new Error('balance timeout')), 8500)),
    ]);
    const amountNative = Number(formatEther(balWei));
    const priceUsd = await fetchUsdPrice(token.coingeckoId);
    const amountUsd = typeof priceUsd === 'number' ? amountNative * priceUsd : null;
    return { amountNative, symbol: token.symbol, priceUsd, amountUsd };
  } catch {
    return null;
  }
}

type ConnectedWalletSummary = {
  address: string;
  txCount: number;
  direction: 'in' | 'out' | 'mixed';
  totalValueNative: number;
  risk?: { category: 'green' | 'yellow' | 'red'; score?: number | null };
};

function riskToCategory(score: number | null | undefined): 'green' | 'yellow' | 'red' {
  const n = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  if (n > 60) return 'red';
  if (n > 25) return 'yellow';
  return 'green';
}

function analyzeConnectedWallets(chain: string, target: string, txs: any[]): { connected: ConnectedWalletSummary[]; graph: { nodes: any[]; edges: any[] } | null; heuristics: Array<{ id: string; level: 'low' | 'medium' | 'high'; title: string; summary: string }> } {
  const addr = String(target || '').toLowerCase();
  const counts = new Map<string, { in: number; out: number; totalNative: number }>();

  const nativeDecimals = 18;
  const parseNative = (tx: any): number => {
    try {
      const v = tx?.value ?? tx?.valueWei ?? '0';
      const asBig = BigInt(typeof v === 'string' && v.startsWith('0x') ? v : BigInt(String(v)).toString());
      const divisor = 10n ** BigInt(nativeDecimals);
      return Number(asBig) / Number(divisor);
    } catch {
      const n = Number(tx?.value || 0);
      return Number.isFinite(n) ? n : 0;
    }
  };

  for (const t of Array.isArray(txs) ? txs.slice(0, 250) : []) {
    const from = String(t?.from || '').toLowerCase();
    const to = String(t?.to || '').toLowerCase();
    if (!from || !to) continue;
    if (from !== addr && to !== addr) continue;

    const counterparty = from === addr ? to : from;
    if (!counterparty) continue;

    const prev = counts.get(counterparty) || { in: 0, out: 0, totalNative: 0 };
    const native = parseNative(t);
    if (to === addr) prev.in += 1;
    if (from === addr) prev.out += 1;
    prev.totalNative += native;
    counts.set(counterparty, prev);
  }

  const connected = Array.from(counts.entries())
    .map(([address, s]) => {
      const direction: ConnectedWalletSummary['direction'] = s.in > 0 && s.out > 0 ? 'mixed' : s.in > 0 ? 'in' : 'out';
      return { address, txCount: s.in + s.out, direction, totalValueNative: s.totalNative } as ConnectedWalletSummary;
    })
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, 12);

  const nodes = [{ id: addr, kind: 'target' }, ...connected.map((c) => ({ id: c.address, kind: 'counterparty' }))];
  const edges = connected.map((c) => ({ source: addr, target: c.address, weight: Math.max(1, c.txCount) }));
  const graph = connected.length ? { nodes, edges } : null;

  // Simple heuristics (non-accusatory)
  const uniqueIn = connected.filter((c) => c.direction === 'in' || c.direction === 'mixed').length;
  const uniqueOut = connected.filter((c) => c.direction === 'out' || c.direction === 'mixed').length;
  const heuristics: Array<{ id: string; level: 'low' | 'medium' | 'high'; title: string; summary: string }> = [];

  // Fan-in funnel: many inbound counterparties and few outbound (or vice versa)
  if (uniqueIn >= 10 && uniqueOut <= 2) {
    heuristics.push({
      id: 'funnel-in',
      level: uniqueIn >= 25 ? 'high' : 'medium',
      title: 'Funnel-like inbound pattern',
      summary: 'Receives from many wallets and sends out to very few. This can be normal (exchange/treasury), but it can also indicate aggregation behavior.',
    });
  }

  if (uniqueOut >= 10 && uniqueIn <= 2) {
    heuristics.push({
      id: 'funnel-out',
      level: uniqueOut >= 25 ? 'high' : 'medium',
      title: 'Hub-like outbound pattern',
      summary: 'Sends to many wallets with limited inbound sources. This can be normal (airdrop/treasury), but it may warrant review depending on context.',
    });
  }

  // Rapid hops is handled elsewhere when timestamps are available; provide neutral placeholder.
  if (connected.length >= 8) {
    heuristics.push({
      id: 'network-density',
      level: connected.length >= 20 ? 'high' : 'low',
      title: 'High counterparty diversity',
      summary: 'Interacts with many unique counterparties. Context matters; this is an informational signal only.',
    });
  }

  return { connected, graph, heuristics };
}


// Map supported chain slugs to Etherscan V2 chain IDs
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  avalanche: 43114,
  fantom: 250,
  gnosis: 100,
  celo: 42220,
  moonbeam: 1284,
  moonriver: 1285,
  cronos: 25,
  aurora: 1313161554,
  harmony: 1666600000,
  kava: 2222,
  metis: 1088,
  okc: 66,
  polygonzkevm: 1101,
  scroll: 534352,
  zkSync: 324,
  linea: 59144,
  mantle: 5000,
  boba: 288,
  fuse: 122,
  syscoin: 57,
  tomochain: 88,
  xdc: 50,
  canto: 7700,
  conflux: 1030,
  dogechain: 2000,
  evmos: 9001,
  klaytn: 8217,
  moonbase: 1287,
  palm: 11297108109,
  shiden: 336,
  songbird: 19,
  telos: 40,
  xlayer: 196,
  zetachain: 7000,
  // Add more as needed from https://docs.etherscan.io/supported-chains
};

async function fetchEvmTxs(chain: string, address: string) {
  const chainId = CHAIN_IDS[chain];
  if (!chainId) return [];
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    // V2 returns { status, message, result }
    if (data.status === '1') return data.result;
  } catch {}
  return [];
}

// Map Bitcoin txs to Transaction type
async function fetchBitcoinTxs(address: string) {
  try {
    const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
    if (!Array.isArray(data)) return [];
    return data.map((tx: Record<string, unknown>) => {
      // Collect all input addresses
      const vinArr = Array.isArray(tx.vin) ? tx.vin : [];
      const fromAddresses = vinArr.map((vin) => typeof vin === 'object' && vin !== null && 'prevout' in vin && vin.prevout && typeof vin.prevout === 'object' && 'scriptpubkey_address' in vin.prevout ? (vin.prevout as Record<string, unknown>).scriptpubkey_address as string : '').filter(Boolean);
      // Collect all output addresses and values
      const voutArr = Array.isArray(tx.vout) ? tx.vout : [];
      const outputs = voutArr.map((vout) => typeof vout === 'object' && vout !== null && 'scriptpubkey_address' in vout && 'value' in vout ? { to: vout.scriptpubkey_address as string, value: vout.value as number } : { to: '', value: 0 });
      return {
        txid: typeof tx.txid === 'string' ? tx.txid : '',
        hash: typeof tx.txid === 'string' ? tx.txid : '',
        from: fromAddresses.join(', '),
        to: outputs.map(o => o.to).join(', '),
        value: outputs.map(o => o.value).join(', '),
        vout: voutArr,
        block: tx.status && typeof tx.status === 'object' && tx.status !== null && 'block_height' in tx.status ? (tx.status as Record<string, unknown>).block_height as number : null,
        date: tx.status && typeof tx.status === 'object' && tx.status !== null && 'block_time' in tx.status ? new Date(((tx.status as Record<string, unknown>).block_time as number) * 1000).toISOString() : '',
        type: 'transfer',
      };
    });
  } catch {
    return [];
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chain, address } = req.query;
  if (!chain || typeof chain !== 'string' || !address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Chain and address required' });
  }

  // Rate limit per-IP using Redis sliding window
  try {
    const ok = await redisRateLimit(req, res, { windowSec: 60, max: 30 });
    if (!ok) return; // redisRateLimit already sent response
  } catch (err) {
    // continue permissive if rate limiter fails
  }

  // Basic validation / normalization: whitelist known chains
  const allowedChains = new Set<string>([...Object.keys(CHAIN_IDS), 'bitcoin', 'solana', 'tron', 'xrp']);
  if (!allowedChains.has(String(chain))) {
    return res.status(400).json({ message: 'Unsupported chain' });
  }

  // Normalize addresses for EVM-like chains to lowercase to match DB keys
  const chainStr = String(chain);
  let addr = String(address);
  if (CHAIN_IDS[chainStr]) {
    addr = addr.toLowerCase();
  }
  await dbConnect();
  // Pagination params (page & pageSize) for transactions
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const pageSizeRaw = parseInt(String(req.query.pageSize || '50'), 10) || 50;
  const pageSize = Math.min(Math.max(10, pageSizeRaw), 200); // enforce 10..200

  // Try Redis cache first for this page-specific profile payload
  const cacheKey = `wallet:${chainStr}:${addr}:profile:p${page}:s${pageSize}`;
  try {
    const cached = await getCache(cacheKey) as any | null;
    if (cached) {
      try { res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300'); } catch {}
      return res.status(200).json(cached);
    }
  } catch {}

  let wallet = await Wallet.findOne({ address: addr, chain: chainStr });
  if (wallet && wallet.blacklisted) {
    return res.status(403).json({ message: 'This wallet is blacklisted.' });
  }

  // Determine viewer address from JWT cookie (if logged in)
  let viewerAddress: string | null = null;
  try {
    const token = (req.cookies || {}).token;
    const secret = process.env.JWT_SECRET;
    if (token && secret) {
      const decoded = jwt.verify(token, secret) as { address?: string } | string;
      const addrFromToken = typeof decoded === 'object' && decoded && 'address' in decoded ? decoded.address : undefined;
      if (addrFromToken && typeof addrFromToken === 'string') {
        viewerAddress = addrFromToken.toLowerCase();
      }
    }
  } catch {
    // ignore auth errors; treat as anonymous viewer
  }
  const now = new Date();
  let txs: Transaction[] = [];
  let shouldUpdate = false;
  // Check if we have cached txs and if they are fresh (<= 15 min)
  if (wallet && wallet.lastRefreshed && wallet.transactions && Array.isArray(wallet.transactions)) {
    const age = (now.getTime() - new Date(wallet.lastRefreshed).getTime()) / 1000;
    if (age <= 900) {
      txs = wallet.transactions;
    } else {
      shouldUpdate = true;
    }
  } else {
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    try {
      if (chain === 'bitcoin') {
        txs = await fetchBitcoinTxs(address);
      } else if (chain === 'solana') {
        txs = await fetchSolanaTxs(address);
      } else if (chain === 'tron') {
        txs = await fetchTronTxs(address);
      } else if (chain === 'xrp') {
        txs = await fetchXrpTxs(address);
      } else {
        txs = await fetchEvmTxs(chain, address);
      }
      // Upsert wallet with new txs and lastRefreshed
      wallet = await Wallet.findOneAndUpdate(
        { address: addr, chain: chainStr },
        { $set: { transactions: txs, lastRefreshed: now }, $setOnInsert: { address: addr, chain: chainStr } },
        { new: true, upsert: true }
      );
    } catch {
      // If API fails, fallback to cached txs if available
      if (wallet && wallet.transactions && Array.isArray(wallet.transactions)) {
        txs = wallet.transactions;
      } else {
        txs = [];
      }
    }
  }

  // compute risk and persist a short audit history
  try {
    if (wallet) {
      // If an admin has explicitly set riskScore/riskCategory, do not overwrite it.
      const hasOverride = typeof (wallet as any).riskScore === 'number' && (wallet as any).riskCategory;

      if (!hasOverride) {
        // computeRiskScore expects a WalletLike; cast wallet document to WalletLike safely
        const input = wallet as unknown as WalletLike;
        const { score, category } = computeRiskScore(input);
        const nowRisk = new Date();
        // push a short history entry and update latest fields
        await Wallet.updateOne({ _id: wallet._id }, {
          $set: { riskScore: score, riskCategory: category, lastRiskAt: nowRisk },
          $push: { riskHistory: { date: nowRisk, score, category, note: 'auto' } }
        }).exec();
        // refresh the wallet object with new risk fields
        wallet = await Wallet.findOne({ address, chain });
      }
    }
  } catch (err) {
    console.error('[risk] compute/persist error', err);
  }

  // attempt to find a provider wallet mapping and include provider label
  let providerLabel: { providerId?: string; name?: string; note?: string } | null = null;
  try{
    const pw = await ProviderWallet.findOne({ address: String(addr).toLowerCase(), chain: String(chainStr).toLowerCase() }).lean() as { providerId?: unknown; note?: string } | null;
    if (pw) {
  const p = await Provider.findById(String(pw.providerId || '')).lean() as { name?: string } | null;
  providerLabel = { providerId: String(pw.providerId || ''), name: p?.name || undefined, note: pw.note || undefined };
    }
  }catch{ /* ignore */ }
  // Read-only requirement: wallet analysis should be visible to unauth viewers.
  // Keep flags/threshold for informational UI, but do not hide assets/txs.
  const flagsCount = Array.isArray(wallet?.flags) ? wallet!.flags.length : 0;
  const threshold = (wallet as any)?.flagThreshold ?? getBalanceFlagThreshold();
  const showBalance = true;

  // Compute a simple visibility object (owner/public/limited view semantics)
  const visibility = computeWalletVisibility(
    {
      address: wallet?.address || addr,
      flagsCount,
      isPublic: (wallet as any)?.isPublic ?? false,
      unlockLevel: (wallet as any)?.unlockLevel ?? 0,
    },
    viewerAddress,
  );

  const returnedTxs = txs;
  const returnedNftCount = wallet?.nftCount || 0;

  // Pagination: compute slice for requested page
  const totalTxs = Array.isArray(returnedTxs) ? returnedTxs.length : 0;
  const start = (page - 1) * pageSize;
  const pagedTxs = Array.isArray(returnedTxs) ? returnedTxs.slice(start, start + pageSize) : [];
  const hasMore = start + pagedTxs.length < totalTxs;

  // If this chain looks empty for an EVM address, hint which EVM chain has activity.
  // Kept best-effort and only on page 1 to avoid heavy fan-out.
  let suggestedChain: EvmChainId | null = null;
  try {
    const normalized = normalizeEvmChainId(chainStr);
    if (normalized && totalTxs === 0 && page === 1) {
      let best: { chain: EvmChainId; txCount: number } | null = null;
      for (const c of EVM_CHAIN_PRIORITY) {
        if (c === normalized) continue;
        const txCount = await getEvmTxCount(c, String(address || ''), 1500);
        if (txCount == null) continue;
        if (txCount > 0) {
          best = { chain: c, txCount };
          break;
        }
        if (!best) best = { chain: c, txCount };
      }
      if (best?.chain) suggestedChain = best.chain;
    }
  } catch {
    suggestedChain = null;
  }

  // Best-effort: label transaction counterparties using ProviderWallet mappings.
  // Only applies to EVM-like chains where from/to are single addresses.
  let enrichedTxs: Transaction[] = pagedTxs;
  let exchangeInteractions: Array<{ name: string; type: string; count: number }> = [];
  try {
    if (CHAIN_IDS[chainStr] && Array.isArray(pagedTxs) && pagedTxs.length > 0) {
      const addrLc = String(addr || '').toLowerCase();
      const addrs = new Set<string>();
      for (const tx of pagedTxs) {
        const from = typeof tx?.from === 'string' ? tx.from.toLowerCase() : '';
        const to = typeof tx?.to === 'string' ? tx.to.toLowerCase() : '';
        if (from) addrs.add(from);
        if (to) addrs.add(to);
      }

      const addrList = Array.from(addrs);
      const pws = (await ProviderWallet.find({
        chain: String(chainStr).toLowerCase(),
        address: { $in: addrList },
      }).lean()) as Array<{ address: string; providerId?: any; note?: string }>;

      const providerIds = Array.from(new Set(pws.map((x) => String(x.providerId || '')).filter(Boolean)));
      const providers = providerIds.length
        ? ((await Provider.find({ _id: { $in: providerIds } }).select('name type').lean()) as Array<{ _id: any; name?: string; type?: string }>)
        : [];

      const providerById = new Map<string, { name: string; type: string }>();
      for (const p of providers) {
        const id = String((p as any)?._id || '');
        if (!id) continue;
        providerById.set(id, { name: String(p?.name || ''), type: String(p?.type || 'Other') });
      }

      const providerByAddr = new Map<string, { name: string; type: string }>();
      for (const pw of pws) {
        const a = String(pw.address || '').toLowerCase();
        const pid = String(pw.providerId || '');
        const prov = pid ? providerById.get(pid) : null;
        if (a && prov?.name) providerByAddr.set(a, prov);
      }

      // Fallback: if a counterparty wallet was manually tagged with exchangeSource, use that as an Exchange label.
      try {
        const tagged = (await Wallet.find({ chain: chainStr, address: { $in: addrList } })
          .select('address exchangeSource')
          .lean()) as Array<{ address?: string; exchangeSource?: string }>;
        for (const w of tagged) {
          const a = String(w?.address || '').toLowerCase();
          const ex = typeof w?.exchangeSource === 'string' ? w.exchangeSource.trim() : '';
          if (!a || !ex) continue;
          if (!providerByAddr.has(a)) providerByAddr.set(a, { name: ex, type: 'Exchange' });
        }
      } catch {
        // ignore
      }

      const interactions = new Map<string, { name: string; type: string; count: number }>();

      enrichedTxs = pagedTxs.map((tx) => {
        const from = typeof tx?.from === 'string' ? tx.from.toLowerCase() : '';
        const to = typeof tx?.to === 'string' ? tx.to.toLowerCase() : '';
        const fromProv = from ? providerByAddr.get(from) : undefined;
        const toProv = to ? providerByAddr.get(to) : undefined;

        const counterparty = from && from === addrLc ? to : from;
        const cpProv = counterparty ? providerByAddr.get(counterparty) : undefined;

        if (cpProv?.name) {
          const key = `${cpProv.type}:${cpProv.name}`;
          const prev = interactions.get(key);
          interactions.set(key, { name: cpProv.name, type: cpProv.type, count: (prev?.count || 0) + 1 });
        }

        return {
          ...tx,
          fromLabel: fromProv?.name,
          toLabel: toProv?.name,
          counterparty: counterparty || undefined,
          counterpartyLabel: cpProv?.name,
          counterpartyType: cpProv?.type === 'CEX' ? 'Exchange' : (cpProv?.type as any),
        };
      });

      exchangeInteractions = Array.from(interactions.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  } catch {
    enrichedTxs = pagedTxs;
    exchangeInteractions = [];
  }

  // Best-effort: aggregate transaction ratings *for this address*.
  // Ownership rule is enforced at write-time (only senders can rate), but the rating
  // attaches to the receiver address (`to`) so third parties can see a wallet's reputation.
  let txRatingsSummary: { avgScore: number; count: number } | null = null;
  try {
    const evmChain = normalizeEvmChainId(chainStr);
    if (evmChain) {
      const agg = await TxRating.aggregate([
        { $match: { chain: evmChain, to: addr.toLowerCase() } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
          },
        },
      ]);
      const first = Array.isArray(agg) && agg.length ? (agg[0] as any) : null;
      txRatingsSummary = {
        count: typeof first?.count === 'number' ? first.count : 0,
        avgScore: typeof first?.avgScore === 'number' ? first.avgScore : 0,
      };
    }
  } catch {
    txRatingsSummary = null;
  }

  // Reputation rollup (best-effort). Persist a cached copy for faster UI.
  const riskScoreValue = typeof (wallet as any)?.riskScore === 'number' ? (wallet as any).riskScore : null;
  const rep = computeReputation({
    riskScore: riskScoreValue,
    txRatingAvg: txRatingsSummary?.avgScore || 0,
    txRatingCount: txRatingsSummary?.count || 0,
  });
  const reputation = {
    score: rep.score,
    label: rep.label,
    txRatingAvg: txRatingsSummary?.avgScore || 0,
    txRatingCount: txRatingsSummary?.count || 0,
  };
  try {
    await AddressReputation.findOneAndUpdate(
      { chain: String(chainStr).toLowerCase(), address: String(addr).toLowerCase() },
      {
        $set: {
          chain: String(chainStr).toLowerCase(),
          address: String(addr).toLowerCase(),
          txRatingAvg: reputation.txRatingAvg,
          txRatingCount: reputation.txRatingCount,
          topInteractions: exchangeInteractions,
          reputationScore: rep.score == null ? 0 : rep.score,
          reputationLabel: rep.label,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  } catch {
    // ignore persistence failures
  }

  const payload = {
    address: wallet?.address || address,
    chain: wallet?.chain || chain,
    balance: CHAIN_IDS[chainStr] ? await fetchEvmNativeBalance(chainStr, addr) : null,
    riskScore: (wallet as any)?.riskScore ?? null,
    riskCategory: (wallet as any)?.riskCategory ?? null,
    providerLabel,
    flags: wallet?.flags || [],
    flagsCount,
    flagThreshold: threshold,
    showBalance,
    ratings: (wallet?.ratings || []).map((r: any) => ({
      user: r.user,
      score: r.score,
      date: r.date,
      text: r.text,
      approved: r.approved,
      flagged: r.flagged,
      flaggedReason: r.flaggedReason,
    })),
    avgRating: wallet?.avgRating || 0,
    txRatingsSummary,
    transactions: enrichedTxs,
    exchangeInteractions,
    reputation,
    nftCount: returnedNftCount,
    lastRefreshed: wallet?.lastRefreshed || null,
    statusTags: getStatusTags(wallet),
    visibility: {
      // Read-only requirement: wallet analysis is visible to all viewers.
      canSeeBalance: true,
      canSeeSensitiveDetails: (visibility as any).canSeeSensitiveDetails ?? visibility.canSeeBalance,
      canSeePublicAnalysis: (visibility as any).canSeePublicAnalysis ?? true,
      isOwner: visibility.isOwner,
      heavilyFlagged: visibility.heavilyFlagged,
      isPublic: visibility.isPublic,
      unlockLevel: visibility.unlockLevel,
    },
    // pagination meta
    pagination: { total: totalTxs, page, pageSize, hasMore },
    suggestedChain: suggestedChain || undefined,
  };

  // Add connected wallets + basic graph + heuristics (best-effort, do not block response)
  try {
    if (CHAIN_IDS[chainStr] && Array.isArray(txs)) {
      const { connected, graph, heuristics } = analyzeConnectedWallets(chainStr, addr, txs);

      // Attach basic risk color for each connected wallet based on existing DB info (fast path).
      const connAddrs = connected.map((c) => c.address.toLowerCase());
      let known: Array<{ address: string; riskScore?: number | null }> = [];
      try {
        known = (await Wallet.find({ chain: chainStr, address: { $in: connAddrs } }).select('address riskScore').lean()) as any;
      } catch {
        known = [];
      }
      const byAddr = new Map<string, number>();
      for (const k of known) {
        const a = String((k as any)?.address || '').toLowerCase();
        const s = (k as any)?.riskScore;
        if (a && typeof s === 'number') byAddr.set(a, s);
      }

      const enriched = connected.map((c) => {
        const s = byAddr.get(c.address.toLowerCase());
        const score = typeof s === 'number' ? s : null;
        return {
          ...c,
          risk: { category: riskToCategory(score), score },
        };
      });

      (payload as any).connectedWallets = enriched;
      (payload as any).followTheMoneyGraph = graph;
      (payload as any).heuristicIndicators = heuristics;
    } else {
      (payload as any).connectedWallets = [];
      (payload as any).followTheMoneyGraph = null;
      (payload as any).heuristicIndicators = [];
    }
  } catch {
    (payload as any).connectedWallets = [];
    (payload as any).followTheMoneyGraph = null;
    (payload as any).heuristicIndicators = [];
  }

  // write page-specific cache (short TTL)
  try { await setCache(cacheKey, payload, 60); } catch {}

  // short CDN cache + SWR
  try { res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300'); } catch (err) {}

  return res.status(200).json(payload);
}
