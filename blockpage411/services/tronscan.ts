import axios from 'axios';

interface TronscanTransaction {
  hash?: string;
  transaction_id?: string;
  ownerAddress?: string;
  from?: string;
  toAddress?: string;
  to?: string;
  amount?: number;
  contractData?: { amount?: number };
  timestamp?: number;
  contractType?: string;
  type?: string;
}

export async function fetchTronTxs(address: string) {
  try {
    const { data } = await axios.get(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=10`);
    if (!Array.isArray(data.data)) return [];
    return data.data.map((tx: TronscanTransaction) => ({
      hash: tx.hash || tx.transaction_id || '',
      from: tx.ownerAddress || tx.from || '',
      to: tx.toAddress || tx.to || '',
      value: tx.amount?.toString() || tx.contractData?.amount?.toString() || '',
      date: tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
      type: tx.contractType || tx.type || '',
    }));
  } catch {
    return [];
  }
}
