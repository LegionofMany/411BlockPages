import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import dbConnect from '../../../lib/db';
import Fundraiser from '../../../models/Fundraiser';
import Pledge from '../../../models/Pledge';
import { createPledgeAtomic } from '../../../lib/pledgeService';
import redisRateLimit from '../../../lib/redisRateLimit';
import { fetchEtherscanTxs } from '../../../services/etherscan';
import { fetchBlockstreamTxs } from '../../../services/blockstream';
import { fetchSolanaTxs } from '../../../services/solscan';
import { fetchTronTxs } from '../../../services/tronscan';
import { detectEvmDonation } from '../../../services/evm';

// Assumptions:
// - Donor will submit { fundraiserId, chain, txHash, donor?, amount? }
// - We verify the tx exists and is addressed to the fundraiser.walletAddress
// - For EVM chains (ethereum, polygon, bsc) we attempt to read tx by hash via the public scan proxy API
// - For other chains we fetch recent txs for the fundraiser address and look up the tx hash
// - We record the pledge with externalId = txHash and currency inferred from chain
// - We only increment Fundraiser.raised automatically if fundraiser.currency matches the native token symbol

const CHAIN_TOKEN: Record<string, string> = {
  ethereum: 'ETH',
  polygon: 'MATIC',
  bsc: 'BNB',
  bitcoin: 'BTC',
  solana: 'SOL',
  tron: 'TRX',
};

async function ethGetTxByHash(apiBase: string, apiKey: string | undefined, txHash: string) {
  // Etherscan-family proxy call
  try {
    const url = `${apiBase}?module=proxy&action=eth_getTransactionByHash&txhash=${encodeURIComponent(txHash)}${apiKey ? `&apikey=${apiKey}` : ''}`;
    const { data } = await axios.get(url);
    return data?.result ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  // rate-limit
  const allowed = await redisRateLimit(req, res, { windowSec: 60, max: 30, keyPrefix: 'verify:' });
  if (!allowed) return; // redisRateLimit already sent 429
  await dbConnect();

  const body = req.body as { fundraiserId?: string; chain?: string; txHash?: string; donor?: string; amount?: number };
  const fundraiserId = String(body.fundraiserId || '');
  const chain = String(body.chain || '').toLowerCase();
  const txHash = String(body.txHash || '').trim();
  const donor = body.donor ? String(body.donor) : undefined;
  const providedAmount = body.amount;

  if (!fundraiserId || !chain || !txHash) return res.status(400).json({ message: 'Missing fundraiserId, chain or txHash' });

  // increment metrics (best-effort)
  try {
    axios.post(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metrics`, { metric: 'verify' }).catch(() => {});
  } catch {}

  const fundraiserRaw = await Fundraiser.findOne({ id: fundraiserId });
  let fundraiser: Record<string, unknown> | null = null;
  if (fundraiserRaw) {
    const leanFn = (fundraiserRaw as { lean?: unknown }).lean;
    if (typeof leanFn === 'function') {
      fundraiser = await (leanFn as () => Promise<Record<string, unknown>>)();
    } else {
      fundraiser = fundraiserRaw as Record<string, unknown>;
    }
  }
  // Do not use test-only fallbacks here — tests should provide proper model mocks via Jest.
  if (!fundraiser) return res.status(404).json({ message: 'Fundraiser not found' });
  if (!fundraiser) return res.status(404).json({ message: 'Fundraiser not found' });
  const fundraiserRec = fundraiser as Record<string, unknown>;
  const fActive = fundraiserRec['active'];
  const fStatus = fundraiserRec['status'];
  if (fActive === false || (typeof fStatus === 'string' && fStatus !== 'approved')) return res.status(400).json({ message: 'Fundraiser not accepting donations' });
  const walletAddress = String(fundraiserRec['walletAddress'] ?? '');

  // Check for existing pledge idempotently
  const existingRaw = await Pledge.findOne({ fundraiserId, externalId: txHash });
  let existing: Record<string, unknown> | null = null;
  if (existingRaw) {
    const existingLean = (existingRaw as { lean?: unknown }).lean;
    if (typeof existingLean === 'function') {
      existing = await (existingLean as () => Promise<Record<string, unknown> | null>)();
    } else {
      existing = existingRaw as Record<string, unknown> | null;
    }
  }
  if (existing) return res.status(200).json({ ok: true, note: 'Already recorded', pledge: existing });

  let found = false;
  let amount = providedAmount ?? 0;
  let token = CHAIN_TOKEN[chain] ?? 'UNKNOWN';

  try {
    if (chain === 'ethereum' || chain === 'polygon' || chain === 'bsc') {
      // Prefer provider-based detection (native + ERC-20) via ethers.js
      try {
        const det = await detectEvmDonation({ txHash, targetAddress: walletAddress, chain });
        const d = det as { found: boolean; amount?: number; tokenSymbol?: string };
        if (d.found) {
          found = true;
          amount = Number(d.amount ?? providedAmount ?? 0);
          // if tokenSymbol is present, override token
          if (typeof d.tokenSymbol === 'string') token = d.tokenSymbol;
        } else {
          // fallback to Etherscan proxy lookup
          const apiKey = chain === 'ethereum' ? process.env.ETHERSCAN_API_KEY : chain === 'polygon' ? process.env.POLYGONSCAN_API_KEY : process.env.BSCSCAN_API_KEY;
          const apiBase = chain === 'ethereum' ? 'https://api.etherscan.io/api' : chain === 'polygon' ? 'https://api.polygonscan.com/api' : 'https://api.bscscan.com/api';
          const tx = await ethGetTxByHash(apiBase, apiKey, txHash);
          if (tx) {
            const to = String((tx as Record<string, unknown>).to ?? '').toLowerCase();
            if (to === walletAddress.toLowerCase()) {
              found = true;
              // value is hex wei
              try {
                const v = tx.value ? BigInt(tx.value.toString()) : BigInt(0);
                // convert wei -> ether
                amount = Number(v) / 1e18;
              } catch {
                // fallback to provided amount
                amount = providedAmount ?? 0;
              }
            }
          }
        }
      } catch {
        // provider error; try lightweight explorer fallback
        try {
          const apiKey = chain === 'ethereum' ? process.env.ETHERSCAN_API_KEY : chain === 'polygon' ? process.env.POLYGONSCAN_API_KEY : process.env.BSCSCAN_API_KEY;
          const apiBase = chain === 'ethereum' ? 'https://api.etherscan.io/api' : chain === 'polygon' ? 'https://api.polygonscan.com/api' : 'https://api.bscscan.com/api';
          const tx = await ethGetTxByHash(apiBase, apiKey, txHash);
          if (tx) {
            const to = String((tx as Record<string, unknown>).to ?? '').toLowerCase();
            if (to === walletAddress.toLowerCase()) {
              found = true;
              try {
                const v = tx.value ? BigInt(tx.value.toString()) : BigInt(0);
                amount = Number(v) / 1e18;
              } catch {
                amount = providedAmount ?? 0;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    } else if (chain === 'bitcoin') {
      // search recent txs for the address and match txHash
      const txs = await fetchBlockstreamTxs(walletAddress);
      if (Array.isArray(txs) && txs.find((t: Record<string, unknown>) => String((t.txid || t.id || t['txid'] || t['id'] || '')).toLowerCase() === txHash.toLowerCase())) {
        found = true;
        // amount parsing for BTC is non-trivial here; prefer providedAmount
        amount = providedAmount ?? 0;
      }
    } else if (chain === 'solana') {
      const txs = await fetchSolanaTxs(walletAddress);
      if (Array.isArray(txs) && txs.find((t: Record<string, unknown>) => String((t.hash || t.txHash || t['hash'] || '')).toLowerCase() === txHash.toLowerCase())) {
        found = true;
        amount = providedAmount ?? 0;
      }
    } else if (chain === 'tron') {
      const txs = await fetchTronTxs(walletAddress);
      if (Array.isArray(txs) && txs.find((t: Record<string, unknown>) => String((t.hash || t.transaction_id || t['transaction_id'] || '')).toLowerCase() === txHash.toLowerCase())) {
        found = true;
        amount = providedAmount ?? 0;
      }
    } else {
      // unknown chain: attempt generic address tx listing via etherscan if address looks like 0x
      const txs = await fetchEtherscanTxs(walletAddress);
      if (Array.isArray(txs) && txs.find((t: Record<string, unknown>) => String((t.hash || t.txHash || t.transactionHash || t['hash'] || '')).toLowerCase() === txHash.toLowerCase())) {
        found = true;
        amount = providedAmount ?? 0;
      }
    }
    } catch (err) {
      console.error('Error verifying onchain tx', err);
    }

  if (!found) return res.status(404).json({ message: 'Transaction not found for fundraiser address' });

  // Create pledge
  try {
    const pledge = await createPledgeAtomic({ fundraiserId, externalId: txHash, amount: Number(amount), currency: token, donor: donor ?? null, raw: { chain, txHash } });
    return res.status(200).json({ ok: true, pledge });
  } catch (err: unknown) {
    console.error('Failed to create pledge', err);
    return res.status(500).json({ message: 'Failed to record pledge' });
  }
}
