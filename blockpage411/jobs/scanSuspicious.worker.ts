
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import Wallet from '../lib/walletModel';
import { ethers } from 'ethers';
import axios from 'axios';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const scanSuspiciousQueue = new Queue('scanSuspicious', { connection });

// Helper: get API URL for chain
function getApiUrl(chain: string): string {
  switch (chain) {
    case 'ethereum':
      return `https://api.etherscan.io/api?module=account&action=txlist&address=`;
    case 'polygon':
      return `https://api.polygonscan.com/api?module=account&action=txlist&address=`;
    case 'bsc':
      return `https://api.bscscan.com/api?module=account&action=txlist&address=`;
    case 'bitcoin':
      return process.env.BITCOIN_RPC_URL || '';
    case 'xrp':
      return process.env.XRPL_RPC_URL || '';
    default:
      throw new Error('Unsupported chain: ' + chain);
  }
}

// Worker to scan wallets for suspicious activity using live blockchain data


interface ScanJob extends Job {
  data: { wallet: string };
}

const worker = new Worker('scanSuspicious', async (job: ScanJob) => {
  const wallet = await Wallet.findOne({ address: job.data.wallet });
  if (!wallet) return { scanned: false };
  const chain = wallet.chain;
  let suspicious = false;
  let txCount = 0;
  let lastTxWithinHours = 9999;

  try {
    if (["ethereum", "polygon", "bsc"].includes(chain)) {
      // Use Etherscan/Polygonscan/Bscscan API
      const apiUrl = getApiUrl(chain) + wallet.address + `&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
      const res = await axios.get(apiUrl);
      const txs = res.data.result || [];
      txCount = txs.length;
      const recentTxs = txs.filter((tx: any) => Date.now() / 1000 - Number(tx.timeStamp) < 3600);
      lastTxWithinHours = recentTxs.length > 0 ? (Date.now() / 1000 - Number(recentTxs[0].timeStamp)) / 3600 : 9999;
      const rapidTxs = recentTxs.length > 10;
      const largeTxs = txs.some((tx: any) => parseFloat(tx.value) > 100 * 1e18);
      const contractInteraction = txs.some((tx: any) => tx.input && tx.input.length > 2);
      suspicious = rapidTxs || largeTxs || contractInteraction;
    } else if (chain === 'bitcoin') {
      // Bitcoin: Use Blockstream API
      const url = `${getApiUrl(chain)}/address/${wallet.address}/txs`;
      const res = await axios.get(url);
      const txs = res.data;
      txCount = txs.length;
      const recentTxs = txs.filter((tx: any) => Date.now() / 1000 - tx.status.block_time < 3600);
      lastTxWithinHours = recentTxs.length > 0 ? (Date.now() / 1000 - recentTxs[0].status.block_time) / 3600 : 9999;
      suspicious = recentTxs.length > 10 || txs.some((tx: any) => tx.vout.some((v: any) => v.value > 10)); // Example: >10 BTC
    } else if (chain === 'xrp') {
      // XRP: Use Ripple API
      const url = getApiUrl(chain);
      const body = {
        method: "account_tx",
        params: [{
          account: wallet.address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 100
        }]
      };
      const res = await axios.post(url, body);
      const txs = res.data.result.transactions || [];
      txCount = txs.length;
      const recentTxs = txs.filter((tx: any) => Date.now() / 1000 - tx.tx.date < 3600);
      lastTxWithinHours = recentTxs.length > 0 ? (Date.now() / 1000 - recentTxs[0].tx.date) / 3600 : 9999;
      suspicious = recentTxs.length > 10 || txs.some((tx: any) => tx.tx.Amount && parseFloat(tx.tx.Amount) > 100000000); // Example: >100 XRP
    }
    // Common checks
    const isBlacklisted = wallet.blacklisted === true;
    const failedKYC = wallet.kycStatus === 'failed';
    const flaggedByAdmin = wallet.flagsList && wallet.flagsList.includes('suspicious');
    suspicious = suspicious || isBlacklisted || failedKYC || flaggedByAdmin;
    wallet.txCount = txCount;
    wallet.lastTxWithinHours = lastTxWithinHours;
  } catch (err: any) {
    console.error('Error fetching tx history:', err?.message || err);
  }
  wallet.suspicious = suspicious;
  await wallet.save();
  // Update Redis set
  if (suspicious) {
    await connection.sadd('suspicious_wallets', wallet.address);
    return { scanned: true, suspicious: true };
  } else {
    await connection.srem('suspicious_wallets', wallet.address);
    return { scanned: true, suspicious: false };
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Scanned wallet for suspicious activity: ${job.data.wallet}`);
});

worker.on('failed', (job, err) => {
  console.error(`Failed to scan wallet: ${job?.data?.wallet}`, err);
});

export default worker;
