import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../app/components/Navbar';
import Footer from '../../app/components/Footer';
import ThemeProvider from '../../app/components/ThemeProvider';
import CharityProfile, { CharityDetail } from '../../components/charities/CharityProfile';

export default function CharityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [charity, setCharity] = useState<CharityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<CharityDetail[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/charities/${encodeURIComponent(String(id))}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const js = await res.json();
        const data = (js && js.charity) || js;
        if (!cancelled) setCharity(data as CharityDetail);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load charity');
          setCharity(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!charity || !charity.categories || charity.categories.length === 0) return;
    let cancelled = false;
    async function loadRelated(ch: CharityDetail) {
      setRelatedLoading(true);
      try {
        const primaryCategory = ch.categories && ch.categories[0];
        if (!primaryCategory) {
          if (!cancelled) setRelated([]);
          return;
        }
        const params = new URLSearchParams();
        params.set('category', primaryCategory);
        params.set('page', '1');
        params.set('pageSize', '6');
        const res = await fetch(`/api/charities?${params.toString()}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const js = await res.json();
        const results = (js && js.results) || js;
        const items = Array.isArray(results) ? results : [];
        const filtered = items.filter((c: any) => {
          const cid = c._id || c.givingBlockId || c.charityId || c.name;
          const currentId = ch.givingBlockId || ch.charityId || ch._id || ch.name;
          return String(cid) !== String(currentId);
        });
        if (!cancelled) setRelated(filtered as CharityDetail[]);
      } catch {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    }
    void loadRelated(charity);
    return () => {
      cancelled = true;
    };
  }, [charity]);

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col items-center bg-black">
        <Navbar />
        <main
          id="charity-detail-page"
          className="mt-20 flex w-full max-w-5xl flex-1 flex-col px-4 pb-12 pt-8"
          style={{
            background: 'radial-gradient(circle at top left, rgba(16,185,129,0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(6,95,70,0.55), #020617 70%)',
          }}
        >
          <Head>
            <title>{charity ? `${charity.name} — Charities` : 'Charity — Blockpage411'}</title>
            <meta name="description" content={charity?.description || 'Charity profile on Blockpage411'} />
          </Head>

          {loading ? (
            <div className="mt-10 text-center text-emerald-100">Loading charity…</div>
          ) : error ? (
            <div className="mt-10 rounded-xl border border-red-500/40 bg-red-900/40 p-4 text-red-100">{error}</div>
          ) : !charity ? (
            <div className="mt-10 text-center text-emerald-100">Charity not found.</div>
          ) : (
            <>
              <CharityProfile charity={charity} />

              {charity.categories && charity.categories.length > 0 && (
                <section className="mt-8 rounded-3xl border border-emerald-500/30 bg-black/70 p-4 text-emerald-100">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold uppercase tracking-[0.16em] text-emerald-300">Similar charities</span>
                      <span className="ml-2 text-emerald-200/80">
                        Category:
                      </span>
                      <select
                        className="ml-1 rounded-full border border-emerald-500/40 bg-black/60 px-2 py-1 text-[11px] text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        value={charity.categories[0]}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (!next) return;
                          // Navigate back to the charities listing filtered by this category
                          void router.push(`/charities?category=${encodeURIComponent(next)}`);
                        }}
                      >
                        {charity.categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/charities')}
                      className="rounded-full border border-emerald-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/90 hover:bg-emerald-500/10"
                    >
                      View all charities
                    </button>
                  </div>

                  {relatedLoading ? (
                    <div className="text-[11px] text-emerald-100/80">Loading similar charities…</div>
                  ) : related.length === 0 ? (
                    <div className="text-[11px] text-emerald-100/70">No other charities found in this category yet.</div>
                  ) : (
                    <ul className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                      {related.map((c) => {
                        const cid = c.givingBlockId || c.charityId || c._id || c.name;
                        return (
                          <li key={String(cid)}>
                            <button
                              type="button"
                              onClick={() => router.push(`/charities/${encodeURIComponent(String(cid))}`)}
                              className="flex w-full items-center justify-between rounded-2xl border border-emerald-500/30 bg-black/60 px-3 py-2 text-left hover:border-emerald-400/60"
                            >
                              <span className="truncate text-emerald-100">{c.name}</span>
                              {Array.isArray(c.categories) && c.categories[0] && (
                                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                                  {c.categories[0]}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}
            </>
          )}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
