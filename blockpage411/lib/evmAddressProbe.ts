import type { EvmChainId } from './evmChains';
import { evmRpcCall, hexToNumber } from './evmJsonRpc';

export async function getEvmTxCount(chain: EvmChainId, address: string, timeoutMs = 2500): Promise<number | null> {
  try {
    const resultHex = await evmRpcCall<string>(chain, 'eth_getTransactionCount', [String(address || '').trim(), 'latest'], timeoutMs);
    const n = hexToNumber(resultHex);
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
