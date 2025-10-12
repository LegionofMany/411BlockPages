import axios from 'axios';

// Minimal SPL parsing using Solscan / solana.fm outputs
export async function detectSolanaTokenTransfer(address: string, txHash: string) {
  try {
    const { data } = await axios.get(`https://api.solscan.io/transaction/${txHash}`);
    // solscan returns parsed instructions with token balances; this is best-effort
    const parsed = data?.tokenTransfers || data?.token || data;
    if (!parsed) return { found: false } as const;
    // try to find transfer to address
    for (const t of parsed) {
      const to = (t.to || t.destination || t['account']) || '';
      if (String(to).toLowerCase() === address.toLowerCase()) {
        // token amount and symbol
        const amount = Number(t.amount || t.value || 0);
        const token = t.tokenSymbol || t.symbol || t.mint || '';
        return { found: true, amount, token } as const;
      }
    }
  } catch (err) {
    // fallback attempt: solana.fm — log debug for visibility
    // eslint-disable-next-line no-console
    console.debug('[detectSolanaTokenTransfer] solscan error:', (err as any)?.message ?? err);
    try {
      const { data } = await axios.get(`https://api.solana.fm/v0/transactions/${txHash}`);
      const rec = data?.result;
      if (rec && rec.tokenTransfers) {
        for (const t of rec.tokenTransfers) {
          if (String(t.to).toLowerCase() === address.toLowerCase()) {
            return { found: true, amount: Number(t.uiAmount || t.amount || 0), token: t.symbol || t.mint } as const;
          }
        }
      }
    } catch {
      // ignore
    }
  }
  // final RPC fallback: try configured SOLANA_RPC_URL with jsonParsed
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (rpcUrl) {
      const resp = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [txHash, { encoding: 'jsonParsed' }],
      });
      const rec = resp.data?.result;
      const postBalances = rec?.meta?.postTokenBalances || [];
      for (const b of postBalances) {
        if (String(b.owner).toLowerCase() === address.toLowerCase() || String(b.accountIndex) === address) {
          return { found: true, amount: Number(b.uiTokenAmount?.uiAmount || b.uiTokenAmount?.amount || 0), token: b.mint } as const;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return { found: false } as const;
}
