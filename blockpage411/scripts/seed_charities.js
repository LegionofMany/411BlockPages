#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment');
    process.exitCode = 2;
    return;
  }

  const dataPath = path.join(__dirname, '..', 'data', 'charities.json');
  if (!fs.existsSync(dataPath)) {
    console.error('data/charities.json not found. Please add sample data or provide GIVING_BLOCK_API_KEY to fetch remotely.');
    process.exitCode = 2; return;
  }

  let items = [];
  try { items = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]'); }
  catch (e) { console.error('Failed to parse data/charities.json', e); process.exitCode = 2; return; }

  if (!Array.isArray(items) || items.length === 0) {
    console.log('No items found in data/charities.json — nothing to seed.');
    process.exit(0);
  }

  const CharitySchema = new mongoose.Schema({
    givingBlockId: String,
    name: { type: String, required: true, index: true },
    description: String,
    website: String,
    logo: String,
    wallet: String,
    tags: [String],
    givingBlockEmbedUrl: String,
  }, { timestamps: true });

  const Charity = mongoose.models.Charity || mongoose.model('Charity', CharitySchema);

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  let inserted = 0, updated = 0;
  for (const c of items) {
    try {
      const q = { name: c.name };
      const doc = {
        givingBlockId: c.id || c.givingBlockId,
        name: c.name,
        description: c.mission || c.description || '',
        website: c.website || c.url || '',
        logo: c.logoUrl || c.logo || '',
        wallet: c.cryptoWalletAddress || c.wallet || '',
        tags: c.tags || [],
        givingBlockEmbedUrl: c.donationWidget || c.embed || c.givingBlockEmbedUrl || '',
      };
  const res = await Charity.updateOne(q, { $set: doc }, { upsert: true });
  // Mongoose updateOne result shape varies by version; check common fields for upsert
  const upserted = (res && (res.upsertedCount || (Array.isArray(res.upserted) && res.upserted.length))) ? true : false;
  if (upserted) inserted++; else updated++;
    } catch (e) { console.warn('failed seeding charity', c.name, e && e.message ? e.message : e); }
  }

  console.log('Seed complete. inserted=', inserted, 'updated=', updated);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exitCode = 1; });
