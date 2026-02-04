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
  const inFlightRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prefetchedNonce, setPrefetchedNonce] = useState<string | null>(null);
  const [prefetchedAt, setPrefetchedAt] = useState<number>(0);
  const [nonceWarm, setNonceWarm] = useState(false);
  const [stage, setStage] = useState<'idle' | 'nonce' | 'sign' | 'verify'>('idle');

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

  async function fetchNonce(opts: { address: string; signal?: AbortSignal }): Promise<string> {
    const { address, signal } = opts;
    const nonceRes = await withTimeout(
      fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ address }),
        signal,
      }),
      60_000,
      'Nonce request timed out. Please retry.'
    );
    const nonceJson = await nonceRes.json().catch(() => ({} as any));
    if (!nonceRes.ok) {
      throw new Error(nonceJson?.message || nonceRes.statusText || "Failed to fetch nonce");
    }
    const nonce = String(nonceJson?.nonce || '');
    if (!nonce) throw new Error('Nonce missing from server response');
    return nonce;
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
          90_000,
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
          90_000,
          'Signature request timed out. Open your wallet (MetaMask) and approve the signature.'
        );
        if (typeof sig === 'string' && sig) return sig;
      } catch {
        // Some wallets flip param order: [address, data]
        const sig = await withTimeout(
          Promise.resolve(req({ method: 'personal_sign', params: [addr, msgHex] })),
          90_000,
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
        90_000,
        'Signature request timed out. Open your wallet (MetaMask) and approve the signature.'
      );
    } catch (e: any) {
      throw new Error(prettyWalletError(e) || 'Signature failed. Please retry and approve the signature in your wallet.');
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Warm up the nonce route as soon as the wallet is connected.
  // This avoids a long await (dev compile/cold route) between the click and the
  // signature request, which can prevent some wallets from surfacing the prompt.
  useEffect(() => {
    if (!mounted) return;
    if (!isConnected || !address) {
      setPrefetchedNonce(null);
      setPrefetchedAt(0);
      setNonceWarm(false);
      return;
    }

    // Only prefetch if we don't have a fresh nonce (nonce cookie is 5m).
    const ageMs = Date.now() - (prefetchedAt || 0);
    if (prefetchedNonce && ageMs < 4 * 60 * 1000) {
      setNonceWarm(true);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setNonceWarm(false);

    (async () => {
      try {
        const nonce = await fetchNonce({ address, signal: controller.signal });
        if (cancelled) return;
        setPrefetchedNonce(nonce);
        setPrefetchedAt(Date.now());
        setNonceWarm(true);
      } catch (e) {
        if (cancelled) return;
        // Non-fatal; we'll fetch on click.
        console.warn('LOGIN: nonce prefetch failed', e);
      }
    })();

    return () => {
      cancelled = true;
      try {
        controller.abort();
      } catch {
        // ignore
      }
    };
  }, [address, isConnected, mounted, prefetchedAt, prefetchedNonce]);

  async function handleLogin() {
    // React state updates are async; use a ref guard to prevent double clicks from
    // triggering multiple concurrent signature requests.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (loading) {
      inFlightRef.current = false;
      return;
    }
    setError("");
    setLoading(true);
    setStage('nonce');

    // Cancel any previous in-flight attempt before starting a new one.
    try {
      abortRef.current?.abort();
    } catch {
      // ignore
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!address) throw new Error('Connect a wallet first.');
      console.log('LOGIN: starting handleLogin', { address });

      // 1) Use prefetched nonce if fresh; otherwise fetch now.
      let nonceToUse: string | null = null;
      const ageMs = Date.now() - (prefetchedAt || 0);
      if (prefetchedNonce && ageMs < 4 * 60 * 1000) {
        nonceToUse = prefetchedNonce;
        console.log('LOGIN: using prefetched nonce');
      } else {
        const fetched = await fetchNonce({ address, signal: controller.signal });
        nonceToUse = fetched;
        setPrefetchedNonce(fetched);
        setPrefetchedAt(Date.now());
        console.log('LOGIN: received nonce', { nonce: fetched });
      }

      setStage('sign');

      const message = `Login nonce: ${nonceToUse}`;

      // 2. Sign nonce with the currently connected wallet
      const signature = await signLoginMessage({ message, address });
      console.log('LOGIN: obtained signature', { signature });

      setStage('verify');

      // 3) Verify signature (sets HttpOnly cookie)
      const verifyRes = await withTimeout(
        fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ address, signature }),
          signal: controller.signal,
        }),
        20_000,
        'Verify request timed out. Please retry.'
      );
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
        console.log('LOGIN: aborted');
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
      setLoading(false);
      setStage('idle');
      inFlightRef.current = false;
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

  const eipProvider = getBestEip1193Provider();
  const canAttemptSignIn = Boolean(address && isConnected && eipProvider);
  const stageText =
    stage === 'nonce'
      ? 'Preparing sign-in…'
      : stage === 'sign'
        ? 'Waiting for wallet signature… (open MetaMask)'
        : stage === 'verify'
          ? 'Verifying signature…'
          : nonceWarm
            ? 'Ready to sign.'
            : 'Preparing sign-in…';

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
              disabled={loading || !canAttemptSignIn}
            >
              {loading ? "Verifying..." : "Sign In to Verify"}
            </button>
            {!loading && !canAttemptSignIn && (
              <div className="text-xs text-slate-300 text-center">
                Wallet is still initializing. If this persists, disconnect and reconnect.
              </div>
            )}
            {!loading && canAttemptSignIn && (
              <div className="text-xs text-slate-300 text-center">
                {stageText}
              </div>
            )}
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
