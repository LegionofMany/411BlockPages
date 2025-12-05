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
            <CharityProfile charity={charity} />
          )}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
