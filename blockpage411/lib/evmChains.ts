export type EvmChainId = 'ethereum' | 'bsc' | 'polygon' | 'base' | 'arbitrum' | 'optimism';

export type EvmChainConfig = {
  id: EvmChainId;
  label: string;
  chainId: number;
  nativeSymbol: string;
  rpcUrls: string[];
  explorerTxBase: string;
  explorerAddressBase: string;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export const EVM_CHAINS: Record<EvmChainId, EvmChainConfig> = {
  ethereum: {
    id: 'ethereum',
    label: 'Ethereum',
    chainId: 1,
    nativeSymbol: 'ETH',
    rpcUrls: [env('ETH_RPC_URL'), env('NEXT_PUBLIC_ETH_RPC_URL'), 'https://cloudflare-eth.com'].filter(Boolean) as string[],
    explorerTxBase: 'https://etherscan.io/tx/',
    explorerAddressBase: 'https://etherscan.io/address/',
  },
  bsc: {
    id: 'bsc',
    label: 'BNB Chain',
    chainId: 56,
    nativeSymbol: 'BNB',
    rpcUrls: [env('BSC_RPC_URL'), env('NEXT_PUBLIC_BSC_RPC_URL'), 'https://bsc-dataseed.binance.org'].filter(Boolean) as string[],
    explorerTxBase: 'https://bscscan.com/tx/',
    explorerAddressBase: 'https://bscscan.com/address/',
  },
  polygon: {
    id: 'polygon',
    label: 'Polygon',
    chainId: 137,
    nativeSymbol: 'MATIC',
    rpcUrls: [env('POLYGON_RPC_URL'), env('NEXT_PUBLIC_POLYGON_RPC_URL'), 'https://polygon-rpc.com'].filter(Boolean) as string[],
    explorerTxBase: 'https://polygonscan.com/tx/',
    explorerAddressBase: 'https://polygonscan.com/address/',
  },
  base: {
    id: 'base',
    label: 'Base',
    chainId: 8453,
    nativeSymbol: 'ETH',
    rpcUrls: [env('BASE_RPC_URL'), env('NEXT_PUBLIC_BASE_RPC_URL'), 'https://mainnet.base.org'].filter(Boolean) as string[],
    explorerTxBase: 'https://basescan.org/tx/',
    explorerAddressBase: 'https://basescan.org/address/',
  },
  arbitrum: {
    id: 'arbitrum',
    label: 'Arbitrum',
    chainId: 42161,
    nativeSymbol: 'ETH',
    rpcUrls: [env('ARBITRUM_RPC_URL'), env('NEXT_PUBLIC_ARBITRUM_RPC_URL'), 'https://arb1.arbitrum.io/rpc'].filter(Boolean) as string[],
    explorerTxBase: 'https://arbiscan.io/tx/',
    explorerAddressBase: 'https://arbiscan.io/address/',
  },
  optimism: {
    id: 'optimism',
    label: 'Optimism',
    chainId: 10,
    nativeSymbol: 'ETH',
    rpcUrls: [env('OPTIMISM_RPC_URL'), env('NEXT_PUBLIC_OPTIMISM_RPC_URL'), 'https://mainnet.optimism.io'].filter(Boolean) as string[],
    explorerTxBase: 'https://optimistic.etherscan.io/tx/',
    explorerAddressBase: 'https://optimistic.etherscan.io/address/',
  },
};

export const EVM_CHAIN_PRIORITY: EvmChainId[] = ['ethereum', 'bsc', 'polygon', 'base', 'arbitrum', 'optimism'];

export function isEvmChainId(x: string): x is EvmChainId {
  return Object.prototype.hasOwnProperty.call(EVM_CHAINS, x);
}

export function normalizeEvmChainId(x: string | null | undefined): EvmChainId | null {
  const c = String(x || '').toLowerCase();
  if (!c) return null;
  if (c === 'eth') return 'ethereum';
  if (c === 'bnb') return 'bsc';
  if (c === 'op') return 'optimism';
  if (c === 'arb') return 'arbitrum';
  return isEvmChainId(c) ? c : null;
}
