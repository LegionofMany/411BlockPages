#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Define minimal Provider and ProviderWallet schemas in this script so it can run
// under plain Node without importing TypeScript modules.
const providerSchema = new mongoose.Schema({ name: String, aliases: [String], type: String, website: String, rank: Number, status: String, seeded: Boolean }, { timestamps: true });
const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);

const providerWalletSchema = new mongoose.Schema({ providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true }, address: { type: String, required: true, index: true }, chain: { type: String, required: true, index: true }, note: { type: String }, source: { type: String } }, { timestamps: true });
const ProviderWallet = mongoose.models.ProviderWallet || mongoose.model('ProviderWallet', providerWalletSchema);

async function main(){
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(2); }
  await mongoose.connect(uri);

  const file = process.argv[2] || path.join(__dirname, '..', 'data', 'provider_wallets.json');
  if (!fs.existsSync(file)) { console.error('File not found:', file); process.exit(2); }
  const raw = fs.readFileSync(file, 'utf8');
  let items = [];
  try{ items = JSON.parse(raw); } catch(e){
    // try CSV
    const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean);
    const headers = lines.shift().split(',').map(h=>h.trim());
    items = lines.map(l=>{
      const cols = l.split(',').map(c=>c.trim());
      const obj = {};
      headers.forEach((h,i)=> obj[h]=cols[i]);
      return obj;
    });
  }

  try{
    const helper = require('../lib/importProviderHelper');
    const res = await helper.importItems(items);
    console.log('Import complete.', res);
  }catch(e){ console.error('import helper failed', e); }

  await mongoose.disconnect();
}

if (require.main === module){
  main().catch(err=>{ console.error(err); process.exit(1); });
}

module.exports = { main };
