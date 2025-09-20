import axios from 'axios';

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY as string;

export async function fetchPolygonScanTxs(address: string) {
  const url = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${POLYGONSCAN_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    if (data.status === '1') return data.result;
  } catch {}
  return [];
}
