"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
const WalletButtons = dynamic(() => import('./WalletButtons'));
import { useRouter, useSearchParams } from "next/navigation";
import { useEvmWallet } from "../../components/EvmWalletProvider";
import { hexlify, toUtf8Bytes } from "ethers";


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-gray-900/80 rounded-2xl shadow-2xl p-8 border-2 border-blue-700">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Loading…</h1>
              <p className="text-slate-200 mt-2">Preparing wallet sign-in</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, disconnect, getSigner, provider } = useEvmWallet();
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function withTimeout<T>(p: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), ms);
      }),
    ]);
  }

  function getBestEip1193Provider(): any {
    if (provider && typeof (provider as any).request === 'function') return provider as any;
    if (typeof window === 'undefined') return null;
    const eth = (window as any).ethereum;
    if (!eth) return null;
    // Prefer MetaMask if multiple providers are present.
    if (Array.isArray(eth.providers)) {
      const mm = eth.providers.find((p: any) => p?.isMetaMask);
      if (mm && typeof mm.request === 'function') return mm;
    }
    return typeof eth.request === 'function' ? eth : null;
  }

  function prettyWalletError(e: any): string {
    const code = e?.code;
    const msg = String(e?.message || e || '');
    // MetaMask: -32002 means a request (connect/sign) is already pending.
    if (code === -32002 || msg.toLowerCase().includes('already pending')) {
      return 'A wallet request is already pending. Open your wallet (MetaMask) and approve or reject the existing request, then retry.';
    }
    if (code === 4001 || msg.toLowerCase().includes('user rejected')) {
      return 'Signature was rejected in your wallet. Please retry and approve the signature.';
    }
    return msg || 'Wallet error. Please retry.';
  }

  async function ensureWalletAccountsReady(p: any, expectedAddress: string) {
    if (!p || typeof p.request !== 'function') return;

    // Some wallet providers can appear “connected” in app state but still require
    // a permissions prompt before signing. This forces the prompt up-front.
    let accounts: string[] = [];
    try {
      const res = await withTimeout(
        Promise.resolve(p.request({ method: 'eth_accounts' })),
        8_000,
        'Wallet is not responding. Make sure your wallet extension/app is unlocked.'
      );
      if (Array.isArray(res)) accounts = res.map((a) => String(a));
    } catch (e: any) {
      // Ignore and try requestAccounts.
      console.warn('LOGIN: eth_accounts failed', e);
    }

    const exp = String(expectedAddress || '').toLowerCase();
    const hasExpected = accounts.some((a) => String(a).toLowerCase() === exp);
    if (accounts.length === 0 || (exp && !hasExpected)) {
      try {
        await withTimeout(
          Promise.resolve(p.request({ method: 'eth_requestAccounts' })),
          25_000,
          'Wallet connection request timed out. Open your wallet and approve the connection.'
        );
      } catch (e: any) {
        throw new Error(prettyWalletError(e));
      }
    }
  }

  async function signLoginMessage(opts: { message: string; address: string }): Promise<string> {
    const { message, address } = opts;

    const eip1193 = getBestEip1193Provider();
    if (eip1193) {
      await ensureWalletAccountsReady(eip1193, address);
    }

    // Prefer direct EIP-1193 signing first. In some environments, ethers'
    // Signer.signMessage can hang even though the raw request works.
    if (eip1193 && typeof eip1193.request === 'function') {
      const req = eip1193.request.bind(eip1193);
      const addr = String(address || '').toLowerCase();

      // Try plain string first (widest compatibility).
      try {
        const sig = await withTimeout(
          Promise.resolve(req({ method: 'personal_sign', params: [message, addr] })),
          45_000,
          'Signature request timed out. Open your wallet (MetaMask) and approve the signature.'
        );
        if (typeof sig === 'string' && sig) return sig;
      } catch (e: any) {
        const msg = prettyWalletError(e);
        // If it's a hard user-facing error (reject/pending), surface it.
        if (msg && msg !== String(e?.message || '')) throw new Error(msg);
      }

      // Then try hex-encoded message (some providers prefer this).
      const msgHex = hexlify(toUtf8Bytes(message));
      try {
        const sig = await withTimeout(
          Promise.resolve(req({ method: 'personal_sign', params: [msgHex, addr] })),
          45_000,
          'Signature request timed out. Open your wallet (MetaMask) and approve the signature.'
        );
        if (typeof sig === 'string' && sig) return sig;
      } catch {
        // Some wallets flip param order: [address, data]
        const sig = await withTimeout(
          Promise.resolve(req({ method: 'personal_sign', params: [addr, msgHex] })),
          45_000,
          'Signature request timed out. Open your wallet and approve the signature.'
        );
        if (typeof sig === 'string' && sig) return sig;
      }
    }

    // 1) Try ethers Signer (preferred when it works)
    const signer = await withTimeout(
      getSigner(),
      12_000,
      'Wallet signer not ready. Try disconnecting and reconnecting your wallet.'
    );

    try {
      return await withTimeout(
        signer.signMessage(message),
        45_000,
        'Signature request timed out. Open your wallet (MetaMask) and approve the signature.'
      );
    } catch (e: any) {
      throw new Error(prettyWalletError(e) || 'Signature failed. Please retry and approve the signature in your wallet.');
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin() {
    if (loading) return;
    setError("");
    setLoading(true);

    // If API routes are cold-starting or blocked, don't hang the UI forever.
    // We'll abort the whole attempt after a reasonable timeout.
    let timedOut = false;
    let timeoutId: number | null = null;

    // Cancel any previous in-flight attempt before starting a new one.
    try {
      abortRef.current?.abort();
    } catch {
      // ignore
    }
    const controller = new AbortController();
    abortRef.current = controller;

    timeoutId = window.setTimeout(() => {
      timedOut = true;
      try {
        controller.abort();
      } catch {
        // ignore
      }
    }, 30_000);

    try {
      if (!address) throw new Error('Connect a wallet first.');
      console.log('LOGIN: starting handleLogin', { address });

      // 1) Get nonce
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ address }),
        signal: controller.signal,
      });
      const nonceJson = await nonceRes.json().catch(() => ({} as any));
      if (!nonceRes.ok) {
        throw new Error(nonceJson?.message || nonceRes.statusText || "Failed to fetch nonce");
      }
      console.log('LOGIN: received nonce', nonceJson);
      const message = `Login nonce: ${nonceJson.nonce}`;

      // 2. Sign nonce with the currently connected wallet
      const signature = await signLoginMessage({ message, address });
      console.log('LOGIN: obtained signature', { signature });

      // 3) Verify signature (sets HttpOnly cookie)
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ address, signature }),
        signal: controller.signal,
      });
      const verifyJson = await verifyRes.json().catch(() => ({} as any));
      console.log('LOGIN: verify response', verifyRes.status, verifyJson);
      if (!verifyRes.ok) {
        throw new Error(verifyJson?.message || verifyRes.statusText || "Verification failed");
      }

      // Save wallet address for admin panel access
      window.localStorage.setItem("wallet", address || "");
      // Notify the app shell (Navbar, etc.) that auth state changed
      try {
        window.dispatchEvent(new Event('auth-changed'));
      } catch {
        // ignore
      }
      // On success, always land on /profile first (required), but preserve intent.
      const redirectTo = searchParams?.get('redirectTo') || '';
      const target = redirectTo
        ? `/profile?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/profile';
      router.push(target);
    } catch (err: any) {
      // If the user clicked Disconnect or otherwise cancelled, do not show an error.
      const isAbort =
        err?.name === 'AbortError' ||
        String(err?.message || '').toLowerCase().includes('aborted') ||
        String(err?.message || '').toLowerCase().includes('canceled') ||
        String(err?.message || '').toLowerCase().includes('cancelled');
      if (isAbort) {
        if (timedOut) {
          setError('Login timed out. Please try again.');
        } else {
          console.log('LOGIN: aborted');
        }
        return;
      }

      // Log the actual error (not the handler arguments) so we can diagnose failures
      try {
        console.error('LOGIN: sign-in flow failed', err);
      } catch (_) {
        console.error('LOGIN: sign-in flow failed (unable to stringify error)');
      }
      const msg = err?.message || 'Login failed. Check console/network for details.';
      setError(String(msg));
    } finally {
      if (timeoutId != null) {
        try {
          window.clearTimeout(timeoutId);
        } catch {
          // ignore
        }
      }
      setLoading(false);
      // Clear controller if this attempt is the active one.
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  // Abort any in-flight verification if the user navigates away.
  useEffect(() => {
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900/80 rounded-2xl shadow-2xl p-8 border-2 border-blue-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white">Connect Your Wallet</h1>
          <p className="text-slate-200 mt-2">to access your Web3 profile</p>
        </div>
        {!isConnected ? (
          <div className="space-y-4">
            <WalletButtons onError={(e: unknown) => {
              const obj = e as Record<string, unknown>;
              const msg = typeof e === 'string' ? e : (obj && typeof obj.message === 'string') ? String(obj.message) : String(e);
              setError(msg);
            }} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center bg-gray-800/50 p-4 rounded-lg">
              <p className="text-green-400 font-semibold">Connected!</p>
              <p className="text-white text-sm truncate mt-1">{address}</p>
            </div>
            <button
              className="w-full btn-primary bg-gradient-to-r from-green-500 to-teal-500 hover:from-teal-500 hover:to-green-500 transition-all duration-200 transform hover:scale-105 py-3 font-bold"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Sign In to Verify"}
            </button>
            <button
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              onClick={async () => {
                try {
                  try {
                    abortRef.current?.abort();
                    abortRef.current = null;
                  } catch {
                    // ignore
                  }
                  setLoading(false);
                  setError("");
                  await disconnect();
                  window.localStorage.removeItem('wallet');
                } catch (e) {
                  console.error('DISCONNECT: failed', e);
                  setError(String((e as any)?.message || 'Failed to disconnect'));
                }
              }}
            >
              Disconnect
            </button>
          </div>
        )}
        {error && <div className="text-red-400 text-center mt-4">{error}</div>}
      </div>
    </div>
  );
}
