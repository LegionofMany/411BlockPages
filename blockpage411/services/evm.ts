import { ethers } from 'ethers';
import { withProvider, getTokenMetadata } from './provider';

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export async function detectEvmDonation(opts: { txHash: string; targetAddress: string; chain?: string }) {
  const { txHash, targetAddress, chain } = opts;
  try {
    return await withProvider(chain, async (provider) => {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!tx || !receipt) return { found: false } as const;

      // Native transfer check
      if (tx.to && String(tx.to).toLowerCase() === targetAddress.toLowerCase()) {
        const valueRaw = (tx as unknown as { value?: unknown }).value ?? 0;
        const coerceNumber = (v: unknown) => {
          if (typeof v === 'number') return v;
          if (typeof v === 'bigint') return Number(v);
          if (typeof v === 'string') return Number(v);
          if (v && typeof (v as { toString?: () => string }).toString === 'function') return Number((v as { toString: () => string }).toString());
          return 0;
        };
        const amount = coerceNumber(valueRaw) / 1e18;
        const tokenSymbol = chain === 'polygon' ? 'MATIC' : chain === 'bsc' ? 'BNB' : 'ETH';
        return { found: true, amount, tokenSymbol } as const;
      }

      // ERC-20 detection: scan logs for Transfer events to targetAddress
      const iface = new ethers.Interface(ERC20_ABI);
      const logs = (receipt as unknown as { logs?: Array<{ topics?: string[]; data?: string; address?: string }> }).logs ?? [];
      for (const log of logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics ?? [], data: log.data ?? '' });
          if (parsed && parsed.name === 'Transfer') {
            const to = String(parsed.args[1] ?? parsed.args['to'] ?? '').toLowerCase();
            if (to === targetAddress.toLowerCase()) {
              const tokenAddress = log.address ?? '';
              // Attempt to read decimals & symbol from cache/provider
              const meta = await getTokenMetadata(provider, tokenAddress);
              const symbol = meta && typeof meta === 'object' && 'symbol' in meta ? (meta as { symbol?: string }).symbol ?? tokenAddress : tokenAddress;
              const decimals = meta && typeof meta === 'object' && 'decimals' in meta ? Number((meta as { decimals?: number }).decimals ?? 18) : 18;
              const rawVal = parsed.args[2] ?? parsed.args['value'] ?? 0;
              const coerceNumber2 = (v: unknown) => {
                if (typeof v === 'number') return v;
                if (typeof v === 'bigint') return Number(v);
                if (typeof v === 'string') return Number(v);
                if (v && typeof (v as { toString?: () => string }).toString === 'function') return Number((v as { toString: () => string }).toString());
                return 0;
              };
              const rawNumber = coerceNumber2(rawVal ?? 0);
              const amount = rawNumber / Math.pow(10, decimals);
              return { found: true, amount, tokenSymbol: symbol, tokenAddress } as const;
            }
          }
        } catch {
          // skip
        }
      }
      return { found: false } as const;
    });
  } catch {
    return { found: false } as const;
  }
}

export type DetectEvmDonationResult = Awaited<ReturnType<typeof detectEvmDonation>>;
