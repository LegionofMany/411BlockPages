export type SupportedNetwork = 'ethereum' | 'bsc' | 'polygon';

export type TransactionKind = 'large-transfer' | 'contract' | 'nft' | 'other';

export interface NormalizedTransaction {
  id: string; // tx hash or synthetic id
  hash: string;
  from: string;
  to: string;
  valueNative: number; // in main token units (ETH/BNB/MATIC)
  valueUsd?: number;
  symbol: string; // e.g. ETH, BNB, MATIC, USDC
  network: SupportedNetwork;
  timestamp: number; // ms epoch
  kind: TransactionKind;
  isIncoming: boolean;
  isNft: boolean;
  label?: string;
}

export interface RawWsTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // hex or decimal string in wei/base units
  input?: string;
  blockNumber?: string | number | null;
  timestamp?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  isNft?: boolean;
}

export interface NormalizeOptions {
  network: SupportedNetwork;
  nativeSymbol: string;
  nativeDecimals: number;
  usdPrice?: number; // approximate price used for valueUsd
  largeThresholdUsd?: number; // classify as whale if above
}

export function normalizeTransaction(raw: RawWsTransaction, opts: NormalizeOptions): NormalizedTransaction {
  const { network, nativeSymbol, nativeDecimals, usdPrice = 0, largeThresholdUsd = 10_000 } = opts;

  const from = (raw.from || '').toLowerCase();
  const to = (raw.to || '').toLowerCase();
  const hash = raw.hash || `${from}-${to}-${Date.now()}`;

  const valueStr = raw.value || '0';
  let valueNative = 0;
  try {
    // interpret value as wei/base units string, convert to main units
    const asBigInt = BigInt(valueStr.startsWith('0x') ? valueStr : BigInt(valueStr).toString());
    const divisor = BigInt(10) ** BigInt(nativeDecimals);
    valueNative = Number(asBigInt) / Number(divisor);
  } catch {
    valueNative = 0;
  }

  const symbol = raw.tokenSymbol || nativeSymbol;
  const valueUsd = usdPrice > 0 ? valueNative * usdPrice : undefined;

  const isLarge = typeof valueUsd === 'number' && valueUsd >= largeThresholdUsd;
  const isContractInteraction = !!raw.input && raw.input !== '0x' && !raw.isNft;
  const isNft = !!raw.isNft;

  let kind: TransactionKind = 'other';
  if (isNft) kind = 'nft';
  else if (isContractInteraction) kind = 'contract';
  else if (isLarge) kind = 'large-transfer';

  const isIncoming = true; // for simplicity; can be refined per viewing wallet later

  const label = isLarge ? '🔥 Whale Transfer Detected' : undefined;

  return {
    id: hash,
    hash,
    from,
    to,
    valueNative,
    valueUsd,
    symbol,
    network,
    timestamp: raw.timestamp || Date.now(),
    kind,
    isIncoming,
    isNft,
    label,
  };
}
