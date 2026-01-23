"use client";
import React, { useEffect, useState } from "react";
import AdminGate from "../../components/admin/AdminGate";
import adminFetch from '../../components/admin/adminFetch';

export default function KycReview() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/pending-socials');
        if (!res.ok) {
          setError('Failed to load pending verifications');
          return;
        }
        const data = await res.json();
        setItems(data.users || []);
      } catch (e) {
        setError('Network error');
      }
      setLoading(false);
    })();
  }, []);

  async function approve(address: string, platform: string, handle: string) {
    try {
      const res = await adminFetch('/api/admin/approve-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, platform, handle }),
      });
      if (res.status === 403) {
        setError('Not authorized — connect admin wallet or set localStorage.wallet');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Approve failed');
        return;
      }
      // Remove the approved handle from the matching user in state
      setItems((prev) =>
        prev
          .map((u) => {
            if (u.address !== address) return u;
            const remaining = (u.pendingSocialVerifications || []).filter(
              (p: any) => !(p.platform === platform && p.handle === handle)
            );
            return { ...u, pendingSocialVerifications: remaining };
          })
          .filter((u) => (u.pendingSocialVerifications || []).length > 0)
      );
    } catch (err) {
      setError('Network error');
    }
  }

  async function reject(address: string, platform: string, handle: string) {
    try {
      const res = await adminFetch('/api/admin/reject-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, platform, handle }),
      });
      if (res.status === 403) {
        setError('Not authorized — connect admin wallet or set localStorage.wallet');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Reject failed');
        return;
      }
      // Remove the rejected handle from the matching user in state
      setItems((prev) =>
        prev
          .map((u) => {
            if (u.address !== address) return u;
            const remaining = (u.pendingSocialVerifications || []).filter(
              (p: any) => !(p.platform === platform && p.handle === handle)
            );
            return { ...u, pendingSocialVerifications: remaining };
          })
          .filter((u) => (u.pendingSocialVerifications || []).length > 0)
      );
    } catch (err) {
      setError('Network error');
    }
  }

  return (
    <AdminGate title="Admin — KYC Review">
      <section className="mb-6 max-w-5xl">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-100 mb-1">
          Pending Social Verifications
        </h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-300/90 max-w-prose">
            Review user-submitted proofs for social handles linked to wallets.
            Approve only when you&apos;re confident the handle belongs to the
            address owner.
          </p>
          <div className="ml-auto flex gap-3">
            <div className="rounded-full bg-emerald-600/20 px-3 py-1 text-sm text-emerald-200">
              Users: {items.length}
            </div>
            <div className="rounded-full bg-yellow-600/10 px-3 py-1 text-sm text-yellow-200">
              Handles: {items.reduce((acc, u) => acc + ((u.pendingSocialVerifications || []).length || 0), 0)}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-sm text-slate-300">Loading pending social verifications…</div>
      ) : null}

      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : null}

      <section className="max-w-5xl">
        {!loading && !error && items.length === 0 ? (
          <div className="rounded-3xl border border-slate-600/60 bg-black/60 px-4 py-6 text-sm text-slate-200">
            No pending items right now. New submissions will appear here in
            real-time.
          </div>
        ) : !loading && !error ? (
          <div className="space-y-4">
            {items.map((u, i) => (
              <div
                key={i}
                className="rounded-3xl border border-emerald-500/40 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] px-4 py-3"
              >
                <div className="text-xs font-mono text-emerald-100 break-all mb-2">
                  {u.address}
                </div>
                <div className="mt-1 space-y-2">
                  {(u.pendingSocialVerifications || []).map(
                    (p: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-2xl bg-slate-950/70 border border-slate-700/70 px-3 py-2"
                      >
                        <div className="text-xs text-slate-200">
                          <span className="font-semibold text-emerald-200">
                            {p.platform}
                          </span>
                          : <span className="font-mono">{p.handle}</span>
                          {p.adminRequested ? (
                            <span className="ml-2 inline-block rounded-full bg-yellow-500/90 text-black px-2 text-[11px] font-medium">New</span>
                          ) : null}
                          {p.code ? <span className="text-slate-400"> · code: {p.code}</span> : null}
                        </div>
                        <div className="flex justify-end">
                          <div className="flex gap-2">
                          <button
                            className="inline-flex items-center rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-medium text-black hover:bg-emerald-400 transition-colors"
                            onClick={() =>
                              approve(u.address, p.platform, p.handle)
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="inline-flex items-center rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-500 transition-colors"
                            onClick={() => reject(u.address, p.platform, p.handle)}
                          >
                            Reject
                          </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </AdminGate>
  );
}
