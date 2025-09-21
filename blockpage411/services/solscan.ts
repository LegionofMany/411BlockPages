import axios from 'axios';

export async function fetchSolanaTxs(address: string) {
  try {
    const { data } = await axios.get(`https://api.solscan.io/account/transactions?address=${address}&offset=0&limit=10`);
    if (Array.isArray(data)) {
      return data.map((tx: any) => ({
        hash: tx.txHash || tx.hash || '',
        from: tx.src || (tx.parsedInstruction && tx.parsedInstruction[0]?.source) || '',
        to: tx.dst || (tx.parsedInstruction && tx.parsedInstruction[0]?.destination) || '',
        value: tx.lamport?.toString() || tx.amount?.toString() || '',
        date: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '',
        type: tx.type || tx.parsedInstruction?.[0]?.type || '',
      }));
    }
  } catch (err: any) {
    // If Solscan fails (403, etc), try solana.fm as fallback
    try {
      const { data } = await axios.get(`https://api.solana.fm/v0/accounts/${address}/transactions?limit=10`);
      // Solana.fm returns { status, message, result: { data: [...] } }
      const txs = data?.result?.data;
      if (Array.isArray(txs)) {
        return txs.map((tx: any) => ({
          hash: tx.signature || '',
          from: tx.accountData?.owner || (tx.meta?.preTokenBalances?.[0]?.owner ?? ''),
          to: tx.accountData?.destination || (tx.meta?.postTokenBalances?.[0]?.owner ?? ''),
          value: tx.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmountString || '',
          date: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '',
          type: tx.transactionType || '',
        }));
      }
    } catch (fallbackErr: any) {
      // Log both errors for debugging
      console.error('Solscan error:', err?.response?.status, err?.message);
      console.error('Solana.fm fallback error:', fallbackErr?.response?.status, fallbackErr?.message);
    }
  }
  return [];
}
