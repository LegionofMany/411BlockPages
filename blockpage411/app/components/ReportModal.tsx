"use client";
import React, { useState } from 'react';
import { showToast } from './simpleToast';
import { ethers } from 'ethers';
export default function ReportModal({ chain = 'ethereum', myWallet, provider, suspect, onClose, onSubmitted }:{ chain?: string; myWallet?: string; provider?: { _id?: string; name?: string; website?: string; type?: string } ; suspect?: string; onClose: ()=>void; onSubmitted?: (report: Record<string, unknown>)=>void }){
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(()=>{
    console.log('ReportModal mounted', { suspect, myWallet, provider, chain });
    // focus the checkbox or the container for keyboard users
    setTimeout(()=>{
      try{
        if (checkboxRef.current) {
          checkboxRef.current.focus();
        } else if (containerRef.current) {
          containerRef.current.focus();
        }
      }catch{}
    }, 0);
    function onKey(e: KeyboardEvent){ if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [onClose, suspect, myWallet, provider, chain]);

  async function signIfNeeded(){
    if (!myWallet) return null;
    try{
  const win = window as unknown as { ethereum?: { request?: (...args: unknown[]) => Promise<unknown> } };
  if (!win.ethereum || typeof win.ethereum.request !== 'function') return null;
  // request may accept various payload shapes; keep unknown to avoid `any`
  await win.ethereum.request({ method: 'eth_requestAccounts' } as unknown);
  const providerE = new ethers.BrowserProvider(win.ethereum as unknown as { request: (req: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown> });
      const signer = await providerE.getSigner();
      const message = `Verify ownership of ${myWallet} for Blockpage411 at ${Date.now()}`;
      const signature = await signer.signMessage(message);
      return { message, signature };
    }catch(e){ console.warn('sign failed', e); return null; }
  }

  async function submit(){
    setError(null);
    setMessage(null);
    if (!confirmed) { setError('Please confirm ownership before submitting'); return; }
    setLoading(true);
    try{
      console.log('Report submit start', { suspect, myWallet, provider, chain });
      let providerId = provider?._id;
      // if provider has no id (user typed 'Other'), create it first
      if (!providerId && provider && provider.name) {
        const r = await fetch('/api/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: provider.name, website: provider.website || '', type: provider.type || 'Other' }), credentials: 'include' });
        const j = await r.json();
        if (!r.ok) { showToast('Failed to create provider'); setLoading(false); return; }
        providerId = j._id || j.id;
      }

  const signaturePayload = await signIfNeeded();
  const body: Record<string, unknown> = { reporterWalletId: null, providerId, suspectAddress: suspect, chain: chain || 'ethereum', evidence: [] };
      if (signaturePayload) body.evidence = [JSON.stringify(signaturePayload)];
  const resp = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
  console.log('/api/reports response status', resp.status);
  const json = await resp.json().catch(()=>null);
  console.log('/api/reports response body', json);
  if (resp.status === 401) { setError('Not authenticated — please Sign & Verify your wallet first'); setLoading(false); return; }
  if (!resp.ok) { setError('Error: ' + (json?.message || resp.statusText)); setLoading(false); return; }
      setMessage('Report submitted — thank you');
      // small toast for visibility as well
      try{ showToast('Report submitted — thank you'); }catch{}
      setReportId(json._id || json.id || null);
  if (onSubmitted) onSubmitted(json);
      setLoading(false);
    }catch(e){ console.error('Report submit errored', e); setError('Submission failed: ' + (e instanceof Error ? e.message : String(e))); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={(e)=>{ if (e.target === e.currentTarget) onClose(); }}>
  <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="report-title" tabIndex={-1} className="bg-white rounded shadow-lg w-full max-w-lg p-6 focus:outline-none max-h-[80vh] overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Confirm report</h3>
        <p className="text-sm mb-4">⚠️ This account must be yours before you continue. Confirm ownership by signing a message with your wallet or ticking the checkbox.</p>
        <div className="text-xs text-gray-500 mb-4">By submitting a report you agree to our <a href="/terms" className="text-blue-600">Terms of Use</a>. False reports may be removed. You may appeal a dismissal via the admin contact.</div>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input ref={checkboxRef} type="checkbox" checked={confirmed} onChange={(e)=>setConfirmed(e.target.checked)} className="mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Confirm ownership" />
            <span>I confirm this is my wallet and I understand the terms.</span>
          </label>
        </div>
        {message && <div className="mb-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn focus:outline-none focus:ring-2 focus:ring-gray-500 px-3 py-2" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="button" className="btn btn-primary focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2" onClick={submit} disabled={loading}>{loading ? 'Submitting…' : 'Submit report'}</button>
        </div>
        {reportId && <div className="mt-4 text-sm text-green-600">Report ID: {reportId}</div>}
      </div>
    </div>
  );
}
