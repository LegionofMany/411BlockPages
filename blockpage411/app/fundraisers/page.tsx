"use client";
import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import useProfile from '../hooks/useProfile';
import { useRouter } from 'next/navigation';

export default function FundraisersPage() {
  // profile currently unused here; listing is public
  useProfile();
  const router = useRouter();
  const [walletFilter, setWalletFilter] = useState('');
  type Fundraiser = {
    title: string;
    description?: string;
    target?: number;
    raised?: number;
    walletAddress?: string;
    owner?: string;
    createdAt?: string | Date;
    expiresAt?: string | Date;
    active?: boolean;
  };
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!walletFilter) return;
    (async () => {
      setLoadingList(true);
      const resp = await fetch(`/api/fundraisers/${encodeURIComponent(walletFilter)}`);
      const data = await resp.json();
      setFundraisers(data.fundraisers || []);
      setLoadingList(false);
    })();
  }, [walletFilter]);

  return (
    <div className="min-h-screen">
      <main
        className="max-w-4xl mx-auto p-6 pt-6"
        style={{ maxWidth: "960px", marginLeft: "auto", marginRight: "auto" }}
      >
        <div className="mb-4">
          <button onClick={() => router.push('/')} className="text-sm text-cyan-300 hover:underline">← Return home</button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Fundraisers</h1>
          <div>
            <button onClick={()=>router.push('/fundraisers/create')} className="px-3 py-1 bg-emerald-600 text-white rounded">Create Fundraiser</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-slate-400 mr-2">Filter by wallet address</label>
          <input
            value={walletFilter}
            onChange={e=>setWalletFilter(e.target.value)}
            placeholder="wallet address"
            className="w-80 max-w-full text-sm"
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid rgba(45,212,191,0.65)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 40%, rgba(0,0,0,1) 100%)",
              boxShadow:
                "0 0 0 1px rgba(15,23,42,0.9), 0 12px 30px rgba(15,23,42,0.85)",
              color: "#f9fafb",
              caretColor: "#22c55e",
            }}
          />
        </div>

        {loadingList ? <div>Loading...</div> : (
          <div className="space-y-4">
            {fundraisers.length === 0 && <div className="text-slate-400">No fundraisers found for this address.</div>}
            {fundraisers.map((f, i) => (
              <div
                key={i}
                className="relative rounded-2xl p-[1px] overflow-hidden"
                style={{
                  background:
                    "radial-gradient(circle at top, rgba(34,197,94,0.70) 0%, rgba(15,23,42,0.18) 40%, rgba(0,0,0,1) 100%)",
                }}
              >
                <div
                  className="rounded-2xl p-4 sm:p-5"
                  style={{
                    backgroundColor: "rgba(3,7,18,0.96)",
                    boxShadow: "0 22px 60px rgba(0,0,0,0.9)",
                    border: "none",
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h2 className="font-semibold text-white text-base sm:text-lg">
                        {f.title}
                      </h2>
                      <div className="mt-1 text-xs sm:text-sm text-emerald-300">
                        Target: {f.target ?? 0} • Raised: {f.raised ?? 0}
                      </div>
                      <div className="mt-2 text-sm text-slate-200">
                        {f.description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
