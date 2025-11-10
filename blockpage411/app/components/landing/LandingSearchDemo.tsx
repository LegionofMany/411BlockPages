"use client";
import { useState } from 'react';

export default function LandingSearchDemo() {
  const [q, setQ] = useState('vitalik');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=3`);
      const js = await res.json();
      setResults(js.results || []);
    } catch (err) {
      console.error('search demo error', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <form onSubmit={search} className="flex gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search demo" className="flex-1 input bg-white/3 text-white" />
        <button className="btn-primary" type="submit">Search</button>
      </form>

      <div className="mt-4">
        {loading && <div className="text-slate-300">Searching...</div>}
        {!loading && results.length === 0 && <div className="text-slate-400">Try searching for a wallet address or ENS name.</div>}
        <ul className="mt-3 space-y-2">
          {results.map((r, i) => (
            <li key={i} className="p-3 rounded-lg bg-white/4">
              <div className="text-sm font-mono">{r.address || r.id || r.name}</div>
              <div className="text-xs text-slate-300">{r.summary || r.description || ''}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
