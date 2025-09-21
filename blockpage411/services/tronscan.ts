import axios from 'axios';

export async function fetchTronTxs(address: string) {
  try {
    const { data } = await axios.get(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=10`);
    if (!Array.isArray(data.data)) return [];
    return data.data.map((tx: any) => ({
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
