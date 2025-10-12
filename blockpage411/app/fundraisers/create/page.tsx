"use client";
import React, { useState } from 'react';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';
import useProfile from '../../hooks/useProfile';

export default function CreateFundraiser() {
  const { profile, loading } = useProfile();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [walletAddress, setWalletAddress] = useState(profile?.address ?? '');
  const [durationDays, setDurationDays] = useState('90');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !target || !walletAddress) { setError('Title, target and wallet address are required'); return; }
    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/fundraisers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, target: Number(target), durationDays: Number(durationDays), walletAddress }) });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || 'Failed'); return; }
      router.push(`/wallet/${'eth'}/${walletAddress}`);
    } catch (err) {
      setError((err as Error)?.message ?? 'Network error');
    } finally { setLoadingSubmit(false); }
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto p-6 pt-6">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-cyan-300 hover:underline">← Back</button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Create Fundraiser</h1>
        <form onSubmit={submit} className="space-y-3 bg-slate-900 p-4 rounded border border-slate-800">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
          <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target amount (number)" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
          <input value={walletAddress} onChange={e=>setWalletAddress(e.target.value)} placeholder="Wallet address to receive funds" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
          <div className="flex gap-2">
            <input value={durationDays} onChange={e=>setDurationDays(e.target.value)} className="w-24 px-3 py-2 bg-gray-800 rounded text-white" />
            <span className="text-slate-400">days (default 90)</span>
          </div>
          {error && <div className="text-red-400">{error}</div>}
          <div className="flex gap-2">
            <button disabled={loadingSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded">{loadingSubmit ? 'Creating...' : 'Create Fundraiser'}</button>
            <button type="button" onClick={()=>router.push('/fundraisers')} className="px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
          </div>
          {loading && <div className="text-sm text-slate-400 mt-2">Checking account...</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
