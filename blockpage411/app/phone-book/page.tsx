"use client";

import React from 'react';
import Link from 'next/link';
import DiscordCommunitySection from '../components/DiscordCommunitySection';

type Entry = {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
  udDomain: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
  phoneApps: string[];
  updatedAt: string | null;
};

type ApiPayload = {
  page: number;
  limit: number;
  total: number;
  results: Entry[];
  resolvedAddress: string | null;
};

function short(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export default function PhoneBookPage() {
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<ApiPayload | null>(null);

  async function load(nextPage: number, nextQ: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set('q', nextQ.trim());
      params.set('page', String(nextPage));
      params.set('limit', '20');
      const res = await fetch(`/api/phone-book?${params.toString()}`, { cache: 'no-store' });
      const json = (await res.json()) as ApiPayload;
      if (!res.ok) {
        setError((json as any)?.message || 'Failed to load directory');
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError('Failed to load directory');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(1, '');
  }, []);

  // Debounced search
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      load(1, q);
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const results = data?.results || [];
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const maxPage = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
        <div className="flex-1 w-full">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold" style={{ color: '#fefce8' }}>Phone Book</h1>
            <p className="text-sm text-slate-300 mt-1">
              A directory of opt-in profiles. Search by name, address, UD, socials, or phone apps.
            </p>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (address, name, UD, @handle, WhatsApp…)"
              className="w-full rounded-full bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              inputMode="search"
            />
            <button
              type="button"
              onClick={() => {
                setQ('');
                setPage(1);
                load(1, '');
              }}
              className="rounded-full border border-slate-700 bg-black/30 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-black/40"
            >
              Clear
            </button>
          </div>

          {error ? <div className="text-sm text-red-400 mb-3">{error}</div> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && results.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-black/40 p-4">
                  <div className="h-10 w-10 rounded-full bg-slate-800" />
                  <div className="mt-3 h-4 w-2/3 bg-slate-800 rounded" />
                  <div className="mt-2 h-3 w-full bg-slate-800 rounded" />
                </div>
              ))
            ) : results.length === 0 ? (
              <div className="text-sm text-slate-300">No results.</div>
            ) : (
              results.map((p) => (
                <Link
                  key={p.address}
                  href={`/wallet/ethereum/${encodeURIComponent(p.address)}`}
                  className="rounded-2xl border border-slate-800 bg-black/40 p-4 hover:bg-black/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatarUrl || '/default-avatar.png'}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">
                        {p.displayName || p.udDomain || short(p.address)}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {p.udDomain ? `${p.udDomain} · ` : ''}{short(p.address)}
                      </div>
                    </div>
                  </div>

                  {p.bio ? (
                    <div className="mt-3 text-xs text-slate-300 line-clamp-3">{p.bio}</div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    {p.twitter ? <span className="rounded-full border border-slate-700 px-2 py-0.5">X: {p.twitter}</span> : null}
                    {p.telegram ? <span className="rounded-full border border-slate-700 px-2 py-0.5">TG: {p.telegram}</span> : null}
                    {p.discord ? <span className="rounded-full border border-slate-700 px-2 py-0.5">Discord</span> : null}
                    {p.phoneApps?.length ? <span className="rounded-full border border-slate-700 px-2 py-0.5">{p.phoneApps.slice(0, 2).join(', ')}</span> : null}
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {total ? `Showing page ${page} of ${maxPage} (${total} profiles)` : '—'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  setPage(next);
                  load(next, q);
                }}
                className="rounded-full border border-slate-700 bg-black/30 px-3 py-2 text-xs font-semibold text-slate-100 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= maxPage || loading}
                onClick={() => {
                  const next = Math.min(maxPage, page + 1);
                  setPage(next);
                  load(next, q);
                }}
                className="rounded-full border border-slate-700 bg-black/30 px-3 py-2 text-xs font-semibold text-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <aside className="w-full md:w-[22rem] md:pt-10">
          <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
            <DiscordCommunitySection compact />
            <div className="mt-4 text-xs text-slate-400">
              Want to appear here? Enable “List me in the Phone Book” in your profile settings.
            </div>
            <div className="mt-3">
              <Link
                href="/profile/edit#phone-book-listing"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                style={{ backgroundColor: '#10b981', color: '#020617', textDecoration: 'none' }}
              >
                Manage Phone Book listing
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
