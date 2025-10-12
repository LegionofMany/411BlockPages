import axios from 'axios';

export async function detectTronTokenTransfer(address: string, txHash: string) {
  try {
    const { data } = await axios.get(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`);
    const transfers = data?.tokenTransfer; // may vary
    if (!Array.isArray(transfers)) return { found: false } as const;
    for (const t of transfers) {
      const to = t.toAddress || t.to || t.ownerAddress || '';
      if (String(to).toLowerCase() === address.toLowerCase()) {
        const amount = Number(t.amount || t.value || 0) / (Math.pow(10, Number(t.decimals || 18)));
        const token = t.tokenName || t.tokenId || t.contract || t.tokenId || '';
        return { found: true, amount, token } as const;
      }
    }
  } catch {
    // ignore
  }
  // RPC fallback: call TRON_NODE_URL if configured
  try {
    const node = process.env.TRON_NODE_URL;
    if (node) {
      const resp = await axios.post(node, { value: txHash }, { headers: { 'Content-Type': 'application/json' } });
      const info = resp.data;
      // try to parse token_info or internal transfers
      const transfers = info?.log || info?.contractRet || info?.token_info || [];
      for (const t of transfers) {
        const to = t.to || t.toAddress || '';
        if (String(to).toLowerCase() === address.toLowerCase()) {
          const amount = Number(t.amount || t.value || 0) / (Math.pow(10, Number(t.decimals || 18)));
          const token = t.tokenName || t.tokenId || t.contract || '';
          return { found: true, amount, token } as const;
        }
      }
    }
  } catch {
    // ignore
  }
  return { found: false } as const;
}
