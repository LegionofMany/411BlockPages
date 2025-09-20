import axios from 'axios';

export async function fetchBlockstreamTxs(address: string) {
  try {
    const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
    return data;
  } catch {
    return [];
  }
}
