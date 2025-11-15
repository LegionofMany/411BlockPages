
import React, { useState, useEffect, useRef } from "react";
interface Flag {
  _id: string;
  user: string;
  reason: string;
  comment?: string;
  date?: string | number | Date;
  flaggedBy?: string;
  hidden?: boolean;
}

const FLAG_REASONS = [
  "Suspicious activity",
  "Phishing",
  "Scam",
  "Fake identity",
  "Money laundering",
  "Spam",
  "Impersonation",
  "Unsolicited contact",
  "Malware",
  "Other"
];

interface WalletFlagSectionProps {
  flags?: Array<Flag & { _id: string; flaggedBy?: string }>;
  address?: string;
  chain?: string;
  onFlag: (reason: string, comment?: string) => Promise<unknown> | void;
}

type LocalFlag = Flag & { _id: string; flaggedBy?: string; isTemp?: boolean };

const WalletFlagSection: React.FC<WalletFlagSectionProps> = ({ flags, address, chain, onFlag }) => {
  const [flagReason, setFlagReason] = useState("");
  const [flagComment, setFlagComment] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagError, setFlagError] = useState<string|null>(null);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [detailsFlag, setDetailsFlag] = useState<Flag | null>(null);
  // local optimistic flags with transient temp items
  const [localFlags, setLocalFlags] = useState<Array<LocalFlag>>(flags || []);
  const [enteredIds, setEnteredIds] = useState<Record<string, boolean>>({});
  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});
  const prevServerIdsRef = useRef<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  const handleFlag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!flagReason) {
      setFlagError("Please select a reason for flagging.");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmFlag = async () => {
    setConfirmOpen(false);
    setFlagLoading(true);
    setFlagError(null);
    setFlagSuccess(false);
    try {
      // optimistic insert
      const tempId = `tmp-${Date.now()}`;
      const tempFlag: Flag & { _id: string; isTemp?: boolean } = {
        _id: tempId,
        user: 'you',
        reason: flagReason,
        comment: flagComment,
        date: new Date().toISOString(),
        flaggedBy: 'You',
        isTemp: true,
      };
      setLocalFlags(prev => [tempFlag, ...(prev || [])]);
      // trigger enter animation shortly after mount
      setTimeout(() => setEnteredIds(prev => ({ ...prev, [tempId]: true })), 20);

      await onFlag(flagReason, flagComment);
      setFlagSuccess(true);
      setFlagReason("");
      setFlagComment("");
      // refresh remaining count after successful flag
      fetchRemaining();
      // the parent should call mutate which will update `flags` prop; we'll sync in effect
    } catch (err) {
  // rollback optimistic insert if present
  setLocalFlags(prev => prev.filter(f => !(f as LocalFlag).isTemp));
      // surface friendly messages for rate limit
      if (err && typeof err === 'object' && 'status' in err && Number((err as Record<string, unknown>).status) === 429) {
        setFlagError('Flag limit reached for today. You can flag up to 5 times per day.');
        setRemaining(0);
      } else if (err instanceof Error) {
        setFlagError(err.message);
      } else {
        setFlagError("Failed to flag wallet");
      }
    } finally {
      setFlagLoading(false);
    }
  };

  useEffect(() => { fetchRemaining(); }, []);

  // sync incoming server flags with local optimistic flags and animate newly-added server flags
  useEffect(() => {
    if (!flags || flags.length === 0) {
      // keep only temp items if any
      setLocalFlags(prev => (prev || []).filter(f => (f as LocalFlag).isTemp));
      prevServerIdsRef.current = new Set();
      return;
    }
    const incomingIds = new Set(flags.map(f => f._id));
    const prev = prevServerIdsRef.current;
    // find newly added server ids
    const added = Array.from(incomingIds).filter(id => !prev.has(id));
    if (added.length > 0) {
      // mark as confirmed to show a subtle highlight animation
      setConfirmedIds(prevMap => {
        const next = { ...prevMap };
        for (const id of added) next[id] = true;
        return next;
      });
      // clear confirmations after a short delay
      setTimeout(() => {
        setConfirmedIds(prevMap => {
          const next = { ...prevMap };
          for (const id of added) delete next[id];
          return next;
        });
      }, 900);
    }
    // replace local flags with server flags (server is source-of-truth)
    setLocalFlags([...flags as LocalFlag[]]);
    prevServerIdsRef.current = incomingIds;
     
  }, [flags]);

  async function fetchRemaining() {
    try {
      const res = await fetch('/api/flags/remaining', { credentials: 'include' });
      if (!res.ok) return setRemaining(null);
      const body = await res.json();
      setRemaining(typeof body.remaining === 'number' ? body.remaining : null);
    } catch {
      setRemaining(null);
    }
  }

  return (
    <div className="mt-4 w-full">
      <h3 className="text-amber-200 font-semibold mb-3">Flag this wallet</h3>

      {/* Reason chips for quicker selection */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FLAG_REASONS.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => { setFlagReason(r); setFlagError(null); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${flagReason === r ? 'bg-amber-400/18 text-amber-300 ring-1 ring-amber-300' : 'bg-white/2 text-amber-100 hover:bg-white/4'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2" onSubmit={handleFlag}>
        <input aria-label="flag comment" type="text" className="px-3 py-2 rounded border border-sky-700/30 w-full md:w-2/3 bg-transparent placeholder:text-slate-400 text-amber-100" placeholder="Add optional details (helps moderators)" value={flagComment} onChange={e => setFlagComment(e.target.value)} />
        <div className="flex items-center gap-2">
          <button type="submit" className={`px-4 py-2 rounded-lg font-semibold transition ${flagLoading ? 'opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:scale-[1.02]'}`} disabled={flagLoading || !flagReason}>{flagLoading ? "Submitting..." : "Flag Wallet"}</button>
          <button type="button" onClick={() => { setFlagReason(''); setFlagComment(''); setFlagError(null); }} className="px-3 py-2 rounded-md bg-white/3 text-white hover:bg-white/5">Reset</button>
        </div>
        {flagError && <span className="text-red-400 text-xs ml-2">{flagError}</span>}
        {flagSuccess && <span className="text-green-400 text-xs ml-2">Flag submitted!</span>}
      </form>
      {/* remaining quota */}
      <div className="mt-2 text-xs text-slate-400">
        {remaining === null && <span>Flag quota: <em>hidden</em></span>}
        {typeof remaining === 'number' && <span>Flags remaining today: <strong className="text-amber-300">{remaining}</strong> / 5</span>}
      </div>
      {localFlags && localFlags.length > 0 && (
        <div className="mt-6">
          <h4 className="text-amber-300 font-semibold mb-3">Existing flags ({localFlags.length})</h4>
          <ul className="space-y-3">
            {localFlags.map(flag => {
              const lf = flag as LocalFlag;
              const isTemp = Boolean(lf.isTemp);
              const entered = Boolean(enteredIds[lf._id]);
              return (
                <li key={lf._id} className={`rounded-2xl p-4 transform transition-all duration-300 ${isTemp && !entered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${confirmedIds[lf._id] ? 'ring-2 ring-amber-400/30 shadow-xl' : ''}`} style={{ background: 'linear-gradient(180deg, rgba(255,250,240,0.02), rgba(6,8,15,0.5))', border: '1px solid rgba(59,130,246,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm text-amber-100">{lf._id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full text-amber-800 bg-amber-200/8">{lf.reason}</span>
                      </div>
                      {lf.comment && lf.comment.length > 0 && !lf.hidden && <p className="text-amber-100/90 text-sm mb-1">{lf.comment}</p>}
                      {lf.hidden && <p className="text-gray-400 italic text-sm">Comment hidden by admin</p>}
                      <div className="text-xs text-amber-200 mt-1">
                        {lf.date && <span className="mr-3">{new Date(lf.date).toLocaleString()}</span>}
                        {lf.flaggedBy && <span>By {lf.flaggedBy}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <button onClick={() => setDetailsFlag(lf)} className="px-3 py-1 rounded-md bg-sky-700/20 text-sky-100 hover:bg-sky-700/30" title="View details">Details</button>
                      {/* admin controls (hide/dismiss) would go here when user is admin */}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Confirmation modal rendered inline */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 2000 }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-10 w-11/12 max-w-md rounded-xl p-5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(6,8,15,0.72))', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 10px 40px rgba(2,6,23,0.6)' }}>
            <h3 className="text-lg font-semibold text-amber-100 mb-2">Confirm flag submission</h3>
            <p className="text-sm text-amber-200 mb-3">You are about to flag this wallet for: <strong className="text-amber-100">{flagReason}</strong></p>
            {flagComment && <p className="text-sm text-amber-200 mb-3">Comment: {`"${flagComment}"`}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="px-3 py-2 rounded-md bg-white/3 text-white">Cancel</button>
              <button onClick={confirmFlag} className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {detailsFlag && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 2000 }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailsFlag(null)} />
          <div className="relative z-10 w-11/12 max-w-lg rounded-xl p-5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(6,8,15,0.84))', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 12px 48px rgba(2,6,23,0.6)' }}>
            <h3 className="text-lg font-semibold text-amber-100 mb-2">Flag details</h3>
            <div className="text-sm text-amber-200 mb-3">
              <div><b>ID:</b> <span className="font-mono">{detailsFlag._id}</span></div>
              <div><b>Reason:</b> {detailsFlag.reason}</div>
              {detailsFlag.comment && <div><b>Comment:</b> {detailsFlag.comment}</div>}
              {detailsFlag.date && <div><b>Date:</b> {new Date(detailsFlag.date as string).toLocaleString()}</div>}
              {detailsFlag.flaggedBy && <div><b>Flagged by:</b> {detailsFlag.flaggedBy}</div>}
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="flex gap-2">
                {/* Quick-report / pre-fill admin view */}
                <button
                  className="px-3 py-2 rounded-md bg-amber-600 text-black font-semibold"
                  onClick={async () => {
                    // Open admin prefill in a new tab for manual review
                    const url = `/admin/flagged-wallets?address=${encodeURIComponent(address || '')}&chain=${encodeURIComponent(chain || '')}&reason=${encodeURIComponent(detailsFlag.reason || '')}&comment=${encodeURIComponent(detailsFlag.comment || '')}`;
                    window.open(url, '_blank');
                  }}
                >
                  Open admin (prefill)
                </button>
                <button
                  disabled={quickLoading}
                  onClick={async () => {
                    if (!detailsFlag) return;
                    setQuickLoading(true);
                    try {
                      const res = await fetch('/api/flags', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ address: address || '', chain: chain || '', reason: detailsFlag.reason || 'Other', comment: detailsFlag.comment || '' })
                      });
                      if (!res.ok) {
                        let body: unknown = null;
                        try { body = await res.json(); } catch {}
                        const obj = body as Record<string, unknown> | null;
                        throw new Error(obj && typeof obj.message === 'string' ? obj.message : `Failed: ${res.status}`);
                      }
                      setToast({ type: 'success', message: 'Report submitted' });
                      // refresh remaining counter
                      fetchRemaining();
                      // close modal after a moment
                      setTimeout(() => setDetailsFlag(null), 900);
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Report failed';
                      setToast({ type: 'error', message: msg });
                    } finally {
                      setQuickLoading(false);
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  className="px-3 py-2 rounded-md bg-sky-700/20 text-sky-100 hover:bg-sky-700/30"
                >
                  {quickLoading ? 'Reporting...' : 'Quick report'}
                </button>
              </div>
              <div className="flex gap-3">
                <a className="px-3 py-2 rounded-md bg-white/3 text-white" href="/admin/flagged-wallets">View in admin</a>
                <button onClick={() => setDetailsFlag(null)} className="px-4 py-2 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-2 rounded shadow-xl z-50 text-sm font-semibold ${toast.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default WalletFlagSection;
