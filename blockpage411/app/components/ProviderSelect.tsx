"use client";
import React, { useEffect, useState } from 'react';

type Provider = {
  _id?: string;
  name: string;
  aliases?: string[];
  website?: string;
  rank?: number;
  reportsCount?: number;
};

export default function ProviderSelect({ value: _value, onChange }:{ value?: Provider | null; onChange: (p: Provider | null) => void }){
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    // if a value is provided (selected provider), show its name in the input
    if (_value && _value.name) setQ(_value.name);
    let canceled = false;
    async function fetchList(){
      setLoading(true);
      try{
        const url = q ? `/api/providers?q=${encodeURIComponent(q)}` : '/api/providers';
        const r = await fetch(url);
        const json = await r.json();
        if (!canceled) setOpts(json || []);
      }catch(err){
        console.error(err);
      }finally{ setLoading(false); }
    }
    const t = setTimeout(fetchList, 200);
    return ()=>{ canceled = true; clearTimeout(t); };
  }, [q, _value]);

  return (
    <div className="w-full">
      <input className="input" placeholder="Search provider" value={q} onChange={(e)=>setQ(e.target.value)} />
      <div className="mt-2 max-h-56 overflow-auto bg-white shadow rounded">
        {loading && <div className="p-2 text-sm text-gray-500">Loading…</div>}
        {!loading && opts.length === 0 && <div className="p-2 text-sm">No providers found — you can add a new one.</div>}
        {opts.map((p)=> (
          <button key={p._id || p.name} onClick={()=>onChange(p)} className="w-full text-left p-2 hover:bg-gray-50">
            <div className="font-medium">
              {p.name} {p.rank ? <span className="text-xs text-gray-400">#{p.rank}</span> : null}
              {p.reportsCount && p.reportsCount >= 10 ? <span title="Many reports" className="ml-2 text-yellow-600">⚠️</span> : null}
            </div>
            <div className="text-xs text-gray-500">{p.website || (p.aliases && p.aliases.join(', '))}</div>
          </button>
        ))}
      </div>
      <div className="mt-2">
        <button onClick={()=>onChange({ name: q || 'Other', aliases: [], website: '' })} className="text-sm text-blue-600">Add new provider: “{q || 'Other'}”</button>
      </div>
    </div>
  );
}
