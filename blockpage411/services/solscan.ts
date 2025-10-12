import axios from 'axios';

interface SolscanTransaction {
  txHash?: string;
  hash?: string;
  src?: string;
  dst?: string;
  lamport?: number;
  amount?: number;
  blockTime?: number;
  type?: string;
  parsedInstruction?: Array<{ source?: string; destination?: string; type?: string }>;
}

export async function fetchSolanaTxs(address: string) {
  try {
    const { data } = await axios.get(`https://api.solscan.io/account/transactions?address=${address}&offset=0&limit=10`);
    if (Array.isArray(data)) {
      return data.map((tx: SolscanTransaction) => ({
        hash: tx.txHash || tx.hash || '',
        from: tx.src || (tx.parsedInstruction && tx.parsedInstruction[0]?.source) || '',
        to: tx.dst || (tx.parsedInstruction && tx.parsedInstruction[0]?.destination) || '',
        value: tx.lamport?.toString() || tx.amount?.toString() || '',
        date: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '',
        type: tx.type || tx.parsedInstruction?.[0]?.type || '',
      }));
    }
  } catch (err: unknown) {
    // If Solscan fails (403, etc), try solana.fm as fallback
    try {
      interface SolanaFmTransaction {
        signature?: string;
        accountData?: { owner?: string; destination?: string };
        meta?: { preTokenBalances?: Array<{ owner?: string; uiTokenAmount?: { uiAmountString?: string } }>; postTokenBalances?: Array<{ owner?: string }> };
        blockTime?: number;
        transactionType?: string;
      }
      const { data } = await axios.get(`https://api.solana.fm/v0/accounts/${address}/transactions?limit=10`);
      // Solana.fm returns { status, message, result: { data: [...] } }
      const txs = data?.result?.data;
      if (Array.isArray(txs)) {
        return txs.map((tx: SolanaFmTransaction) => ({
          hash: tx.signature || '',
          from: tx.accountData?.owner || (tx.meta?.preTokenBalances?.[0]?.owner ?? ''),
          to: tx.accountData?.destination || (tx.meta?.postTokenBalances?.[0]?.owner ?? ''),
          value: tx.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmountString || '',
          date: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '',
          type: tx.transactionType || '',
        }));
      }
    } catch {
      // Log the original error for debugging
      try {
        console.error('Solscan error:', (err as { response?: { status?: number }, message?: string })?.response?.status, (err as { response?: { status?: number }, message?: string })?.message);
      } catch {}
    }
  }
  return [];
}
