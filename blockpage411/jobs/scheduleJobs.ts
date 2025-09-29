import { refreshTxsQueue } from './refreshTxs.worker';
import { scanSuspiciousQueue } from './scanSuspicious.worker';
import Wallet from '../lib/walletModel';

// Schedule jobs for flagged, popular, and regular wallets
export async function scheduleWalletJobs() {
  // Fetch wallets from DB
  const flagged = await Wallet.find({ flagged: true });
  const popular = await Wallet.find({ popular: true });
  const regular = await Wallet.find({});

  // Flagged wallets: every 10 min
  flagged.forEach(wallet => {
    refreshTxsQueue.add('refreshTxs', { wallet: wallet.address }, { repeat: { every: 10 * 60 * 1000 } });
  });

  // Popular wallets: every 30 min
  popular.forEach(wallet => {
    refreshTxsQueue.add('refreshTxs', { wallet: wallet.address }, { repeat: { every: 30 * 60 * 1000 } });
  });

  // Regular wallets: daily
  regular.forEach(wallet => {
    refreshTxsQueue.add('refreshTxs', { wallet: wallet.address }, { repeat: { every: 24 * 60 * 60 * 1000 } });
  });

  // Scan suspicious wallets (all): every 10 min
  regular.forEach(wallet => {
    scanSuspiciousQueue.add('scanSuspicious', { wallet: wallet.address }, { repeat: { every: 10 * 60 * 1000 } });
  });
}

// Call this function from a cron job or server startup
scheduleWalletJobs();
