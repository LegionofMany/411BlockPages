
"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WalletProfile() {
  const params = useParams();
  const address = typeof params?.address === 'string' ? params.address : Array.isArray(params?.address) ? params.address[0] : '';
  const { data, error, isLoading, mutate } = useSWR(
    address ? `/api/wallet/${address}` : null,
    fetcher
  );
  const [flagReason, setFlagReason] = useState("");
  const [flagMsg, setFlagMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [rateMsg, setRateMsg] = useState("");

  async function handleFlag() {
    setFlagMsg("");
    try {
      await axios.post("/api/flags", { address, reason: flagReason });
      setFlagMsg("Flag submitted");
      setFlagReason("");
      mutate();
    } catch (e: any) {
      setFlagMsg(e?.response?.data?.message || "Error");
    }
  }

  async function handleRate() {
    setRateMsg("");
    try {
      await axios.post("/api/ratings", { address, score: rating });
      setRateMsg("Rating submitted");
      setRating(0);
      mutate();
    } catch (e: any) {
      setRateMsg(e?.response?.data?.message || "Error");
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading wallet</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
  <Navbar variant="wallet" />
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 flex flex-col gap-8 animate-fade-in">
        {/* Wallet Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 break-all sm:break-words truncate">
              <span className="text-blue-600 text-3xl">👛</span>
              <span className="truncate block max-w-full" title={data.address}>{data.address}</span>
            </h1>
            <div className="text-gray-500 text-sm mt-1 whitespace-normal break-words">Ethereum Wallet Profile</div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-yellow-500 text-lg font-bold flex items-center gap-1">
              ★ {data.avgRating?.toFixed(2) || 0}
            </span>
            <span className="text-xs text-gray-400">Avg. Rating</span>
          </div>
        </div>

        {/* Flags Section */}
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-red-600 flex items-center gap-2 mb-1">
            <span>🚩</span> Flags
          </h2>
          <ul className="mb-2 space-y-1">
            {data.flags?.length ? data.flags.map((f: any, i: number) => (
              <li key={i} className="text-sm text-gray-700 bg-red-50 border-l-4 border-red-400 px-3 py-1 rounded">
                <span className="font-medium text-red-700">{f.reason}</span> <span className="text-gray-400">by {f.user.slice(0, 8)}... on {new Date(f.date).toISOString().slice(0,10)}</span>
              </li>
            )) : <li className="text-xs text-gray-400">No flags for this wallet.</li>}
          </ul>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              className="flex-1 px-3 py-2 rounded-lg text-gray-900 bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Flag reason (e.g. scam, spam)"
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
            />
            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition-all duration-150" onClick={handleFlag}>
              Flag
            </button>
          </div>
          {flagMsg && <div className="text-xs mt-1 text-red-500">{flagMsg}</div>}
        </div>

        {/* Rating Section */}
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-yellow-600 flex items-center gap-2 mb-1">
            <span>⭐</span> Rate this wallet
          </h2>
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                className={`text-3xl focus:outline-none transition-colors ${rating >= n ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500`}
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              >★</button>
            ))}
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition-all duration-150 w-fit" onClick={handleRate}>
            Submit Rating
          </button>
          {rateMsg && <div className="text-xs mt-1 text-green-600">{rateMsg}</div>}
        </div>

        {/* Transactions Section */}
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg text-blue-700 flex items-center gap-2 mb-1">
            <span>📄</span> Recent Transactions
          </h2>
          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50 rounded-lg border border-gray-100">
            {data.transactions?.length ? data.transactions.slice(0, 10).map((tx: any, i: number) => (
              <li key={i} className="text-xs px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-mono text-gray-700">Hash: {tx.hash.slice(0, 10)}...</span>
                <span className="text-gray-400">From: {tx.from.slice(0, 8)}...</span>
                <span className="text-gray-400">To: {tx.to.slice(0, 8)}...</span>
                <span className="text-blue-700 font-semibold">{Number(tx.value) / 1e18} ETH</span>
              </li>
            )) : <li className="text-xs text-gray-400 px-3 py-2">No transactions found.</li>}
          </ul>
        </div>
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
