"use client";

import React, { useState, useEffect } from 'react';
import { useConnect, useSignMessage, useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { mainnet } from 'viem/chains';

const chains = [mainnet];

export default function WalletConnectButtons({ onError }: { onError?: (e: unknown) => void }) {
  const { connect, connectors, isPending } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { address: connectedAddress, isConnected } = useAccount();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [relayError, setRelayError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [lastVerified, setLastVerified] = useState<string | null>(null);
  const router = useRouter();
  const [connectorsReady, setConnectorsReady] = useState(false);

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);

  function getConnectorById(id: string) {
    const needle = id.toLowerCase();
    // direct id match
    let found = connectors.find((c) => c.id === id);
    if (found) return found;
    // name-based match (coinbase, walletconnect, injected)
    found = connectors.find((c) => c.name && c.name.toLowerCase().includes(needle));
    if (found) return found;
    // relaxed match: look for common aliases
    if (needle.includes('coinbase')) {
      found = connectors.find((c) => c.name && /coinbase|cbw/.test(c.name.toLowerCase()));
    } else if (needle.includes('walletconnect') || needle.includes('walletconnect')) {
      found = connectors.find((c) => c.name && c.name.toLowerCase().includes('walletconnect'));
    }
    return found;
  }

  useEffect(() => {
    setConnectorsReady(Array.isArray(connectors) && connectors.length > 0);
  }, [connectors]);

  function normalizeWalletError(err: unknown) {
    const msg =
      typeof err === 'string'
        ? err
        : (err as any)?.message || (err as any)?.toString?.() || '';
    const lower = String(msg).toLowerCase();
    // WalletConnect v2 relay failures often surface as WebSocket connection errors.
    if (lower.includes('websocket') || lower.includes('relay.walletconnect.org') || lower.includes('walletconnect')) {
      // Set a user-friendly banner message in the UI.
      try {
        setRelayError(
          'WalletConnect could not open a connection to its relay. This is often caused by an ad-blocker, VPN/corporate firewall, or the project origin not being allowed in WalletConnect Cloud. Try disabling extensions, switching networks, or adding this site to your WalletConnect Cloud allowlist.'
        );
      } catch (e) {
        // ignore setState errors in unusual render scenarios
      }
      return new Error(
        'WalletConnect could not open a connection to its relay. This is usually caused by an ad-blocker, VPN/corporate firewall, antivirus web filtering, or DNS filtering. Try disabling extensions for localhost, turning off VPN, or switching networks (e.g. mobile hotspot), then retry.'
      );
    }

    return err instanceof Error ? err : new Error(String(msg || 'Wallet connection failed'));
  }

  async function handleConnect(connectorId: string) {
    setLoadingId(connectorId);
    try {
      // Special-case injected / MetaMask: if there's no injected provider at all,
      // fail fast with a clear message instead of letting wagmi/inpage.js throw.
      if (connectorId === 'injected' && typeof window !== 'undefined') {
        const eth = (window as any).ethereum;
        const hasInjected = !!eth;
        const hasMetaMask = !!(eth && (eth.isMetaMask || (Array.isArray(eth.providers) && eth.providers.some((p: any) => p.isMetaMask))));
        if (!hasInjected || !hasMetaMask) {
          onError?.(new Error('MetaMask extension not found. Please install MetaMask in your browser or use WalletConnect / Coinbase Wallet instead.'));
          return;
        }
      }

      const connector = getConnectorById(connectorId);

      if (!connector) {
        // If connectors are still initializing, wait briefly (up to 3s) for them to populate
        const waitForConnector = async (timeoutMs = 3000) => {
          const started = Date.now();
          while (Date.now() - started < timeoutMs) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 200));
            const c = getConnectorById(connectorId);
            if (c) return c;
          }
          return null;
        };

        const late = await waitForConnector(3000);
        if (late) {
          await connect({ connector: late });
          return;
        }
        // If injected provider is present, perform a direct MetaMask flow (eth_requestAccounts + personal_sign)
        if (connectorId === 'injected' && typeof window !== 'undefined' && (window as any).ethereum) {
          const eth = (window as any).ethereum;
          try {
            const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
            const address = Array.isArray(accounts) && accounts.length ? accounts[0] : undefined;
            if (!address) throw new Error('No accounts returned from injected provider');

            // Request nonce from server
            const nonceRes = await fetch('/api/auth/nonce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) });
            if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
            const nonceData = await nonceRes.json();
            const message = `Login nonce: ${nonceData.nonce}`;

            // Use personal_sign to sign the message
            const signature: string = await eth.request({ method: 'personal_sign', params: [message, address] });

            // Send verify request (include credentials so cookie is set)
            const verifyRes = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ address, signature }) });
            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}));
              throw new Error(err?.message || 'Verification failed');
            }
            // success — navigate to search or refresh
            router.push('/search');
            return;
          } catch (err) {
            onError?.(err);
            return;
          }
        }

        // For WalletConnect / Coinbase, surface an error listing available connectors
        const available = (connectors || []).map((c) => c.name || c.id).filter(Boolean).join(', ') || 'none';
        onError?.(new Error(`Wallet connector not available yet (${connectorId}). Available: ${available}. Try refreshing /login.`));
        return;
      }

      // Attempt to connect via wagmi connector. Many connectors (WalletConnect/Coinbase)
      // require an additional client-side signature to establish a server session.
      await connect({ connector });

      // Wait briefly for wagmi/useAccount to update with the connected address.
      const waitForAddress = async (timeoutMs = 5000) => {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
          if (isConnected && connectedAddress) return connectedAddress;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 200));
        }
        return null;
      };

      const addr = await waitForAddress(5000);
      if (addr && !lastVerified) {
        try {
          setVerifying(true);
          // Request nonce and perform an EIP-191 style message signature via wagmi's signMessage.
          const nonceRes = await fetch('/api/auth/nonce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) });
          if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
          const nonceData = await nonceRes.json();
          const message = `Login nonce: ${nonceData.nonce}`;
          const signature = await signMessageAsync({ message });
          const verifyRes = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ address: addr, signature }) });
          if (!verifyRes.ok) {
            const err = await verifyRes.json().catch(() => ({}));
            throw new Error(err?.message || 'Verification failed');
          }
          setLastVerified(addr);
          router.push('/search');
          return;
        } catch (err) {
          onError?.(err);
        } finally {
          setVerifying(false);
        }
      }

      try {
        // ensure UI updates to reflect connected state
        router.refresh();
      } catch (_) {
        // best-effort; ignore refresh errors
      }
    } catch (e) {
      console.warn('Connect failed', e);
      const norm = normalizeWalletError(e);
      onError?.(norm);
    } finally {
      setLoadingId(null);
    }
  }

  // Convenience: if user is on mobile and no injected provider, open login page which shows WalletConnect
  if (isMobile && typeof window !== 'undefined' && !(window as any).ethereum) {
    return (
      <div className="space-y-4">
        {relayError && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
            <div className="flex justify-between items-start">
              <div>{relayError}</div>
              <button onClick={() => setRelayError(null)} className="ml-4 font-semibold text-yellow-800">Dismiss</button>
            </div>
          </div>
        )}
        <div className="text-sm text-slate-300">Detected mobile device — use WalletConnect or your wallet app.</div>
        <button
          className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-sky-500"
          onClick={() => handleConnect('walletConnect')}
          disabled={!!loadingId || isPending || verifying}
        >
          <span className="text-2xl">🔗</span>
          <span className="font-bold">WalletConnect</span>
        </button>

        <button
          className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500"
          onClick={() => handleConnect('coinbaseWallet')}
          disabled={!!loadingId || isPending || verifying}
        >
          <span className="text-2xl">💼</span>
          <span className="font-bold">Coinbase Wallet</span>
        </button>

        {!connectorsReady && (
          <div className="text-xs text-slate-400">Loading wallet connectors… if this stays stuck, refresh the page.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relayError && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
          <div className="flex justify-between items-start">
            <div>{relayError}</div>
            <button onClick={() => setRelayError(null)} className="ml-4 font-semibold text-yellow-800">Dismiss</button>
          </div>
        </div>
      )}
      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-500"
        onClick={() => handleConnect('injected')}
          disabled={!!loadingId || isPending || verifying}
      >
        <span className="text-2xl">🦊</span>
        <span className="font-bold">MetaMask</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-sky-500"
        onClick={() => handleConnect('walletConnect')}
          disabled={!!loadingId || isPending || verifying}
      >
        <span className="text-2xl">🔗</span>
        <span className="font-bold">WalletConnect</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500"
        onClick={() => handleConnect('coinbaseWallet')}
          disabled={!!loadingId || isPending || verifying}
      >
        <span className="text-2xl">💼</span>
        <span className="font-bold">Coinbase Wallet</span>
      </button>

      {!connectorsReady && (
        <div className="text-xs text-slate-400">Loading wallet connectors… if this stays stuck, refresh the page.</div>
      )}
    </div>
  );
}
