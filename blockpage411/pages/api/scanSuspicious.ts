// pages/api/scanSuspicious.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import rateLimit from 'lib/rateLimit';
import redis, { RedisLike } from 'lib/redis';

const LOCK_KEY = 'scanSuspicious:lock';
const LOCK_TTL = 60 * 5; // 5 minutes
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

// Basic suspicious activity detection rules
function isSuspicious(wallet: { flags?: string[]; blacklisted?: boolean; suspicious?: boolean }) {
  // Example rules: many flags, recent large tx, blacklisted, etc.
  if ((wallet.flags?.length || 0) > 3) return true;
  if (wallet.blacklisted) return true;
  // Add more rules as needed
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  // Optional cron secret check: if CRON_SECRET is set, require the header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = req.headers['x-cron-secret'] || req.headers['x-cron-token'];
    if (!header || header !== cronSecret) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  if (!rateLimit(req, res)) return;

  // Acquire distributed lock to avoid concurrent runs
  try {
    const acquired = await tryAcquireLock(LOCK_KEY, LOCK_TTL);
    if (!acquired) {
      return res.status(409).json({ message: 'Another scan is in progress' });
    }

    await dbConnect();
    const wallets = await Wallet.find({});
    let updated = 0;
    for (const wallet of wallets) {
      const suspicious = isSuspicious(wallet);
      if (wallet.suspicious !== suspicious) {
        wallet.suspicious = suspicious;
        // save with retry
        await retry(async () => wallet.save(), RETRY_COUNT, RETRY_DELAY_MS);
        updated++;
      }
    }
    res.status(200).json({ success: true, updated });
  } finally {
    // release lock
    try { await (redis as RedisLike).del(LOCK_KEY); } catch { /* ignore */ }
  }
}

async function tryAcquireLock(key: string, ttlSec: number) {
  try {
    // SET key value NX EX ttl
    const r = await (redis as RedisLike).set(key, String(Date.now()), 'NX', 'EX', ttlSec);
    return !!r;
  } catch (err) {
    console.warn('redis lock error', err instanceof Error ? err.message : err);
    return false;
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
