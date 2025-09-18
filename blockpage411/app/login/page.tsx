"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useSignMessage, useDisconnect } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import axios from "axios";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      // 1. Get nonce
      const { data } = await axios.post("/api/auth/nonce", { address });
      const message = `Login nonce: ${data.nonce}`;
      // 2. Sign nonce
      const signature = await signMessageAsync({ message });
      // 3. Verify signature
      await axios.post("/api/auth/verify", { address, signature });
      router.push("/search");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0f1a] overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <svg width="100%" height="100%" className="opacity-20" style={{position:'absolute',top:0,left:0}}>
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#334155" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      <div className="relative z-10 bg-gray-950/90 rounded-3xl shadow-2xl border border-gray-800 p-10 w-full max-w-md flex flex-col items-center animate-fade-in backdrop-blur-md">
        {/* Logo and Tagline */}
        <div className="mb-7 flex flex-col items-center">
          <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 shadow-xl border-4 border-gray-900">
            <span className="text-white text-4xl font-extrabold select-none tracking-tight drop-shadow">411</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Blockpage411 Login</h1>
          <p className="text-gray-400 text-sm font-medium text-center max-w-xs">Securely access the blockchain reputation network</p>
        </div>
        {!isConnected ? (
          <div className="w-full flex flex-col gap-4">
            <button
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-150 border border-blue-700/30"
              onClick={() => connect({ connector: injected() })}
            >
              <span>🦊</span> Connect MetaMask
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-300 text-gray-900 font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-150 border border-yellow-500/30"
              onClick={() => connect({ connector: coinbaseWallet({ appName: "Blockpage411" }) })}
            >
              <span>💰</span> Connect Coinbase Wallet
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-2 focus:ring-green-400 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-150 border border-green-600/30"
              onClick={() => connect({ connector: walletConnect({ projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' }) })}
            >
              <span>🔗</span> Connect WalletConnect
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4 items-center">
            <div className="mb-2 text-gray-300 text-sm">Connected: <span className="font-mono text-blue-400">{address}</span></div>
            <button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-2 focus:ring-green-400 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all duration-150 border border-green-600/30"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
            <button
              className="w-full bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 text-gray-200 font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-150 border border-gray-700/30"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
        )}
        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
      </div>
      {/* Animation keyframes */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
