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
    axios.get("/api/me").then(() => {
      router.replace("/search");
    }).catch(() => {});
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
      await axios.post("/api/auth/verify", { address, signature });
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
    <div className="min-h-screen bg-blockchain-gradient flex items-center justify-center">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Connect your wallet</h1>
          <p className="text-cyan-100">to continue to Blockpage411</p>
        </div>
        {!isConnected ? (
          <div className="space-y-4">
            <button
              className="w-full btn-primary flex items-center justify-center gap-3"
              onClick={() => connect({ connector: injected() })}
            >
              <span className="text-xl">🦊</span>
              <span>Connect MetaMask</span>
            </button>
            <button
              className="w-full btn-primary flex items-center justify-center gap-3"
              onClick={() => connect({ connector: walletConnect({ projectId: "demo" }) })}
            >
              <span className="text-xl">🔗</span>
              <span>WalletConnect</span>
            </button>
            <button
              className="w-full btn-primary flex items-center justify-center gap-3"
              onClick={() => connect({ connector: coinbaseWallet() })}
            >
              <span className="text-xl">💼</span>
              <span>Coinbase Wallet</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-green-400 font-semibold">Connected: {address}</div>
            <button
              className="w-full btn-primary"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
            <button
              className="w-full btn-primary"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing..." : "Sign In"}
            </button>
          </div>
        )}
        {error && <div className="text-red-400 text-center mt-4">{error}</div>}
      </div>
    </div>
  );
}
