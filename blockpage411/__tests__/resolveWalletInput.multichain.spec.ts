/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';

// These tests only cover the fast-path address detection logic.
// They should not hit any external RPC/ENS/UD resolution.

describe('resolveWalletInput (multi-chain address detection)', () => {
  it('detects Bitcoin bech32 address', async () => {
    const { resolveWalletInput } = await import('../services/resolveWalletInput');
    const r = await resolveWalletInput('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080');
    expect(r).toMatchObject({
      resolvedFrom: 'address',
      chainHint: 'bitcoin',
    });
    expect(typeof r?.address).toBe('string');
  });

  it('detects Bitcoin legacy address', async () => {
    const { resolveWalletInput } = await import('../services/resolveWalletInput');
    const r = await resolveWalletInput('1BoatSLRHtKNngkdXEeobR76b53LETtpyT');
    expect(r).toMatchObject({
      resolvedFrom: 'address',
      chainHint: 'bitcoin',
      address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
    });
  });

  it('detects Solana address', async () => {
    const { resolveWalletInput } = await import('../services/resolveWalletInput');
    // Well-known Solana program id (System Program)
    const r = await resolveWalletInput('11111111111111111111111111111111');
    expect(r).toMatchObject({
      resolvedFrom: 'address',
      chainHint: 'solana',
      address: '11111111111111111111111111111111',
    });
  });

  it('detects Tron address (shape)', async () => {
    const { resolveWalletInput } = await import('../services/resolveWalletInput');
    // Regex-based detection; use a plausible base58check address shape.
    const r = await resolveWalletInput('TQ5Zb7GkX8gG5Q3xYpR1pXQYJ2b2y9yQvJ');
    expect(r?.chainHint).toBe('tron');
    expect(r?.resolvedFrom).toBe('address');
  });
});
