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
      <main className="max-w-4xl mx-auto p-6 pt-6">
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
          <input value={walletFilter} onChange={e=>setWalletFilter(e.target.value)} className="px-3 py-2 bg-gray-800 rounded text-white w-80" placeholder="wallet address" />
        </div>

        {loadingList ? <div>Loading...</div> : (
          <div className="space-y-4">
            {fundraisers.length === 0 && <div className="text-slate-400">No fundraisers found for this address.</div>}
            {fundraisers.map((f, i) => (
              <div key={i} className="p-4 bg-slate-900 rounded border border-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-white">{f.title}</h2>
                    <div className="text-xs text-slate-400">Target: {f.target} • Raised: {f.raised}</div>
                    <div className="mt-2 text-slate-300">{f.description}</div>
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
