"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { BrowserProvider } from "ethers";
import dynamic from 'next/dynamic';
const WalletConnectButtons = dynamic(() => import('./WalletConnectButtons'));
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Check if user is already authenticated.
    // The session token cookie is HttpOnly, so we can't reliably read it from JS.
    // Use a cheap server-side status endpoint that always returns 200.
    axios
      .get('/api/auth/status', { withCredentials: true })
      .then((res) => {
        if (res?.data?.authenticated) router.replace('/search');
      })
      .catch(() => {
        // ignore
      });
  }, [router]);
  const { address, isConnected } = useAccount();
  const { disconnect, disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      console.log('LOGIN: starting handleLogin', { address });
      // 1. Get nonce
      const { data } = await axios.post("/api/auth/nonce", { address });
      console.log('LOGIN: received nonce', data);
      const message = `Login nonce: ${data.nonce}`;
      // 2. Sign nonce — try wagmi first, fall back to ethers provider if connector is missing methods
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (signErr: any) {
        // Some connectors (third-party SDKs) do not implement connector.getChainId and
        // wagmi may throw a TypeError referencing that. Fall back to the injected provider
        // via ethers if available.
        const msg = String(signErr?.message || signErr);
        if (msg.includes('getChainId is not a function') || msg.includes('connector.getChainId')) {
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = new BrowserProvider((window as any).ethereum as any);
            const signer = await provider.getSigner();
            signature = await signer.signMessage(message);
          } else {
            throw signErr;
          }
        } else {
          throw signErr;
        }
      }
      console.log('LOGIN: obtained signature', { signature });
      // 3. Verify signature
      const verifyRes = await axios.post("/api/auth/verify", { address, signature }, { withCredentials: true });
      console.log('LOGIN: verify response', verifyRes.status, verifyRes.data);
      // Save wallet address for admin panel access
  window.localStorage.setItem("wallet", address || "");
      // On success, redirect or update UI as needed
      router.push("/search");
    } catch (err: any) {
      // Log the actual error (not the handler arguments) so we can diagnose failures
      try {
        console.error('LOGIN: sign-in flow failed', err);
      } catch (_) {
        console.error('LOGIN: sign-in flow failed (unable to stringify error)');
      }
      // Prefer useful messages when available (Axios / wallet errors may include details)
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Check console/network for details.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

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
            <WalletConnectButtons onError={(e: unknown) => {
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
                  await disconnectAsync?.();
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
