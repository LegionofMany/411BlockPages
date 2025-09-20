import axios from 'axios';

export async function fetchTronTxs(address: string) {
  try {
    // Tronscan public API for transaction history
    const { data } = await axios.get(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=10`);
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}
