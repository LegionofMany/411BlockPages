/** @jest-environment jsdom */

/// <reference types="jest" />

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('LiveFeed TransactionItem navigation', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('navigates to sender wallet on click', async () => {
    const TransactionItem = (await import('../components/LiveFeed/TransactionItem')).default;

    const tx: any = {
      id: '0xhash',
      hash: '0x' + 'a'.repeat(64),
      from: '0x' + '1'.repeat(40),
      to: '0x' + '2'.repeat(40),
      valueNative: 123.456,
      valueUsd: 1_500_000,
      symbol: 'ETH',
      network: 'ethereum',
      timestamp: Date.now(),
      kind: 'large-transfer',
      isIncoming: true,
      isNft: false,
      label: '🔥 Whale Transfer Detected',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TransactionItem tx={tx} />);
    });

    const clickable = container.firstElementChild as HTMLElement;
    expect(clickable).toBeTruthy();

    await act(async () => {
      clickable.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(push).toHaveBeenCalledWith(`/wallet/ethereum/${encodeURIComponent(tx.from)}`);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('navigates to sender wallet on Enter key', async () => {
    const TransactionItem = (await import('../components/LiveFeed/TransactionItem')).default;

    const tx: any = {
      id: '0xhash2',
      hash: '0x' + 'b'.repeat(64),
      from: '0x' + '3'.repeat(40),
      to: '0x' + '4'.repeat(40),
      valueNative: 1,
      symbol: 'ETH',
      network: 'ethereum',
      timestamp: Date.now(),
      kind: 'other',
      isIncoming: true,
      isNft: false,
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TransactionItem tx={tx} />);
    });

    const clickable = container.firstElementChild as HTMLElement;

    await act(async () => {
      clickable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(push).toHaveBeenCalledWith(`/wallet/ethereum/${encodeURIComponent(tx.from)}`);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
