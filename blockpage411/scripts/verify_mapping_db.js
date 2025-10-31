const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
(async()=>{
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI missing'); process.exit(2); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  const providerWalletSchema = new mongoose.Schema({ providerId: mongoose.Schema.Types.ObjectId, address: String, chain: String, note: String, source: String }, { timestamps: true });
  const ProviderWallet = mongoose.models.ProviderWallet || mongoose.model('ProviderWallet', providerWalletSchema);
  const providerSchema = new mongoose.Schema({ name: String, aliases: [String], type: String, website: String }, { timestamps: true });
  const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);

  const addr = '0x0000000000000000000000000000000000000001'.toLowerCase();
  const chain = 'ethereum';
  const pw = await ProviderWallet.findOne({ address: addr, chain }).lean();
  if (!pw) { console.error('ProviderWallet not found for', addr); process.exit(1); }
  const p = await Provider.findById(pw.providerId).lean();
  console.log('Found mapping:');
  console.log({ providerWallet: pw, provider: p });
  await mongoose.disconnect();
})();
