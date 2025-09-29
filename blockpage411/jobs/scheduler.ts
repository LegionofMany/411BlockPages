import { Queue } from 'bullmq';
import Redis from 'ioredis';
import Wallet from '../lib/walletModel';
import redisClient from '../lib/redis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const schedulerQueue = new Queue('scheduler', { connection });

// Job scheduling logic
export async function scheduleJobs() {
  // Flagged wallets every 10 min
  const flaggedWallets = await Wallet.find({ flagged: true });
  flaggedWallets.forEach(w => {
    schedulerQueue.add('refreshTxs', { wallet: w.address }, { repeat: { every: 10 * 60 * 1000 } });
  });
  // Popular wallets every 30 min
  const popularWallets = await redisClient.zrevrange('popular_wallets', 0, 19);
  popularWallets.forEach(address => {
    schedulerQueue.add('refreshTxs', { wallet: address }, { repeat: { every: 30 * 60 * 1000 } });
  });
  // Regular wallets daily
  const regularWallets = await Wallet.find({ flagged: false, popular: false });
  regularWallets.forEach(w => {
    schedulerQueue.add('refreshTxs', { wallet: w.address }, { repeat: { every: 24 * 60 * 60 * 1000 } });
  });
}

// Suspicious scan job every 10 min for all wallets
export async function scheduleSuspiciousScan() {
  const allWallets = await Wallet.find();
  allWallets.forEach(w => {
    schedulerQueue.add('scanSuspicious', { wallet: w.address }, { repeat: { every: 10 * 60 * 1000 } });
  });
}
