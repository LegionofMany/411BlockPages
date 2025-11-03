"use client";
import React, { useState } from 'react';
import ProviderSelect from 'app/components/ProviderSelect';
import AddProviderModal from 'app/components/AddProviderModal';
import ReportModal from 'app/components/ReportModal';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

// minimal EIP-1193-like provider typing
type EthereumProvider = { request: (req: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown> };

type ProviderType = { _id?: string; name: string; website?: string; type?: string; rank?: number; status?: string };

export default function SearchPage(){
  const router = useRouter();
  const [myWallet, setMyWallet] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [provider, setProvider] = useState<ProviderType | null>(null);
  const [suspect, setSuspect] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);

  const [openReportModal, setOpenReportModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signAndVerify(){
    setErrorMessage(null);
    setStatusMessage(null);
    if (!myWallet) { setErrorMessage('Enter your wallet address to verify'); return; }
    try{
      // request accounts
      const win = window as unknown as { ethereum?: { request?: (...args: unknown[]) => Promise<unknown> } };
  if (!win.ethereum || typeof win.ethereum.request !== 'function') { setErrorMessage('No web3 provider found'); return; }
      // request may accept various payload shapes; keep unknown to avoid `any`
      await win.ethereum.request({ method: 'eth_requestAccounts' } as unknown);
  // use a narrow unknown->typed cast to avoid explicit any
  const providerE = new ethers.BrowserProvider(win.ethereum as unknown as EthereumProvider);
      const signer = await providerE.getSigner();
      // auto-fill My Wallet with connected address to avoid mismatch
  try{ const connected = await signer.getAddress(); if (connected) setMyWallet(connected); }catch{ /* ignore */ }

      // First, perform nonce-based login to create an auth cookie (if not already logged in).
      // 1) request nonce
      const nonceResp = await fetch('/api/auth/nonce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: myWallet }) });
      if (!nonceResp.ok) {
        const j = await nonceResp.json().catch(()=>null);
        setErrorMessage('Login nonce request failed: ' + (j?.message || nonceResp.statusText));
        return;
      }
      const { nonce } = await nonceResp.json();

      // 2) sign the login nonce and verify to get a session cookie
      const loginMessage = `Login nonce: ${nonce}`;
      const loginSignature = await signer.signMessage(loginMessage);
      const verifyResp = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: myWallet, signature: loginSignature }), credentials: 'include' });
      if (!verifyResp.ok) {
        const j = await verifyResp.json().catch(()=>null);
        setErrorMessage('Login failed: ' + (j?.message || verifyResp.statusText));
        return;
      }

      // 3) now create a verification proof for the wallet (attach signature to Wallet doc)
      const proofMessage = `Verify ownership of ${myWallet} for Blockpage411 at ${Date.now()}`;
      const proofSignature = await signer.signMessage(proofMessage);
      setStatusMessage('Submitting verification...');
      const resp = await fetch('/api/wallets/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ address: myWallet, chain, message: proofMessage, signature: proofSignature }), credentials: 'include' });
      if (!resp.ok) { const j = await resp.json().catch(()=>null); setErrorMessage('Verify failed: ' + (j?.message || resp.statusText)); setStatusMessage(null); return; }
      setStatusMessage('Wallet verified successfully and session created');
  }catch(err){ console.error(err); setErrorMessage('Signature failed'); }
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
        <label className="block text-sm font-medium mb-1">Chain</label>
        <select value={chain} onChange={(e)=>setChain(e.target.value)} className="input w-full">
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BSC</option>
          <option value="polygon">Polygon</option>
          <option value="bitcoin">Bitcoin</option>
          <option value="solana">Solana</option>
          <option value="tron">Tron</option>
          <option value="xrp">XRP</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Receiving address</label>
        <input value={suspect} onChange={(e)=>setSuspect(e.target.value)} className="input w-full" placeholder="0x..." />
      </div>
      <div className="flex gap-2">
        <button onClick={()=>setAddingProvider(true)} className="btn">Add provider</button>
  <button onClick={()=>{ console.log('Flag/Report clicked', { myWallet, suspect, chain }); setErrorMessage(null); setStatusMessage(null); setOpenReportModal(true); }} className="btn btn-primary">Flag / Report</button>
        <button onClick={signAndVerify} className="btn">Sign & Verify my wallet</button>
      </div>
      {addingProvider && (
        <AddProviderModal initialName={provider?.name || ''} onClose={()=>setAddingProvider(false)} onCreated={(p)=>{ setProvider(p as ProviderType); setAddingProvider(false); }} />
      )}
      {openReportModal && (
  <ReportModal chain={chain} myWallet={myWallet} provider={provider ?? undefined} suspect={suspect} onClose={()=>setOpenReportModal(false)} onSubmitted={(report)=>{ setSuspect(''); setOpenReportModal(false); try{ const rep = (report as Record<string, unknown> | null) || null; const rc = (rep && typeof rep.chain === 'string' ? rep.chain : chain) || 'ethereum'; const address = (rep && typeof rep.suspectAddress === 'string' ? rep.suspectAddress : suspect); router.push(`/wallet/${rc}/${address}`); }catch{ /* ignore */ } }} />
      )}
      {statusMessage && <div className="mt-3 text-sm text-green-500">{statusMessage}</div>}
      {errorMessage && <div className="mt-3 text-sm text-red-500">{errorMessage}</div>}
    </div>
  );
}
