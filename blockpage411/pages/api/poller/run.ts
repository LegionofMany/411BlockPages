import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Fundraiser from '../../../models/Fundraiser';
import { fetchEtherscanTxs } from '../../../services/etherscan';
import { fetchBlockstreamTxs } from '../../../services/blockstream';
import { fetchSolanaTxs } from '../../../services/solscan';
import { fetchTronTxs } from '../../../services/tronscan';
import { detectEvmDonation } from '../../../services/evm';
import { detectSolanaTokenTransfer } from '../../../services/solana';
import { detectTronTokenTransfer } from '../../../services/tronTokens';
import { createPledgeAtomic } from '../../../lib/pledgeService';
import { sendPollerAlert, shortErrorSummary } from '../../../lib/slack';

// Serverless poller endpoint intended to be called by Vercel Cron or an external scheduler.
// Protect with POLLER_SECRET env var (set in Vercel dashboard) or rely on Vercel's x-vercel-cron header.

type DetectorResult = { found: boolean; amount?: number | string; token?: string; tokenSymbol?: string };

type FundraiserDoc = { id?: string; walletAddress?: string; chain?: string; currency?: string; title?: string };

const CHAIN_FETCHERS: Record<string, (addr: string) => Promise<unknown[]>> = {
  ethereum: (a: string) => fetchEtherscanTxs(a),
  polygon: (a: string) => fetchEtherscanTxs(a),
  bsc: (a: string) => fetchEtherscanTxs(a),
  bitcoin: (a: string) => fetchBlockstreamTxs(a),
  solana: (a: string) => fetchSolanaTxs(a),
  tron: (a: string) => fetchTronTxs(a),
};

async function runPoller() {
  await dbConnect();
  const fundraisers = await Fundraiser.find({ active: true }).lean();
  for (const f of fundraisers) {
    const fr = f as FundraiserDoc;
  const id = String(fr.id ?? '');
  const addr = String(fr.walletAddress ?? '').trim();
    const chain = String(fr.chain ?? 'ethereum').toLowerCase();
    if (!addr) {
      // Alert admins that a fundraiser is missing a wallet address
      try {
        await sendPollerAlert({ level: 'warning', text: `Fundraiser ${id} has no wallet address configured`, fundraiserId: id, fundraiserTitle: fr.title ?? undefined });
      } catch {};
      continue;
    }
    const fetcher = CHAIN_FETCHERS[chain];
    const txs = fetcher ? await fetcher(addr) : [];
    for (const t of Array.isArray(txs) ? txs : []) {
      try {
        // tx entries from various explorers have different shapes; treat t as unknown and safely extract strings
        const txAny = t as Record<string, unknown>;
        const txHash = String(txAny.hash ?? txAny.txid ?? txAny.id ?? txAny.transaction_id ?? txAny.transactionHash ?? '').toLowerCase();
        if (!txHash) continue;
        // cheap existence check
        const existing = await (await import('../../../models/Pledge')).default.findOne({ fundraiserId: id, externalId: txHash }).lean();
        if (existing) continue;
        let det: DetectorResult = { found: false };
        if (chain === 'ethereum' || chain === 'polygon' || chain === 'bsc') det = (await detectEvmDonation({ txHash, targetAddress: addr, chain })) as DetectorResult;
        else if (chain === 'solana') det = (await detectSolanaTokenTransfer(addr, txHash)) as DetectorResult;
        else if (chain === 'tron') det = (await detectTronTokenTransfer(addr, txHash)) as DetectorResult;
        else if (chain === 'bitcoin') det = { found: true, amount: 0, token: fr.currency ?? 'BTC' };
        if (det && det.found) {
          const amount = Number(det.amount ?? 0);
          const currency = String(det.tokenSymbol ?? det.token ?? fr.currency ?? 'UNKNOWN').toUpperCase();
          await createPledgeAtomic({ fundraiserId: id, externalId: txHash, amount, currency, donor: null, raw: { auto: true, detector: 'poller' } });
          try {
            await sendPollerAlert({ level: 'info', text: `Auto-created pledge for fundraiser ${id}`, fundraiserId: id, fundraiserTitle: fr.title ?? undefined, txHash, chain, amount, currency });
          } catch {}
        }
      } catch (err) {
        // continue to next tx — individual failures shouldn't stop other fundraisers
        console.error('[poller] tx processing error', err);
        try {
          const tRec = t as Record<string, unknown>;
          const txHashShort = String(tRec.hash ?? tRec.txid ?? tRec.id ?? '').toLowerCase();
          await sendPollerAlert({
            level: 'warning',
            text: `Poller encountered an error processing a tx for fundraiser ${id}`,
            fundraiserId: id,
            fundraiserTitle: fr.title ?? undefined,
            txHash: txHashShort || undefined,
            chain,
            amount: undefined,
            currency: undefined,
          });
        } catch {
          // swallow alert errors — don't let alerting break the poller
        }
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // allow GET for Vercel Cron and POST for manual triggers
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  // simple protection: either Vercel cron header or a secret token
  const secret = process.env.POLLER_SECRET;
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['x-vercel-cron'] === 'true';
  if (!isVercelCron) {
    if (!secret || req.headers['x-poller-secret'] !== secret) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  try {
    await runPoller();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[poller] fatal', err);
    try {
      await sendPollerAlert({ level: 'error', text: `Poller fatal error: ${shortErrorSummary(err)}` });
    } catch {
      // ignore
    }
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
