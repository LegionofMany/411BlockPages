import { formatEther } from 'ethers';
import type { EvmChainId } from './evmChains';
import { evmRpcCall, hexToBigInt, hexToNumber } from './evmJsonRpc';

export type EvmTxSummary = {
  chain: EvmChainId;
  hash: string;
  from: string;
  to: string | null;
  valueEther: string;
  blockNumber: number | null;
};

type RpcTx = {
  hash?: string;
  from?: string;
  to?: string | null;
  value?: string; // hex
  blockNumber?: string | null; // hex
};

export async function fetchEvmTxByHash(chain: EvmChainId, txHash: string, timeoutMs = 2500): Promise<EvmTxSummary | null> {
  try {
    const tx = await evmRpcCall<RpcTx>(chain, 'eth_getTransactionByHash', [String(txHash || '').trim()], timeoutMs);
    if (!tx || !tx.hash || !tx.from) return null;

    return {
      chain,
      hash: String(tx.hash),
      from: String(tx.from),
      to: tx.to ? String(tx.to) : null,
      valueEther: formatEther(hexToBigInt(tx.value)),
      blockNumber: hexToNumber(tx.blockNumber),
    };
  } catch {
    return null;
  }
}
