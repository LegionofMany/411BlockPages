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

  // CLI flags
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i++){
    const a = argv[i];
    if (a === '--resume') args.resume = true;
    else if (a === '--dryRun') args.dryRun = true;
    else if (a === '--checkpoint' && argv[i+1]) { args.checkpoint = argv[++i]; }
    else if (a === '--batchSize' && argv[i+1]) { args.batchSize = parseInt(argv[++i], 10); }
    else if (a === '--progressLog' && argv[i+1]) { args.progressLog = argv[++i]; }
  }

  const checkpointFile = args.checkpoint || path.join(process.cwd(), '.import-status.json');
  const batchSize = args.batchSize || 1000;
  const dryRun = !!args.dryRun;
  let lastIndex = 0;
  if (args.resume && fs.existsSync(checkpointFile)){
    try{ const c = JSON.parse(fs.readFileSync(checkpointFile, 'utf8')); lastIndex = Number(c.lastIndex) || 0; }catch(e){ lastIndex = 0; }
    console.log('Resuming import from index', lastIndex);
  }

  try{
    const importer = require('../lib/importerCli');
    const progressLogPath = args.progressLog || null;
    // detect file type heuristics
    const ext = path.extname(file).toLowerCase();
    const isCsv = ext === '.csv' || file.toLowerCase().endsWith('.csv');
    const isNdjson = ext === '.ndjson' || file.toLowerCase().endsWith('.ndjson') || file.toLowerCase().endsWith('.ndj');

    const res = await importer.importFromFile(file, { batchSize, dryRun, checkpointFile, progressLog: progressLogPath, resume: !!args.resume, csv: isCsv, ndjson: isNdjson });
    console.log('Import complete.', res);
  }catch(e){ console.error('import failed', e); }

  await mongoose.disconnect();
}

if (require.main === module){
  main().catch(err=>{ console.error(err); process.exit(1); });
}

module.exports = { main };
