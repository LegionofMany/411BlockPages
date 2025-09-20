import axios from 'axios';

export async function fetchSolanaTxs(address: string) {
  try {
    // Use the main Solscan API endpoint for transaction history
    const { data } = await axios.get(`https://api.solscan.io/account/transactions?address=${address}&offset=0&limit=10`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
