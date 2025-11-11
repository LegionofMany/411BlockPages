#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import dbConnect from '../lib/db';
import Charity from '../models/Charity';
import { fetchGivingBlockCharities } from '../utils/givingblock';

async function seedFromApi() {
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
    const doc: Record<string, unknown> = {
      givingBlockId: String(c.id ?? c.organization_id ?? ''),
      name,
      description: String(c.mission ?? c.description ?? ''),
      website: String(c.website ?? c.url ?? ''),
      logo: String(c.logoUrl ?? c.logo ?? c.logo_url ?? ''),
      givingBlockEmbedUrl: String(c.donationWidget ?? c.donation_widget ?? c.embed ?? ''),
      wallet: String(c.cryptoWalletAddress ?? c.wallet ?? '')
    };
    await Charity.updateOne({ name: String(doc.name ?? '') }, { $set: doc }, { upsert: true });
    count++;
  }
  return count;
}

async function seedFromLocal() {
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
    const doc: Record<string, unknown> = {
      givingBlockId: String(c.id ?? c.givingBlockId ?? ''),
      name,
      description: String(c.mission ?? c.description ?? ''),
      website: String(c.website ?? c.url ?? ''),
      logo: String(c.logoUrl ?? c.logo ?? ''),
      givingBlockEmbedUrl: String(c.donationWidget ?? c.embed ?? c.donationWidget ?? ''),
      wallet: String(c.cryptoWalletAddress ?? c.wallet ?? '')
    };
    await Charity.updateOne({ name: String(doc.name ?? '') }, { $set: doc }, { upsert: true });
    count++;
  }
  return count;
}

async function main() {
  try {
    await dbConnect();
    let seeded = 0;
    // prefer API if available
    try {
      seeded = await seedFromApi();
    } catch (err) {
      console.warn('API seed failed, falling back to local file:', (err as Error).message);
      seeded = await seedFromLocal();
    }
    console.log(`Seed complete — ${seeded} charities processed.`);
    process.exit(0);
  } catch (e: any) {
    console.error('Seeding failed:', e?.message || String(e));
    process.exit(1);
  }
}

if (require.main === module) main();
