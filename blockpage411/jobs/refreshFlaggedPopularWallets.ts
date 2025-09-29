// jobs/refreshFlaggedPopularWallets.ts
import Bull from 'bull';
import Wallet from '../lib/walletModel';
import fetchTransactions from '../lib/fetchTransactions';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const refreshQueue = new Bull('refresh-wallets', REDIS_URL);

// Job processor: refresh transactions for flagged/popular wallets
refreshQueue.process(async (job) => {
  const { address, chain } = job.data;
  // Fetch latest transactions and update wallet
  const txs = await fetchTransactions(address);
  await Wallet.updateOne({ address, chain }, { $set: { transactions: txs, lastRefreshed: new Date() } });
});

// Enqueue jobs for flagged/popular wallets every hour
export async function enqueueFlaggedPopularWallets() {
  const wallets = await Wallet.find({ $or: [ { 'flags.0': { $exists: true } }, { popular: true } ] });
  wallets.forEach(wallet => {
    refreshQueue.add({ address: wallet.address, chain: wallet.chain });
  });
}

// Cron setup (using node-cron)
import cron from 'node-cron';
cron.schedule('0 * * * *', () => {
  enqueueFlaggedPopularWallets();
});

export default refreshQueue;
