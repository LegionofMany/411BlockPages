import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import CharityGrid from '../../components/charities/CharityGrid';
import Navbar from '../../app/components/Navbar';
import Footer from '../../app/components/Footer';
import ThemeProvider from '../../app/components/ThemeProvider';

export default function CharitiesPage() {
  const [list, setList] = useState<Record<string, unknown>[] | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [total, setTotal] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    setList(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`/api/charities?${params.toString()}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const js = await res.json() as unknown;
      if (Array.isArray(js)) {
        setList(js as Record<string, unknown>[]);
        setTotal(null);
      } else {
        const obj = js as Record<string, unknown>;
        setList((obj.results as Record<string, unknown>[]) || []);
        if (typeof obj.total === 'number') setTotal(obj.total as number);
      }
    } catch (e: unknown) {
      const errMsg = e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'message') ? String((e as Record<string, unknown>)['message']) : String(e);
      setErr(errMsg);
      setList([]);
    }
  };

  useEffect(() => { load(); }, [q, page, category]);

  async function seedLocal() {
    if (!confirm('Import curated starter charities into the database? This is typically run once on a new environment.')) return;
    setSeeding(true);
    try {
      const r = await fetch('/api/charities/seed-local?allow=1', { method: 'POST' });
      if (!r.ok) throw new Error(`Seed failed: ${r.status}`);
      await load();
      alert('Seeding complete');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'message') ? String((e as Record<string, unknown>)['message']) : String(e);
      alert('Seeding failed: ' + msg);
    }
    setSeeding(false);
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <Navbar />
        <main
          id="charities-page"
          className="flex-1 w-full max-w-6xl mx-auto rounded-3xl px-4 pb-10 pt-24 sm:px-6 lg:px-8"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(16,185,129,0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(6,95,70,0.6), #020617 70%)',
          }}
        >
      <Head>
        <title>Charities — Blockpage411</title>
        <meta name="description" content="Browse verified charities and donate using on-chain wallets or The Giving Block embeds." />
        <meta name="og:title" content="Charities — Blockpage411" />
      </Head>

      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-emerald-100 sm:text-4xl">Verified Charities</h1>
      <p className="mb-6 max-w-2xl text-sm text-emerald-100/80">
        Discover audited nonprofits and donate directly on-chain. All donations are peer-to-peer  you always control your wallet.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            placeholder="Search charities by name or category"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-full border border-emerald-500/40 bg-black/70 px-4 text-sm text-emerald-100 placeholder:text-emerald-500/70 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow hover:from-emerald-300 hover:to-emerald-500"
          onClick={() => load()}
        >
          Refresh
        </button>
        {process.env.NODE_ENV !== 'production' ? (
    <button className="btn btn-secondary" onClick={() => seedLocal()} disabled={seeding}>{seeding ? 'Seeding…' : 'Import starter charities'}</button>
  ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-emerald-100/80">
        <span className="mr-1 uppercase tracking-[0.16em] text-emerald-300/80">Filter:</span>
        <button
          type="button"
          onClick={() => { setCategory(null); setPage(1); }}
          className={`rounded-full border border-emerald-500/40 px-3 py-1 font-semibold uppercase tracking-[0.16em] transition-colors ${!category ? 'bg-emerald-400 text-black' : 'text-emerald-100/80 hover:bg-emerald-500/10'}`}
        >
          All
        </button>
        {['Health', 'Education', 'Environment'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`rounded-full border border-emerald-500/40 px-3 py-1 font-semibold uppercase tracking-[0.16em] transition-colors ${category === cat ? 'bg-emerald-400 text-black' : 'text-emerald-100/80 hover:bg-emerald-500/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {(q || category) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100/80">
          <div>
            <span className="font-semibold text-emerald-300/90">Active filters:</span>{' '}
            {q && <span className="mr-2">Search = "{q}"</span>}
            {category && <span>Category = {category}</span>}
          </div>
          <button
            type="button"
            onClick={() => { setQ(''); setCategory(null); setPage(1); }}
            className="rounded-full border border-emerald-500/40 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-emerald-100/80 hover:bg-emerald-500/10"
          >
            Clear filters
          </button>
        </div>
      )}

      {err ? (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/40 p-4 text-sm text-red-100">
          Error loading charities: {err}
        </div>
      ) : list === null ? (
        <div className="mt-6 text-center text-sm text-emerald-100">Loading charities</div>
      ) : list.length === 0 ? (
        <div className="mt-6 text-center text-sm text-emerald-100">
          No charities found. You can seed sample data for development using the button above, or connect a real database and seed from The Giving Block.
        </div>
      ) : (
        <>
          <CharityGrid charities={list as any} />
          {total && total > pageSize ? (
            <div className="mt-6 flex items-center justify-between text-xs text-emerald-100/80">
              <div>
                Page {page} of {Math.ceil(total / pageSize)}
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-emerald-500/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => (total ? Math.min(Math.ceil(total / pageSize), p + 1) : p + 1))}
                  disabled={total ? page >= Math.ceil(total / pageSize) : false}
                  className="rounded-full border border-emerald-500/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
