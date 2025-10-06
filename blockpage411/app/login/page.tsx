"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAccount, useConnect, useSignMessage, useDisconnect } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Check if user is already authenticated
    axios.get("/api/me", { withCredentials: true })
      .then(() => {
        router.replace("/search");
      })
      .catch((err) => {
        if (err.response && err.response.status !== 401) {
          // Only log unexpected errors
          console.warn("Unexpected /api/me error:", err);
        }
        // Do not redirect or show warning for 401 (not logged in yet)
      });
  }, [router]);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      await axios.post("/api/auth/verify", { address, signature }, { withCredentials: true });
      // Save wallet address for admin panel access
  window.localStorage.setItem("wallet", address || "");
      // On success, redirect or update UI as needed
      router.push("/search");
    } catch {
      setError("Login failed. Please try again.");
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
            <button
              className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 transform hover:scale-105 py-3"
              onClick={() => connect({ connector: injected() })}
            >
              <span className="text-2xl">🦊</span>
              <span className="font-bold">MetaMask</span>
            </button>
            <button
              className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-sky-500 hover:to-blue-500 transition-all duration-200 transform hover:scale-105 py-3"
              onClick={() => connect({ connector: walletConnect({ projectId: "demo" }) })}
            >
              <span className="text-2xl">🔗</span>
              <span className="font-bold">WalletConnect</span>
            </button>
            <button
              className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500 transition-all duration-200 transform hover:scale-105 py-3"
              onClick={() => connect({ connector: coinbaseWallet() })}
            >
              <span className="text-2xl">💼</span>
              <span className="font-bold">Coinbase Wallet</span>
            </button>
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
              onClick={() => disconnect()}
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
