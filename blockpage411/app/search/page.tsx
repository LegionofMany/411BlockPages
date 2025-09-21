
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";



export default function SearchPage() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Validate address format for each chain
    if (chain === "bitcoin") {
      if (
        !(
          /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || // Legacy/P2SH
          /^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,71}$/.test(address) // Bech32
        )
      ) {
        setError("Invalid Bitcoin address");
        return;
      }
    } else if (chain === "solana") {
      if (!/^([1-9A-HJ-NP-Za-km-z]{32,44})$/.test(address)) {
        setError("Invalid Solana address");
        return;
      }
    } else if (chain === "tron") {
      if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
        setError("Invalid Tron address");
        return;
      }
    } else if (chain === "xrp") {
      // XRP classic address: starts with r, 25-35 chars, base58
      if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)) {
        setError("Invalid XRP address");
        return;
      }
    } else {
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        setError("Invalid EVM address");
        return;
      }
    }
    setError("");
    router.push(`/wallet/${chain}/${address}`);
  }

  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col">
      <Navbar variant="search" />
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 card w-full max-w-md flex flex-col items-center animate-fade-in">
          {/* Icon and Title */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 shadow-xl border-4 border-blue-400">
              <span className="text-white text-3xl select-none">🔍</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Search Wallet</h1>
            <p className="text-cyan-100 text-sm font-medium text-center max-w-xs">
              Enter a wallet address and select a chain (Ethereum, BSC, Polygon, Bitcoin, Solana, or Tron) to view its reputation, flags, ratings, and transaction history.
            </p>
          </div>
          <form onSubmit={handleSearch} className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex flex-col gap-2">
              <label className="text-cyan-100 font-semibold mb-1" htmlFor="chain">Select Chain</label>
              <select
              id="chain"
              className="w-full px-4 py-2 rounded-lg border border-blue-400 bg-white text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={chain}
              onChange={e => setChain(e.target.value)}
            >
              <option value="ethereum">Ethereum</option>
              <option value="bsc">Binance Smart Chain</option>
              <option value="polygon">Polygon</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="solana">Solana</option>
              <option value="tron">Tron</option>
              <option value="xrp">XRP</option>
            </select>
          </div>
          <div className="w-full flex items-center bg-gray-100 border-2 border-blue-500 rounded-full shadow-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
            <span className="text-blue-500 text-xl mr-2">🔎</span>
            <input
              className="flex-1 bg-transparent outline-none text-white font-mono text-base placeholder-gray-400 px-2"
              placeholder={
                chain === "bitcoin"
                  ? "e.g. 1A1zP1... (BTC address)"
                  : chain === "bsc"
                  ? "e.g. 0x1234...abcd (BSC address)"
                  : chain === "polygon"
                  ? "e.g. 0x1234...abcd (Polygon address)"
                  : chain === "solana"
                  ? "e.g. 4Nd1m... (Solana address)"
                  : chain === "tron"
                  ? "e.g. TQJt... (Tron address)"
                  : chain === "xrp"
                  ? "e.g. rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv (XRP address)"
                  : "e.g. 0x1234...abcd (Ethereum address)"
              }
              value={address}
              onChange={e => setAddress(e.target.value)}
              autoFocus
              spellCheck={false}
              maxLength={44}
            />
            <button
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-full shadow transition-all duration-150 text-base"
              type="submit"
            >
              Search
            </button>
          </div>
        </form>
        {error && (
          <div className="text-red-500 mt-4 text-center">
            {chain === "bitcoin"
              ? "Invalid Bitcoin address. Please enter a valid BTC address."
              : chain === "solana"
              ? "Invalid Solana address. Please enter a valid Solana address."
              : chain === "tron"
              ? "Invalid Tron address. Please enter a valid Tron address."
              : chain === "xrp"
              ? "Invalid XRP address. Please enter a valid XRP address."
              : "Invalid EVM address. Please enter a valid Ethereum, BSC, or Polygon address (0x...)."}
          </div>
        )}
        </div>
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
      <Footer />
    </div>
  );
}
