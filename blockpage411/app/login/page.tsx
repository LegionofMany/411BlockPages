"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
const WalletButtons = dynamic(() => import('./WalletButtons'));
import { useRouter, useSearchParams } from "next/navigation";
import { useEvmWallet } from "../../components/EvmWalletProvider";


export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, disconnect, getSigner } = useEvmWallet();
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin() {
    setError("");
    setLoading(true);

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
      const signer = await getSigner();
      const signature = await signer.signMessage(message);
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
          <p className="text-cyan-200 mt-2">to access your Web3 profile</p>
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
