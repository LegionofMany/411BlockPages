import axios from 'axios';

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY as string;

export async function fetchBscScanTxs(address: string) {
  const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${BSCSCAN_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    if (data.status === '1') return data.result;
  } catch {}
  return [];
}
