"use client";
import React, { useState } from 'react';
import { showToast } from './simpleToast';

export default function AddProviderModal({ initialName = '', onClose, onCreated }:{ initialName?: string; onClose: ()=>void; onCreated: (p: unknown)=>void }){
  const [name, setName] = useState(initialName);
  const [website, setWebsite] = useState('');
  const [type, setType] = useState('CEX');
  const [loading, setLoading] = useState(false);

  async function submit(){
    if (!name) return showToast('Please enter a provider name');
    setLoading(true);
    try{
      const r = await fetch('/api/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, website, type, aliases: [] }), credentials: 'include' });
      const j = await r.json();
      if (!r.ok) { showToast('Failed to add provider: ' + (j?.message||r.statusText)); setLoading(false); return; }
  showToast('Provider added (pending review)');
  if (onCreated) { onCreated(j); }
      onClose();
    }catch(e){ console.error(e); showToast('Failed to add provider'); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-2">Add a provider</h3>
        <label className="text-sm">Name</label>
        <input className="input w-full mb-2" value={name} onChange={(e)=>setName(e.target.value)} />
        <label className="text-sm">Type</label>
        <select className="input w-full mb-2" value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="CEX">CEX</option>
          <option value="DEX">DEX</option>
          <option value="Wallet">Wallet</option>
          <option value="Other">Other</option>
        </select>
        <label className="text-sm">Website (optional)</label>
        <input className="input w-full mb-4" value={website} onChange={(e)=>setWebsite(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Adding…' : 'Add provider'}</button>
        </div>
      </div>
    </div>
  );
}
