#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import Charity from '../models/Charity';
import { fetchGivingBlockCharities } from '../utils/givingblock';
import { sanitizeDescription } from '../services/givingBlockService';

// dbConnect is dynamically loaded below to avoid ts-node/ESM resolution issues when
// running the script directly (some environments require require() while others need import()).
// dbConnect can be either the loader function exported by lib/db or the module itself in some envs
let dbConnect: any = null;

async function seedFromApi(dryRun = false) {
  console.log('Fetching charities from The Giving Block...');
  const list = await fetchGivingBlockCharities();
  if (!list || list.length === 0) {
    console.log('No charities returned from API');
    return 0;
  }

  let count = 0;
  for (const raw of list) {
    const c = raw as Record<string, unknown>;
    const name = String(c.name ?? c.organization_name ?? c.title ?? '');
    if (!name) continue;
    const rawDesc = String(c.mission ?? c.description ?? '');
    const doc: Record<string, unknown> = {
      givingBlockId: String(c.id ?? c.organization_id ?? ''),
      name,
      description: sanitizeDescription(rawDesc),
      website: String(c.website ?? c.url ?? ''),
      logo: String(c.logoUrl ?? c.logo ?? c.logo_url ?? ''),
      givingBlockEmbedUrl: String(c.donationWidget ?? c.donation_widget ?? c.embed ?? ''),
      wallet: String(c.cryptoWalletAddress ?? c.wallet ?? '')
    };
    if (!dryRun) {
      await Charity.updateOne({ name: String(doc.name ?? '') }, { $set: doc }, { upsert: true });
    }
    count++;
  }
  return count;
}

async function seedFromLocal(dryRun = false) {
  const dataPath = path.join(process.cwd(), 'data', 'charities.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No data/charities.json found');
    return 0;
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  const items = JSON.parse(raw);
  let count = 0;
  for (const raw of items) {
    const c = raw as Record<string, unknown>;
    const name = String(c.name ?? c.title ?? '');
    if (!name) continue;
    const rawDesc = String(c.mission ?? c.description ?? '');
    const doc: Record<string, unknown> = {
      givingBlockId: String(c.id ?? c.givingBlockId ?? ''),
      name,
      description: sanitizeDescription(rawDesc),
      website: String(c.website ?? c.url ?? ''),
      logo: String(c.logoUrl ?? c.logo ?? ''),
      givingBlockEmbedUrl: String(c.donationWidget ?? c.embed ?? c.donationWidget ?? ''),
      wallet: String(c.cryptoWalletAddress ?? c.wallet ?? '')
    };
    if (!dryRun) {
      await Charity.updateOne({ name: String(doc.name ?? '') }, { $set: doc }, { upsert: true });
    }
    count++;
  }
  return count;
}

async function main() {
  try {
    // ensure dbConnect is loaded (try require first for common ts-node usage, fallback to dynamic import)
    if (!dbConnect) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('../lib/db');
        dbConnect = mod && mod.default ? mod.default : mod;
      } catch (e) {
        // fallback to dynamic import
        // note: dynamic import returns a promise
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ;(async () => {
          const mod = await import('../lib/db');
          dbConnect = mod && mod.default ? mod.default : mod;
        })();
      }
    }

    // If dynamic import path was used above, wait for dbConnect to be available
    if (!dbConnect) {
      // last-resort dynamic import (await)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import('../lib/db');
      dbConnect = mod && mod.default ? mod.default : mod;
    }
    // parse args for --dry-run
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('--dry');
    if (!dryRun) await dbConnect();
    let seeded = 0;
    // prefer API if available
    try {
      seeded = await seedFromApi(dryRun);
    } catch (err) {
      console.warn('API seed failed, falling back to local file:', (err as Error).message);
      seeded = await seedFromLocal(dryRun);
    }
    console.log(`Seed complete — ${seeded} charities processed.`);
    process.exit(0);
  } catch (e: any) {
    console.error('Seeding failed:', e?.message || String(e));
    process.exit(1);
  }
}

if (require.main === module) main();
