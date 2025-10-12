#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * Plain Node.js migration script to move embedded user.fundraisers into top-level
 * fundraisers collection. Does not depend on project TypeScript modules.
 *
 * Usage:
 *   node scripts/migrate_fundraisers.js --dry
 *   node scripts/migrate_fundraisers.js --apply
 */
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in env. Aborting.');
  process.exit(1);
}

async function run() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const apply = args.includes('--apply');
  if (!dry && !apply) {
    console.log('Provide --dry or --apply');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { dbName: undefined, bufferCommands: false });
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({ 'fundraisers.0': { $exists: true } }).toArray();
  console.log(`Found ${users.length} users with embedded fundraisers`);
  let toCreate = 0;

  for (const u of users) {
    const farr = u.fundraisers || [];
    for (const f of farr) {
      const exists = await db.collection('fundraisers').findOne({ id: f.id });
      if (exists) continue;
      toCreate++;
      console.log(`Would create fundraiser ${f.id} title='${f.title || ''}' owner=${u.address || u._id}`);
      if (apply) {
        const doc = {
          id: f.id,
          title: f.title,
          description: f.description || '',
          target: Number(f.target) || 0,
          raised: Number(f.raised) || 0,
          walletAddress: f.walletAddress || null,
          owner: u.address || null,
          createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
          expiresAt: f.expiresAt ? new Date(f.expiresAt) : null,
          active: f.active !== undefined ? f.active : true,
          privacy: f.privacy || 'public',
          circle: Array.isArray(f.circle) ? f.circle : [],
        };
        await db.collection('fundraisers').insertOne(doc);
      }
    }
  }

  console.log(`To create: ${toCreate}`);
  if (apply) console.log('Applied migration');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(2); });
