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
  // Privacy: hide balances until heavily flagged, using per-wallet or global threshold.
  const flagsCount = Array.isArray(wallet?.flags) ? wallet!.flags.length : 0;
  const threshold = (wallet as any)?.flagThreshold ?? getBalanceFlagThreshold();
  const showBalance = (wallet as any)?.flagsCount != null
    ? (wallet as any).flagsCount >= threshold
    : flagsCount >= threshold;

  // If balances should be hidden, hide the txs and nft count
  const returnedTxs = showBalance ? txs : [];
  const returnedNftCount = showBalance ? (wallet?.nftCount || 0) : 0;

  // Pagination: compute slice for requested page
  const totalTxs = Array.isArray(returnedTxs) ? returnedTxs.length : 0;
  const start = (page - 1) * pageSize;
  const pagedTxs = Array.isArray(returnedTxs) ? returnedTxs.slice(start, start + pageSize) : [];
  const hasMore = start + pagedTxs.length < totalTxs;

  const payload = {
    address: wallet?.address || address,
    chain: wallet?.chain || chain,
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
    transactions: pagedTxs,
    nftCount: returnedNftCount,
    lastRefreshed: wallet?.lastRefreshed || null,
    statusTags: getStatusTags(wallet),
    // pagination meta
    pagination: { total: totalTxs, page, pageSize, hasMore },
  };

  // write page-specific cache (short TTL)
  try { await setCache(cacheKey, payload, 60); } catch {}

  // short CDN cache + SWR
  try { res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300'); } catch (err) {}

  return res.status(200).json(payload);
}
