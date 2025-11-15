import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import CharityCard from '../../components/CharityCard';
import Navbar from '../../app/components/Navbar';
import Footer from '../../app/components/Footer';
import ThemeProvider from '../../app/components/ThemeProvider';

export default function CharitiesPage() {
  const [list, setList] = useState<Record<string, unknown>[] | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setErr(null);
    setList(null);
    try {
      const res = await fetch(`/api/charities?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const js = await res.json() as unknown;
      if (Array.isArray(js)) setList(js as Record<string, unknown>[]);
      else {
        const obj = js as Record<string, unknown>;
        setList((obj.results as Record<string, unknown>[]) || []);
      }
    } catch (e: unknown) {
      const errMsg = e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'message') ? String((e as Record<string, unknown>)['message']) : String(e);
      setErr(errMsg);
      setList([]);
    }
  };

  useEffect(() => { load(); }, [q]);

  async function seedLocal() {
    if (!confirm('Seed sample charities into the local database? This action is intended for development.')) return;
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
        <main id="charities-page" className="flex-1 w-full max-w-6xl mx-auto p-6 pt-20 rounded-md" style={{ background: 'linear-gradient(135deg,#071127 0%, #0b1330 100%)', color: '#f8fafc' }}>
      <Head>
        <title>Charities — Blockpage411</title>
        <meta name="description" content="Browse verified charities and donate using on-chain wallets or The Giving Block embeds." />
        <meta name="og:title" content="Charities — Blockpage411" />
      </Head>

      <h1 className="text-2xl font-bold mb-4" style={{ color: '#ffffff' }}>Charities</h1>
      {/* force-override styles in case global layout or utility classes are more specific */}
      <style jsx global>{`
        #charities-page {
          background: linear-gradient(135deg,#071127 0%, #0b1330 100%) !important;
          color: #f8fafc !important;
        }
        /* ensure headings and body text within the charities page are highly legible */
        #charities-page h1,
        #charities-page h2,
        #charities-page p,
        #charities-page .text-slate-300,
        #charities-page .text-slate-400,
        #charities-page .muted {
          color: #e6eef8 !important;
        }
        /* darken card backgrounds inside this page to improve contrast */
        #charities-page .rounded-lg,
        #charities-page .card {
          background-color: rgba(8,12,24,0.64) !important;
          border-color: rgba(124,58,237,0.10) !important;
        }
      `}</style>

      <div className="mb-4 flex gap-2 items-center">
        <input placeholder="Search charities" value={q} onChange={e=>setQ(e.target.value)} className="input flex-1" />
        <button className="btn" onClick={() => load()}>Refresh</button>
        {process.env.NODE_ENV !== 'production' ? (
          <button className="btn btn-secondary" onClick={() => seedLocal()} disabled={seeding}>{seeding ? 'Seeding…' : 'Seed sample (dev)'}</button>
        ) : null}
      </div>

      {err ? (
        <div className="p-4 rounded bg-red-900/40 text-red-200">Error loading charities: {err}</div>
      ) : list === null ? (
        <div className="p-6 text-center text-slate-200">Loading charities…</div>
      ) : list.length === 0 ? (
        <div className="p-6 text-center text-slate-200">
          No charities found. You can seed sample data for development using the button above, or connect a real database and seed from The Giving Block.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(c => <CharityCard key={String(c['_id'] ?? c['name'] ?? '')} charity={c} />)}
        </div>
      )}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
