"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  autoFocus?: boolean;
};

export default function WalletSearchBar({
  className,
  inputClassName,
  placeholder = 'Search wallet (address, ENS, Base name, or UD)',
  size = 'md',
  autoFocus,
}: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const height = size === 'sm' ? 'h-10' : 'h-12';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = q.trim();
    if (!next) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/resolve-wallet?q=${encodeURIComponent(next)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.message || 'Unable to resolve wallet input');
      }
      const j = await res.json();
      const address: string | undefined = j?.address;
      if (!address) throw new Error('No address returned');

      router.push(`/wallet/${encodeURIComponent(address)}`);
    } catch (err: any) {
      setError(String(err?.message || 'Search failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Wallet search"
      className={className || ''}
    >
      <div className={`flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 ${height} shadow-[0_12px_30px_rgba(0,0,0,0.55)]`}>
        <span aria-hidden="true" className="text-slate-300">🔎</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-500 text-slate-100 ${inputClassName || ''}`}
          placeholder={placeholder}
          inputMode="text"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-300"
        >
          {loading ? 'Searching…' : 'Go'}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-rose-300">{error}</div>}
    </form>
  );
}
