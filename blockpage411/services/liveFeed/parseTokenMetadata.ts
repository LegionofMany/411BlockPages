import type { SupportedNetwork } from './normalizeTransaction';

export interface TokenMetadata {
  symbol: string;
  decimals: number;
}

// Very small hard-coded map for main tokens; can be extended or wired to on-chain lookups later.
const NATIVE_TOKEN_META: Record<SupportedNetwork, TokenMetadata> = {
  ethereum: { symbol: 'ETH', decimals: 18 },
  bsc: { symbol: 'BNB', decimals: 18 },
  polygon: { symbol: 'MATIC', decimals: 18 },
};

export function getNativeTokenMetadata(network: SupportedNetwork): TokenMetadata {
  return NATIVE_TOKEN_META[network];
}
