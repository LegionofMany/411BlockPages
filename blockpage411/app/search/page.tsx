
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function SearchPage() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError("Invalid Ethereum address");
      return;
    }
    setError("");
    router.push(`/wallet/${address}`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
  <Navbar variant="search" />
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-gray-200 p-10 w-full max-w-md flex flex-col items-center animate-fade-in">
        {/* Icon and Title */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 shadow-xl border-4 border-gray-900">
            <span className="text-white text-3xl select-none">🔍</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Search Wallet</h1>
          <p className="text-gray-400 text-sm font-medium text-center max-w-xs">Enter an Ethereum wallet address to view its reputation, flags, ratings, and transaction history.</p>
        </div>
        <form onSubmit={handleSearch} className="w-full flex flex-col items-center gap-3">
          <div className="w-full flex items-center bg-gray-100 border-2 border-blue-500 rounded-full shadow-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
            <span className="text-blue-500 text-xl mr-2">🔎</span>
            <input
              className="flex-1 bg-transparent outline-none text-gray-900 font-mono text-base placeholder-gray-400 px-2"
              placeholder="e.g. 0x1234...abcd"
              value={address}
              onChange={e => setAddress(e.target.value)}
              autoFocus
              spellCheck={false}
              maxLength={42}
            />
            <button
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-full shadow transition-all duration-150 text-base"
              type="submit"
            >
              Search
            </button>
          </div>
        </form>
        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
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
    </div>
  );
}
