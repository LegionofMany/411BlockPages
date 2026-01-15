"use client";

import React from "react";
import Link from "next/link";
import Footer from "../components/Footer";

type FollowedWallet = { chain?: string; address?: string; createdAt?: string };

export default function FollowWalletPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<FollowedWallet[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
        const js = await res.json().catch(() => ({} as any));
        if (cancelled) return;
        if (!res.ok) {
          setError(js?.message || res.statusText || 'Failed to load profile');
          setItems([]);
          return;
        }
        const list = Array.isArray(js?.followedWallets) ? js.followedWallets : [];
        setItems(list);
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message || 'Failed to load follows'));
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function short(addr: string) {
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto p-6 pt-6" style={{ maxWidth: '920px' }}>
        <h1 className="text-2xl font-bold">Followed wallets</h1>
        <p className="text-sm text-slate-300 mt-1">Wallets you’ve chosen to follow.</p>

        {error ? <div className="text-red-400 mt-4">{error}</div> : null}
        {loading ? <div className="text-slate-300 mt-4">Loading…</div> : null}

        {!loading && !error && (
          <div className="mt-6 space-y-3">
            {items.length === 0 ? <div className="text-slate-400">No followed wallets yet.</div> : null}
            {items.map((w, idx) => {
              const chain = String(w.chain || 'ethereum');
              const address = String(w.address || '');
              if (!address) return null;
              return (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-100 font-semibold">{short(address)}</div>
                      <div className="text-xs text-slate-400 mt-1">{chain}</div>
                    </div>
                    <Link
                      className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                      href={`/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`}
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
