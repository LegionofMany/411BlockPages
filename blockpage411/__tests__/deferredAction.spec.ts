/** @jest-environment jsdom */
/// <reference types="jest" />

import { clearDeferredAction, consumeDeferredAction, readDeferredAction, setDeferredAction } from '../app/components/auth/deferredAction';

describe('deferredAction', () => {
  beforeEach(() => {
    clearDeferredAction();
  });

  test('set + read roundtrip', () => {
    setDeferredAction({
      type: 'followWallet',
      chain: 'ethereum',
      address: '0xabc',
    });

    const a = readDeferredAction();
    expect(a).toBeTruthy();
    expect(a?.type).toBe('followWallet');
    expect((a as any).createdAt).toEqual(expect.any(Number));
  });

  test('consume clears after reading', () => {
    setDeferredAction({ type: 'flagWallet', chain: 'ethereum', address: '0xabc', reason: 'test' });

    const first = consumeDeferredAction();
    expect(first?.type).toBe('flagWallet');

    const second = consumeDeferredAction();
    expect(second).toBeNull();
  });

  test('consume respects TTL', () => {
    setDeferredAction({ type: 'rateWallet', chain: 'ethereum', address: '0xabc', rating: 5, text: 'ok' });

    // Force it to look old.
    const raw = window.localStorage.getItem('deferredAction');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(String(raw));
    parsed.createdAt = Date.now() - 60_000;
    window.localStorage.setItem('deferredAction', JSON.stringify(parsed));

    const a = consumeDeferredAction(1);
    expect(a).toBeNull();
  });
});
