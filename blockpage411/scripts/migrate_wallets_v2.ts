// Migration script for Blockpage411 v2 Wallet schema
// Adds 'chain' field to all existing wallets (default: 'ethereum')
// and ensures composite key (address + chain)

import mongoose from 'mongoose';
import Wallet from '../lib/walletModel';

const MONGODB_URI = process.env.MONGODB_URI as string;

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const wallets = await Wallet.find({ chain: { $exists: false } });
  for (const wallet of wallets) {
    wallet.chain = 'ethereum';
    await wallet.save();
  }
  console.log(`Migrated ${wallets.length} wallets to v2 schema.`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
