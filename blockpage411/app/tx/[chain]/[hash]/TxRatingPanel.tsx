'use client';

import React from 'react';

type Props = {
  chain: string;
  txHash: string;
  from: string;
};

type RatingsResponse = {
  avgScore: number;
  count: number;
  ratings: Array<{ rater: string; score: number; text?: string; createdAt?: string; updatedAt?: string }>;
};

export default function TxRatingPanel({ chain, txHash, from }: Props) {
  const [me, setMe] = React.useState<{ address: string } | null>(null);
  const [meLoading, setMeLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<RatingsResponse | null>(null);
  const [score, setScore] = React.useState<number>(5);
  const [text, setText] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isOwner = me?.address && from && me.address.toLowerCase() === from.toLowerCase();

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tx/ratings?chain=${encodeURIComponent(chain)}&txHash=${encodeURIComponent(txHash)}`);
      if (!res.ok) throw new Error('Failed to load ratings');
      const js = (await res.json()) as RatingsResponse;
      setData(js);
    } catch (e: any) {
      setData(null);
      setError(e?.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setMeLoading(true);
      try {
        const r = await fetch('/api/me');
        if (!r.ok) {
          if (!cancelled) setMe(null);
          return;
        }
        const js = (await r.json()) as any;
        if (!cancelled && js?.address) setMe({ address: String(js.address) });
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, txHash]);

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/tx/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, txHash, score, text }),
      });
      const js = await r.json().catch(() => ({} as any));
      if (!r.ok) throw new Error(js?.message || 'Failed to save rating');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to save rating');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-50">Transaction rating</h2>
      <p className="mt-1 text-sm text-slate-200/80">
        Ratings are limited to the connected wallet that sent this transaction.
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        {loading ? <div className="text-sm text-slate-200/80">Loading…</div> : null}
        {!loading && data ? (
          <div className="flex items-center gap-3 text-sm text-slate-50">
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
              Avg {data.avgScore ? data.avgScore.toFixed(2) : '0.00'}
            </span>
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">{data.count} ratings</span>
          </div>
        ) : null}

        {error ? <div className="mt-3 text-sm text-rose-300">{error}</div> : null}

        {!meLoading && isOwner ? (
          <form onSubmit={submitRating} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200/80">Score</label>
              <select
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-50"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200/80">Note (optional)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-50"
                placeholder="Add context (e.g., payment, transfer to exchange, etc.)"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save rating'}
            </button>
          </form>
        ) : null}

        {!meLoading && !isOwner ? (
          <div className="mt-4 text-sm text-slate-200/80">
            {me ? 'Connect the sending wallet to rate this transaction.' : 'Log in to rate transactions you sent.'}
          </div>
        ) : null}
      </div>
    </section>
  );
}
