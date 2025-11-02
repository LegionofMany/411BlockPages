"use client";
import React, { useState } from 'react';
import ProviderSelect from 'app/components/ProviderSelect';
import AddProviderModal from 'app/components/AddProviderModal';
import ReportModal from 'app/components/ReportModal';
import { ethers } from 'ethers';

type ProviderType = { _id?: string; name: string; website?: string; type?: string; rank?: number; status?: string };

export default function SearchPage(){
  const [myWallet, setMyWallet] = useState('');
  const [provider, setProvider] = useState<ProviderType | null>(null);
  const [suspect, setSuspect] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);

  const [openReportModal, setOpenReportModal] = useState(false);

  async function signAndVerify(){
    if (!myWallet) return alert('Enter your wallet address to verify');
    try{
      // request accounts
      const win = window as unknown as { ethereum?: { request?: (...args: unknown[]) => Promise<unknown> } };
      if (!win.ethereum || typeof win.ethereum.request !== 'function') return alert('No web3 provider found');
      // request may accept various payload shapes; keep unknown to avoid `any`
      await win.ethereum.request({ method: 'eth_requestAccounts' } as unknown);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providerE = new ethers.BrowserProvider((win.ethereum as any));
      const signer = await providerE.getSigner();
      const message = `Verify ownership of ${myWallet} for Blockpage411 at ${Date.now()}`;
      const signature = await signer.signMessage(message);
      // POST to verify endpoint
      const resp = await fetch('/api/wallets/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ address: myWallet, message, signature }), credentials: 'include' });
      if (!resp.ok) { const j = await resp.json().catch(()=>null); return alert('Verify failed: ' + (j?.message || resp.statusText)); }
      alert('Wallet verified successfully');
    }catch(e){ console.error(e); alert('Signature failed'); }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Report a receiving address</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">My Wallet (owner)</label>
        <input value={myWallet} onChange={(e)=>setMyWallet(e.target.value)} className="input w-full" placeholder="0x..." />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Provider / Exchange</label>
        <ProviderSelect value={provider} onChange={(p)=>setProvider(p)} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Receiving address</label>
        <input value={suspect} onChange={(e)=>setSuspect(e.target.value)} className="input w-full" placeholder="0x..." />
      </div>
      <div className="flex gap-2">
        <button onClick={()=>setAddingProvider(true)} className="btn">Add provider</button>
        <button onClick={()=>setOpenReportModal(true)} className="btn btn-primary">Flag / Report</button>
        <button onClick={signAndVerify} className="btn">Sign & Verify my wallet</button>
      </div>
      {addingProvider && (
        <AddProviderModal initialName={provider?.name || ''} onClose={()=>setAddingProvider(false)} onCreated={(p)=>{ setProvider(p as ProviderType); setAddingProvider(false); }} />
      )}
      {openReportModal && (
        <ReportModal myWallet={myWallet} provider={provider ?? undefined} suspect={suspect} onClose={()=>setOpenReportModal(false)} onSubmitted={()=>{ setSuspect(''); setOpenReportModal(false); }} />
      )}
    </div>
  );
}
