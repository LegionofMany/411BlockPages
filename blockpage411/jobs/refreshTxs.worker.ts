
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import Wallet from '../lib/walletModel';
import axios from 'axios';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const refreshTxsQueue = new Queue('refreshTxs', { connection });

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

// Worker to refresh cached transactions for wallets using live blockchain data


interface RefreshJob extends Job {
  data: { wallet: string };
}

const worker = new Worker('refreshTxs', async (job: RefreshJob) => {
  const { wallet: walletAddress } = job.data;
  const wallet = await Wallet.findOne({ address: walletAddress });
  if (!wallet) return { refreshed: false };
  const chain = wallet.chain;
  let txCount = 0;
  let lastTxWithinHours = 9999;
  let transactions: any[] = [];
  try {
    if (["ethereum", "polygon", "bsc"].includes(chain)) {
      // Use Etherscan/Polygonscan/Bscscan API
      const apiUrl = getApiUrl(chain) + wallet.address + `&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
      const res = await axios.get(apiUrl);
      const txs = res.data.result || [];
      txCount = txs.length;
      lastTxWithinHours = txs.length > 0 ? (Date.now() / 1000 - Number(txs[0].timeStamp)) / 3600 : 9999;
      transactions = txs.map((tx: any) => ({
        hash: tx.hash || tx.txid,
        value: tx.value,
        timestamp: tx.timeStamp,
        to: tx.to,
        from: tx.from,
        data: tx.input || ''
      }));
    } else if (chain === 'bitcoin') {
      // Bitcoin: Use Blockstream API
      const url = `${getApiUrl(chain)}/address/${wallet.address}/txs`;
      const res = await axios.get(url);
      const txs = res.data;
      txCount = txs.length;
      lastTxWithinHours = txs.length > 0 ? (Date.now() / 1000 - txs[0].status.block_time) / 3600 : 9999;
      transactions = txs.map((tx: any) => ({
        hash: tx.txid,
        value: tx.vout.reduce((sum: number, v: any) => sum + v.value, 0),
        timestamp: tx.status.block_time,
        to: tx.vout.map((v: any) => v.scriptpubkey_address).join(','),
        from: tx.vin.map((v: any) => v.prevout ? v.prevout.scriptpubkey_address : '').join(','),
        data: ''
      }));
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
      lastTxWithinHours = txs.length > 0 ? (Date.now() / 1000 - txs[0].tx.date) / 3600 : 9999;
      transactions = txs.map((tx: any) => ({
        hash: tx.tx.hash,
        value: tx.tx.Amount || 0,
        timestamp: tx.tx.date,
        to: tx.tx.Destination,
        from: tx.tx.Account,
        data: JSON.stringify(tx.tx)
      }));
    }
    wallet.txCount = txCount;
    wallet.lastTxWithinHours = lastTxWithinHours;
    wallet.transactions = transactions;
    await wallet.save();
    return { refreshed: true };
  } catch (err: any) {
    console.error('Error fetching tx history:', err?.message || err);
    return { refreshed: false, error: err?.message || String(err) };
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Refreshed txs for wallet: ${job.data.wallet}`);
});

worker.on('failed', (job, err) => {
  console.error(`Failed to refresh txs for wallet: ${job?.data?.wallet}`, err);
});

export default worker;
