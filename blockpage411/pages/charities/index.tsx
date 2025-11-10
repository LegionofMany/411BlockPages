import React, { useEffect, useState } from 'react';
import CharityCard from '../../components/CharityCard';

export default function CharitiesPage() {
  const [list, setList] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setErr(null);
    setList(null);
    try {
      const res = await fetch(`/api/charities?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const js = await res.json();
      setList(js.results || []);
    } catch (e: any) {
      setErr(e?.message || String(e));
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
    } catch (e: any) { alert('Seeding failed: ' + (e?.message||String(e))); }
    setSeeding(false);
  }

  return (
    <div id="charities-page" className="max-w-6xl mx-auto p-6 rounded-md" style={{ background: 'linear-gradient(135deg,#071127 0%, #0b1330 100%)', color: '#f8fafc' }}>
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
        <button className="btn btn-secondary" onClick={() => seedLocal()} disabled={seeding}>{seeding ? 'Seeding…' : 'Seed sample (dev)'}</button>
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
          {list.map(c => <CharityCard key={c._id || c.name} charity={c} />)}
        </div>
      )}
    </div>
  );
}
