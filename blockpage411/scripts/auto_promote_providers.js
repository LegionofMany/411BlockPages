#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const Provider = require('../lib/providerModel').default || require('../lib/providerModel');
const Report = require('../lib/reportModel').default || require('../lib/reportModel');

/**
 * Auto-promote pending providers to 'seeded' when they meet thresholds.
 * Usage: node scripts/auto_promote_providers.js [minReports] [minUnique] [--dry]
 */
async function promote(minReports = parseInt(process.env.PROMOTE_MIN_REPORTS || '50', 10), minUnique = parseInt(process.env.PROMOTE_MIN_UNIQUE || '5', 10), dryRun = false){
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(2); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log('Connected to DB, aggregating provider reports...');

  const agg = await Report.aggregate([
    { $match: { providerId: { $exists: true, $ne: null } } },
    { $group: { _id: '$providerId', totalReports: { $sum: 1 }, uniqueReporters: { $addToSet: '$reporterUserId' } } },
    { $project: { totalReports: 1, uniqueReporters: { $size: '$uniqueReporters' } } },
    { $sort: { totalReports: -1 } }
  ]).allowDiskUse(true);

  let promoted = 0;
  for (const a of agg){
    const total = a.totalReports || 0;
    const unique = (a.uniqueReporters || 0);
    if (total >= minReports && unique >= minUnique){
      // ensure provider exists and is pending
      const prov = await Provider.findById(a._id).lean();
      if (!prov) continue;
      if (prov.status === 'seeded') continue; // already seeded
      if (prov.status !== 'pending') continue; // only auto-promote pending

      console.log(`Promoting provider ${prov.name || prov._id} (reports=${total} unique=${unique})`);
      if (!dryRun){
        await Provider.findByIdAndUpdate(a._id, { $set: { status: 'seeded', promotedAt: new Date(), promotedBy: 'auto' } });
      }
      promoted++;
    }
  }

  console.log('Auto-promote complete. providers promoted=', promoted, dryRun ? '(dry-run)' : '');
  await mongoose.disconnect();
}

if (require.main === module){
  const minReports = process.argv[2] ? parseInt(process.argv[2],10) : undefined;
  const minUnique = process.argv[3] ? parseInt(process.argv[3],10) : undefined;
  const dryRun = process.argv.includes('--dry') || process.argv.includes('-d');
  promote(minReports, minUnique, dryRun).catch(err=>{ console.error(err); process.exit(1); });
}

module.exports = { promote };
