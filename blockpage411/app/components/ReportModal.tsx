"use client";
import React, { useState } from 'react';
import { showToast } from './simpleToast';
import { ethers } from 'ethers';
export default function ReportModal({ myWallet, provider, suspect, onClose, onSubmitted }:{ myWallet?: string; provider?: { _id?: string; name?: string; website?: string; type?: string } ; suspect?: string; onClose: ()=>void; onSubmitted?: (report: Record<string, unknown>)=>void }){
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(()=>{
    // focus the checkbox or the container for keyboard users
    setTimeout(()=>{ try{ if (checkboxRef.current) checkboxRef.current.focus(); else containerRef.current?.focus(); }catch{} }, 0);
    function onKey(e: KeyboardEvent){ if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function signIfNeeded(){
    if (!myWallet) return null;
    try{
  const win = window as unknown as { ethereum?: { request?: (...args: unknown[]) => Promise<unknown> } };
  if (!win.ethereum || typeof win.ethereum.request !== 'function') return null;
  // request may accept various payload shapes; keep unknown to avoid `any`
  await win.ethereum.request({ method: 'eth_requestAccounts' } as unknown);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providerE = new ethers.BrowserProvider((win.ethereum as any));
      const signer = await providerE.getSigner();
      const message = `Verify ownership of ${myWallet} for Blockpage411 at ${Date.now()}`;
      const signature = await signer.signMessage(message);
      return { message, signature };
    }catch(e){ console.warn('sign failed', e); return null; }
  }

  async function submit(){
    if (!confirmed) return showToast('Please confirm ownership before submitting');
    setLoading(true);
    try{
      let providerId = provider?._id;
      // if provider has no id (user typed 'Other'), create it first
      if (!providerId && provider && provider.name) {
        const r = await fetch('/api/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: provider.name, website: provider.website || '', type: provider.type || 'Other' }), credentials: 'include' });
        const j = await r.json();
        if (!r.ok) { showToast('Failed to create provider'); setLoading(false); return; }
        providerId = j._id || j.id;
      }

  const signaturePayload = await signIfNeeded();
  const body: Record<string, unknown> = { reporterWalletId: null, providerId, suspectAddress: suspect, chain: 'ETH', evidence: [] };
      if (signaturePayload) body.evidence = [JSON.stringify(signaturePayload)];
      const resp = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
      const json = await resp.json();
      if (!resp.ok) { showToast('Error: ' + (json?.message || resp.statusText)); setLoading(false); return; }
      showToast('Report submitted — thank you');
      setReportId(json._id || json.id || null);
      onSubmitted && onSubmitted(json);
      setLoading(false);
    }catch(e){ console.error(e); showToast('Submission failed'); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={(e)=>{ if (e.target === e.currentTarget) onClose(); }}>
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="report-title" tabIndex={-1} className="bg-white rounded shadow-lg w-full max-w-lg p-6 focus:outline-none">
        <h3 className="text-lg font-semibold mb-2">Confirm report</h3>
        <p className="text-sm mb-4">⚠️ This account must be yours before you continue. Confirm ownership by signing a message with your wallet or ticking the checkbox.</p>
        <div className="text-xs text-gray-500 mb-4">By submitting a report you agree to our <a href="/terms" className="text-blue-600">Terms of Use</a>. False reports may be removed. You may appeal a dismissal via the admin contact.</div>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input ref={checkboxRef} type="checkbox" checked={confirmed} onChange={(e)=>setConfirmed(e.target.checked)} className="mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Confirm ownership" />
            <span>I confirm this is my wallet and I understand the terms.</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn focus:outline-none focus:ring-2 focus:ring-gray-500 px-3 py-2" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="button" className="btn btn-primary focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2" onClick={submit} disabled={loading}>{loading ? 'Submitting…' : 'Submit report'}</button>
        </div>
        {reportId && <div className="mt-4 text-sm text-green-600">Report ID: {reportId}</div>}
      </div>
    </div>
  );
}
