import React, { useState } from 'react';

export default function CampaignForm({ address, chain, onCreated }: { address: string; chain: string; onCreated?: (c:any)=>void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [wallet, setWallet] = useState(address || '');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    // Client-side validation
    const errors: string[] = [];
    if (!title || title.trim().length < 5) errors.push('Title must be at least 5 characters');
    if (!wallet || wallet.trim().length < 10) errors.push('Recipient wallet is required');
    const goalNum = Number(goal || 0);
    if (isNaN(goalNum) || goalNum < 0) errors.push('Goal must be a positive number');
    if (expiry) {
      const exp = new Date(expiry);
      const max = new Date(); max.setDate(max.getDate() + 90);
      if (exp > max) errors.push('Expiry cannot be more than 90 days');
    }
    if (errors.length) { alert(errors.join('\n')); return; }

    setLoading(true);
    try{
      const res = await fetch('/api/campaigns/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address, chain, title, description, goal, wallet, expiry }) });
      const js = await res.json();
      if (res.ok) onCreated?.(js);
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="p-4 bg-white/5 rounded-lg">
      <div className="grid grid-cols-1 gap-3">
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="input" />
        <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="input" />
        <input placeholder="Goal (USD)" value={goal} onChange={e=>setGoal(e.target.value)} className="input" />
        <input placeholder="Recipient wallet" value={wallet} onChange={e=>setWallet(e.target.value)} className="input" />
        <input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} className="input" />
        <div>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Campaign'}</button>
        </div>
      </div>
    </form>
  );
}
