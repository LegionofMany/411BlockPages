// Tests for wallet visibility logic
import { computeWalletVisibility } from '../services/walletVisibilityService';

describe('computeWalletVisibility', () => {
  it('allows owner to see balance regardless of flags', () => {
    const wallet = { address: '0xabc', flagsCount: 0, isPublic: false, unlockLevel: 0 };
    const vis = computeWalletVisibility(wallet, '0xAbC', { heavyFlagThreshold: 10 });
    expect(vis.isOwner).toBe(true);
    expect(vis.canSeeBalance).toBe(true);
  });

  it('allows non-owner when heavily flagged', () => {
    const wallet = { address: '0xabc', flagsCount: 20, isPublic: false, unlockLevel: 0 };
    const vis = computeWalletVisibility(wallet, '0xdef', { heavyFlagThreshold: 10 });
    expect(vis.isOwner).toBe(false);
    expect(vis.heavilyFlagged).toBe(true);
    expect(vis.canSeeBalance).toBe(true);
  });

  it('denies non-owner when not public and below threshold', () => {
    const wallet = { address: '0xabc', flagsCount: 1, isPublic: false, unlockLevel: 0 };
    const vis = computeWalletVisibility(wallet, '0xdef', { heavyFlagThreshold: 10 });
    expect(vis.isOwner).toBe(false);
    expect(vis.heavilyFlagged).toBe(false);
    expect(vis.canSeeBalance).toBe(false);
  });

  it('allows non-owner when wallet is public', () => {
    const wallet = { address: '0xabc', flagsCount: 0, isPublic: true, unlockLevel: 0 };
    const vis = computeWalletVisibility(wallet, '0xdef', { heavyFlagThreshold: 10 });
    expect(vis.canSeeBalance).toBe(true);
  });

  it('allows non-owner when unlockLevel is high enough', () => {
    const wallet = { address: '0xabc', flagsCount: 0, isPublic: false, unlockLevel: 1 };
    const vis = computeWalletVisibility(wallet, '0xdef', { heavyFlagThreshold: 10 });
    expect(vis.canSeeBalance).toBe(true);
  });
});
