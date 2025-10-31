#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const dbConnect = require('../lib/db').default || require('../lib/db');
const Provider = require('../lib/providerModel').default || require('../lib/providerModel');
const Report = require('../lib/reportModel').default || require('../lib/reportModel');

async function markReady(minReports = parseInt(process.env.OUTREACH_MIN_REPORTS || '100', 10), minUnique = parseInt(process.env.OUTREACH_MIN_UNIQUE || '10', 10)){
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(2); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log('Connected to DB, computing provider aggregates...');
  const agg = await Report.aggregate([
    { $match: { providerId: { $exists: true, $ne: null } } },
    { $group: { _id: '$providerId', totalReports: { $sum: 1 }, uniqueReporters: { $addToSet: '$reporterUserId' } } },
    { $project: { totalReports: 1, uniqueReporters: { $size: '$uniqueReporters' } } },
    { $sort: { totalReports: -1 } }
  ]).allowDiskUse(true);
  let updated = 0;
  for (const a of agg){
    const total = a.totalReports || 0;
    const unique = (a.uniqueReporters || 0);
    if (total >= minReports && unique >= minUnique){
      await Provider.findByIdAndUpdate(a._id, { $set: { readyForOutreach: true } });
      updated++;
    }
  }
  console.log('Mark ready complete. providers updated=', updated);
  await mongoose.disconnect();
}

if (require.main === module){
  const minReports = process.argv[2] ? parseInt(process.argv[2],10) : undefined;
  const minUnique = process.argv[3] ? parseInt(process.argv[3],10) : undefined;
  markReady(minReports, minUnique).catch(err=>{ console.error(err); process.exit(1); });
}

module.exports = { markReady };
