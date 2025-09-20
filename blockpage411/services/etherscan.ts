import axios from 'axios';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;

export async function fetchEtherscanTxs(address: string) {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    if (data.status === '1') return data.result;
  } catch {}
  return [];
}
