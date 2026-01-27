import type { EvmChainId } from '../evmChains';

export type SearchInputKind = 'address' | 'txHash' | 'domain' | 'unknown';

export type ParsedSearchInput = {
  raw: string;
  trimmed: string;
  kind: SearchInputKind;
  address?: string;
  txHash?: string;
  domain?: string;
  chainHint?: EvmChainId;
};

export function isHexAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input);
}

export function isTxHash(input: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(input);
}

export function looksLikeDomain(input: string): boolean {
  const s = String(input || '').trim();
  if (!s) return false;
  if (s.includes(' ')) return false;
  if (s.startsWith('0x')) return false;
  return s.includes('.') && /[a-zA-Z]/.test(s);
}

export function parseSearchInput(raw: string): ParsedSearchInput {
  const trimmed = String(raw || '').trim();
  const lower = trimmed.toLowerCase();

  if (isHexAddress(lower)) {
    return { raw, trimmed, kind: 'address', address: lower };
  }

  if (isTxHash(lower)) {
    return { raw, trimmed, kind: 'txHash', txHash: lower };
  }

  if (looksLikeDomain(lower)) {
    return { raw, trimmed, kind: 'domain', domain: lower };
  }

  return { raw, trimmed, kind: 'unknown' };
}
