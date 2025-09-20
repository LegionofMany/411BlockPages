"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

import { Flag, Transaction } from "../../../../lib/types";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WalletProfile() {
  const params = useParams();
  const chain = typeof params?.chain === 'string' ? params.chain : Array.isArray(params?.chain) ? params.chain[0] : '';
  const address = typeof params?.address === 'string' ? params.address : Array.isArray(params?.address) ? params.address[0] : '';
  const { data, error, isLoading, mutate } = useSWR(
    chain && address ? `/api/wallet/${chain}/${address}` : null,
    fetcher
  );
  const [flagReason, setFlagReason] = useState("");
  const [flagMsg, setFlagMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [rateMsg, setRateMsg] = useState("");

  async function handleFlag() {
    setFlagMsg("");
    try {
      await axios.post("/api/flags", { address, chain, reason: flagReason });
      setFlagMsg("Flag submitted");
      setFlagReason("");
      mutate();
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const errorResponse = e.response as { data?: { message?: string } };
        setFlagMsg(errorResponse.data?.message || "Error");
      } else {
        setFlagMsg("An unexpected error occurred.");
      }
    }
  }

  async function handleRate() {
    setRateMsg("");
    try {
      await axios.post("/api/ratings", { address, chain, score: rating });
      setRateMsg("Rating submitted");
      setRating(0);
      mutate();
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const errorResponse = e.response as { data?: { message?: string } };
        setRateMsg(errorResponse.data?.message || "Error");
      } else {
        setRateMsg("An unexpected error occurred.");
      }
    }
  }

  if (isLoading) return <div className="p-8 text-center text-lg text-cyan-100" aria-busy="true">Loading wallet profile...</div>;
  if (error) return <div className="p-8 text-center text-red-400 font-semibold" role="alert">Error loading wallet</div>;
  if (!data) return <div className="p-8 text-center text-cyan-200">No wallet data found.</div>;

  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col">
      <Navbar variant="wallet" />
      <main className="flex-1 flex items-center justify-center py-4 px-2 sm:px-0">
        <section className="w-full max-w-2xl card flex flex-col gap-8 animate-fade-in">
          {/* Wallet Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-200 pb-4 w-full">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 break-all sm:break-words truncate" aria-label="Wallet address">
                <span className="text-blue-300 text-3xl" aria-hidden="true">👛</span>
                <span className="truncate block max-w-full" title={data.address}>{data.address}</span>
              </h1>
              <div className="text-cyan-100 text-sm mt-1 whitespace-normal break-words">
                {data.chain ? `${data.chain.charAt(0).toUpperCase() + data.chain.slice(1)} Wallet Profile` : "Wallet Profile"}
              </div>
              {data.ens && (
                <div className="text-blue-200 text-xs mt-1" aria-label="ENS name">ENS: {data.ens}</div>
              )}
              {typeof data.nftCount === 'number' && data.chain === 'ethereum' && (
                <div className="text-purple-300 text-xs mt-1" aria-label="NFT count">NFTs: {data.nftCount}</div>
              )}
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="badge bg-yellow-500 text-lg font-bold flex items-center gap-1" aria-label="Average rating">
                ★ {data.avgRating?.toFixed(2) || 0}
              </span>
              <span className="text-xs text-cyan-100">Avg. Rating</span>
            </div>
          </header>

          {/* Flags Section */}
          <section className="flex flex-col gap-2" aria-labelledby="flags-heading">
            <h2 id="flags-heading" className="font-semibold text-lg text-red-400 flex items-center gap-2 mb-1">
              <span aria-hidden="true">🚩</span> Flags
            </h2>
            <ul className="mb-2 space-y-1" aria-live="polite">
              {data.flags?.length ? data.flags.map((f: Flag, i: number) => (
                <li key={i} className="text-sm text-red-200 bg-red-900/40 border-l-4 border-red-400 px-3 py-1 rounded">
                  <span className="font-medium text-red-300">{f.reason}</span> <span className="text-cyan-100">by {f.user.slice(0, 8)}... on {new Date(f.date).toISOString().slice(0,10)}</span>
                </li>
              )) : <li className="text-xs text-cyan-200">No flags for this wallet.</li>}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                className="flex-1 px-3 py-2 rounded-lg text-white bg-gray-900 border border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Flag reason (e.g. scam, spam)"
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                aria-label="Flag reason"
              />
              <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={handleFlag}>
                Flag
              </button>
            </div>
            {flagMsg && <div className="text-xs mt-1 text-red-400">{flagMsg}</div>}
          </section>

          {/* Rating Section */}
          <section className="flex flex-col gap-2" aria-labelledby="rating-heading">
            <h2 id="rating-heading" className="font-semibold text-lg text-yellow-400 flex items-center gap-2 mb-1">
              <span aria-hidden="true">⭐</span> Rate this wallet
            </h2>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={`text-3xl focus:outline-none transition-colors ${rating >= n ? 'text-yellow-400' : 'text-cyan-100'} hover:text-yellow-500`}
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                  tabIndex={0}
                >★</button>
              ))}
            </div>
            <button className="btn-primary bg-green-600 hover:bg-green-700 w-fit" onClick={handleRate}>
              Submit Rating
            </button>
            {rateMsg && <div className="text-xs mt-1 text-green-400">{rateMsg}</div>}
          </section>

          {/* Transactions Section */}
          <section className="flex flex-col gap-2" aria-labelledby="tx-heading">
            <h2 id="tx-heading" className="font-semibold text-lg text-blue-300 flex items-center gap-2 mb-1">
              <span aria-hidden="true">📄</span> Recent Transactions
            </h2>
            <ul className="max-h-56 overflow-y-auto divide-y divide-blue-200 bg-gray-900/60 rounded-lg border border-blue-200" aria-live="polite">
              {data.transactions?.length ? data.transactions.slice(0, 10).map((tx: Transaction, i: number) => (
                <li key={i} className="text-xs px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 text-cyan-100">
                  {data.chain === 'bitcoin' ? (
                    <>
                      <span className="font-mono text-cyan-100">Txid: {tx.txid?.slice(0, 10)}...</span>
                      <span className="text-cyan-200">Block: {tx.status?.block_height || 'N/A'}</span>
                      <span className="text-blue-300 font-semibold">{tx.vout?.length || 0} outputs</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-cyan-100">Hash: {tx.hash?.slice(0, 10)}...</span>
                      <span className="text-cyan-200">From: {tx.from?.slice(0, 8)}...</span>
                      <span className="text-cyan-200">To: {tx.to?.slice(0, 8)}...</span>
                      <span className="text-blue-300 font-semibold">{Number(tx.value) / 1e18} {data.chain === 'polygon' ? 'MATIC' : data.chain === 'bsc' ? 'BNB' : 'ETH'}</span>
                    </>
                  )}
                </li>
              )) : <li className="text-xs text-cyan-200 px-3 py-2">No transactions found.</li>}
            </ul>
          </section>
        </section>
      </main>
      {/* Animation keyframes */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 640px) {
          .max-w-2xl { max-width: 100vw; border-radius: 0; box-shadow: none; }
          .p-8 { padding: 1rem !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
