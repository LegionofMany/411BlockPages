/**
 * Ingestion script for public wallet risk sources.
 *
 * This script is safe to run periodically (cron) and stores raw snapshots in
 * `WalletRiskSourceRaw` while normalizing flags into `WalletRisk`.
 *
 * NOTE: This implementation uses placeholder fetches and normalization logic
 * as public source APIs differ. Use this as a safe, auditable template.
 */

import fetch from 'node-fetch';
import dbConnect from '../lib/db';
import WalletRisk from '../lib/walletriskmodel';
import Raw from '../lib/walletrisksourceraw';

async function fetchJson(url: string) {
  const r = await fetch(url, { timeout: 15000 });
  return r.json();
}

async function ingestBitcoinAbuse() {
  // public dataset: https://www.bitcoinabuse.com/api/doc
  try {
    const url = 'https://www.bitcoinabuse.com/api/reports';
    const data = await fetchJson(url).catch(() => null);
    if (!data) return;
    await Raw.create({ source: 'bitcoinabuse', raw: data });

    // Normalize: this is example logic: map each report to a flag
    for (const item of (data.reports || [])) {
      const address = (item.address || '').toLowerCase();
      if (!address) continue;
      await WalletRisk.findOneAndUpdate({ chain: 'bitcoin', address }, {
        $addToSet: { flags: { source: 'bitcoinabuse', category: item.category || 'scam', confidence: 'medium', evidence_url: item.url || undefined, first_seen: item.date ? new Date(item.date) : new Date() } },
        $set: { last_updated: new Date() }
      }, { upsert: true });
    }
  } catch (err) {
    console.error('ingestBitcoinAbuse error', err);
  }
}

async function ingestChainabuse() {
  try {
    const url = 'https://chainabuse.io/api/reports';
    const data = await fetchJson(url).catch(() => null);
    if (!data) return;
    await Raw.create({ source: 'chainabuse', raw: data });
    for (const r of (data.items || [])) {
      const address = (r.address || '').toLowerCase();
      const chain = (r.chain || 'ethereum').toLowerCase();
      if (!address) continue;
      await WalletRisk.findOneAndUpdate({ chain, address }, {
        $addToSet: { flags: { source: 'chainabuse', category: r.type || 'scam', confidence: r.confidence || 'medium', evidence_url: r.link || undefined, first_seen: r.firstSeen ? new Date(r.firstSeen) : new Date() } },
        $set: { last_updated: new Date() }
      }, { upsert: true });
    }
  } catch (err) {
    console.error('ingestChainabuse error', err);
  }
}

async function ingestEtherscanLabels() {
  try {
    // Etherscan provides publicly visible labels on explorer pages but no single
    // canonical API for all. Many projects scrape or use a curated dataset.
    // This placeholder demonstrates how to snapshot raw data and map labels.
    const url = 'https://api.etherscan.io/api?module=account&action=txlist&address=0x0000000000000000000000000000000000000000';
    const data = await fetchJson(url).catch(() => null);
    if (!data) return;
    await Raw.create({ source: 'etherscan', raw: data });
    // No normalization implemented here: teams should map specific label endpoints
  } catch (err) {
    console.error('ingestEtherscanLabels error', err);
  }
}

async function ingestOFAC() {
  try {
    const url = 'https://www.treasury.gov/ofac/downloads/sdn.csv';
    const data = await fetch(url).then(r => r.text()).catch(() => null);
    if (!data) return;
    await Raw.create({ source: 'ofac', raw: data });
    // CSV parsing and Ethereum address extraction left intentionally minimal
    // Teams should expand parsing based on observed OFAC structure.
  } catch (err) {
    console.error('ingestOFAC error', err);
  }
}

async function ingestGitHubCurated() {
  try {
    // Example: fetch a curated JSON maintained in a public GitHub repo
    const url = 'https://raw.githubusercontent.com/example/crypto-scams/main/scams.json';
    const data = await fetchJson(url).catch(() => null);
    if (!data) return;
    await Raw.create({ source: 'github_curated', raw: data });
    for (const it of (data.items || [])) {
      const address = (it.address || '').toLowerCase();
      if (!address) continue;
      await WalletRisk.findOneAndUpdate({ chain: it.chain || 'ethereum', address }, {
        $addToSet: { flags: { source: 'github', category: it.category || 'scam', confidence: it.confidence || 'low', evidence_url: it.url || undefined, first_seen: it.first_seen ? new Date(it.first_seen) : new Date() } },
        $set: { last_updated: new Date() }
      }, { upsert: true });
    }
  } catch (err) {
    console.error('ingestGitHubCurated error', err);
  }
}

async function main() {
  await dbConnect();
  await Promise.all([
    ingestBitcoinAbuse(),
    ingestChainabuse(),
    ingestEtherscanLabels(),
    ingestOFAC(),
    ingestGitHubCurated()
  ]);
  process.exit(0);
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}
