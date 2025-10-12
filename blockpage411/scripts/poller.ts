#!/usr/bin/env node
/**
 * scripts/poller.ts
 * Simple cron-style poller that scans active fundraisers for recent transactions
 * and attempts to auto-record pledges when tx hashes are found.
 *
 * This is an MVP: it iterates active fundraisers, queries chain-specific recent tx lists
 * via the services in /services, and calls the same verification logic used by the API.
 */
import 'dotenv/config';
import dbConnect from '../lib/db';
import Fundraiser from '../models/Fundraiser';
import Pledge from '../models/Pledge';
import { fetchEtherscanTxs } from '../services/etherscan';
import { fetchBlockstreamTxs } from '../services/blockstream';
import { fetchSolanaTxs } from '../services/solscan';
import { fetchTronTxs } from '../services/tronscan';
import { detectEvmDonation } from '../services/evm';

interface FundraiserLean { id: string; walletAddress?: string; chain?: string; currency?: string }

async function processFundraiser(f: FundraiserLean) {
  const id = f.id;
  const wallet = String(f.walletAddress || '');
  const chain = String(f.chain || 'ethereum').toLowerCase();
  // fetch recent txs per chain
  let txs: Array<Record<string, unknown>> = [];
  try {
    if (chain === 'bitcoin') txs = await fetchBlockstreamTxs(wallet);
    else if (chain === 'solana') txs = await fetchSolanaTxs(wallet);
    else if (chain === 'tron') txs = await fetchTronTxs(wallet);
    else txs = await fetchEtherscanTxs(wallet);
  } catch (err) {
    console.error('Error fetching txs for', id, err);
    return;
  }

  interface TxLike { hash?: string; txid?: string; signature?: string; txHash?: string }
  for (const t of txs || []) {
    const txObj = t as Record<string, unknown> & TxLike;
    const txHash = String(txObj['hash'] || txObj['txid'] || txObj['signature'] || txObj['txHash'] || '');
    if (!txHash) continue;
    const existing = await Pledge.findOne({ fundraiserId: id, externalId: txHash }).lean();
    if (existing) continue;

    // For EVM chains, try provider-backed detection to get amount and token
    if (chain === 'ethereum' || chain === 'polygon' || chain === 'bsc') {
      const det = await detectEvmDonation({ txHash, targetAddress: wallet, chain });
      if (det.found) {
        type Det = typeof det;
        try {
          const amount = Number((det as Det).amount ?? 0);
          const currency = (det as Det).tokenSymbol ? String((det as Det).tokenSymbol) : 'UNKNOWN';
          await Pledge.create({ fundraiserId: id, externalId: txHash, amount, currency, donor: null, status: 'completed', raw: { auto: true } });
          console.log('Auto recorded pledge', id, txHash, det);
          // Optionally increment fundraiser raised if currency matches
          if (String(f.currency || '').toUpperCase() === String((det as Det).tokenSymbol ?? '').toUpperCase()) {
            await Fundraiser.updateOne({ id }, { $inc: { raised: amount } });
          }
        } catch (err) {
          console.error('Failed to create pledge', err);
        }
      }
    } else {
      // For non-EVM chains, simply record pledge with provided amount 0 (admin can reconcile)
      try {
        await Pledge.create({ fundraiserId: id, externalId: txHash, amount: 0, currency: f.currency || 'UNKNOWN', donor: null, status: 'completed', raw: { auto: true } });
        console.log('Auto recorded pledge (non-EVM)', id, txHash);
      } catch (err) {
        console.error('Failed to create pledge (non-EVM)', err);
      }
    }
  }
}

async function run() {
  await dbConnect();
  // increment poller metric (best-effort)
  try {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metrics`;
    await fetch(url, { method: 'POST', body: JSON.stringify({ metric: 'poller' }), headers: { 'Content-Type': 'application/json' } });
  } catch {}
  // pull active fundraisers
  const fundraisers = await Fundraiser.find({ active: true }).lean();
  for (const f of fundraisers) {
    try {
      await processFundraiser(f as unknown as FundraiserLean);
    } catch (err) {
      console.error('Error processing fundraiser', (f as unknown as FundraiserLean).id, err);
    }
  }
  process.exit(0);
}

run().catch((e) => {
  console.error('Poller failed', e);
  process.exit(1);
});
