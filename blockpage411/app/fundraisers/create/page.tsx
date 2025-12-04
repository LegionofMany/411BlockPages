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
  const [walletAddress, setWalletAddress] = useState<string>(typeof profile?.address === 'string' ? profile.address : '');
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
      <main
        className="max-w-3xl mx-auto p-6 pt-6"
        style={{ maxWidth: "900px", marginLeft: "auto", marginRight: "auto" }}
      >
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-cyan-300 hover:underline">← Back</button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Create Fundraiser</h1>
        <form
          onSubmit={submit}
          className="space-y-4"
          style={{
            borderRadius: "1.5rem",
            padding: "1.5rem 1.75rem",
            background:
              "radial-gradient(circle at top, rgba(34,197,94,0.78) 0%, rgba(15,23,42,0.24) 42%, rgba(0,0,0,1) 100%)",
            boxShadow: "0 26px 72px rgba(0,0,0,0.96)",
            border: "1px solid rgba(15,23,42,0.9)",
          }}
        >
          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Fundraiser title"
            className="w-full text-sm sm:text-base"
            style={{
              padding: "0.7rem 1rem",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.8)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 35%, rgba(2,6,23,1) 100%)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.9)",
              color: "#f9fafb",
              caretColor: "#22c55e",
            }}
          />
          <textarea
            value={description}
            onChange={e=>setDescription(e.target.value)}
            placeholder="Tell supporters why this fundraiser matters, what the funds will be used for, and any milestones."
            className="w-full text-sm sm:text-base"
            rows={4}
            style={{
              padding: "0.8rem 1rem",
              borderRadius: "1.25rem",
              border: "1px solid rgba(148,163,184,0.8)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 40%, rgba(2,6,23,1) 100%)",
              resize: "vertical",
              color: "#f9fafb",
              caretColor: "#22c55e",
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={target}
              onChange={e=>setTarget(e.target.value)}
              placeholder="Target amount (e.g. 1.5)"
              className="w-full text-sm sm:text-base"
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "999px",
                border: "1px solid rgba(52,211,153,0.8)",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 35%, rgba(2,6,23,1) 100%)",
                color: "#f9fafb",
                caretColor: "#22c55e",
              }}
            />
            <div className="flex items-center gap-2">
              <input
                value={durationDays}
                onChange={e=>setDurationDays(e.target.value)}
                className="w-24 text-sm sm:text-base"
                style={{
                  padding: "0.7rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.8)",
                  background:
                    "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 35%, rgba(2,6,23,1) 100%)",
                  color: "#f9fafb",
                  caretColor: "#22c55e",
                }}
              />
              <span className="text-slate-300 text-xs sm:text-sm">days (default 90)</span>
            </div>
          </div>
          <input
            value={walletAddress}
            onChange={e=>setWalletAddress(e.target.value)}
            placeholder="Wallet address to receive funds"
            className="w-full text-sm sm:text-base"
            style={{
              padding: "0.7rem 1rem",
              borderRadius: "999px",
              border: "1px solid rgba(96,165,250,0.85)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 35%, rgba(2,6,23,1) 100%)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.9)",
              color: "#f9fafb",
              caretColor: "#22c55e",
            }}
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              disabled={loadingSubmit}
              className="text-sm sm:text-base font-semibold"
              style={{
                padding: "0.7rem 1.4rem",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(251,191,36,0.98) 0%, rgba(245,158,11,0.98) 45%, rgba(59,130,246,0.96) 100%)",
                color: "#020617",
                boxShadow: "0 18px 40px rgba(251,191,36,0.45)",
                opacity: loadingSubmit ? 0.7 : 1,
              }}
            >
              {loadingSubmit ? 'Creating…' : 'Create Fundraiser'}
            </button>
            <button
              type="button"
              onClick={()=>router.push('/fundraisers')}
              className="text-sm sm:text-base font-medium text-slate-200"
              style={{
                padding: "0.7rem 1.3rem",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.7)",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.94) 40%, rgba(2,6,23,0.98) 100%)",
              }}
            >
              Cancel
            </button>
          </div>
          {loading && <div className="text-sm text-slate-400 mt-2">Checking account...</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
