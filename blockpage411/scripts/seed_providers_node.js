#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

async function main(){
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment');
    process.exitCode = 2; return;
  }
  const dataPath = path.join(__dirname, '..', 'data', 'providers.json');
  if (!fs.existsSync(dataPath)) { console.error('providers.json not found at', dataPath); process.exitCode = 2; return; }
  const json = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Minimal Provider schema for seeding
  const providerSchema = new mongoose.Schema({
    name: String,
    aliases: [String],
    type: String,
    website: String,
    rank: Number,
    status: { type: String, default: 'approved' },
    seeded: { type: Boolean, default: true },
  }, { timestamps: true });

  const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);

  console.log('Connecting to', uri);
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  let inserted = 0, updated = 0;
  for (const item of json){
    try{
      const existing = await Provider.findOne({ name: item.name });
      if (existing){
        // update some fields
        existing.aliases = item.aliases || existing.aliases;
        existing.type = item.type || existing.type;
        existing.website = item.website || existing.website;
        existing.rank = item.rank || existing.rank;
        existing.status = item.status || existing.status || 'approved';
        existing.seeded = true;
        await existing.save();
        updated++;
      } else {
        await Provider.create({
          name: item.name,
          aliases: item.aliases || [],
          type: item.type || 'Other',
          website: item.website || '',
          rank: item.rank || null,
          status: item.status || 'approved',
          seeded: true,
        });
        inserted++;
      }
    }catch(e){ console.warn('failed seeding', item.name, e.message || e); }
  }

  console.log('Seed complete. inserted=', inserted, 'updated=', updated);
  await mongoose.disconnect();
}

main().catch(err=>{ console.error(err); process.exitCode = 1; });
