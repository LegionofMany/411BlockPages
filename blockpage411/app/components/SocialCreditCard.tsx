"use client";

import React, { useMemo, useState } from 'react';
import type { SocialCreditScoreResult } from '../../services/socialCreditScore';

type Props = {
  score: SocialCreditScoreResult | null | undefined;
  onEnroll: () => Promise<void> | void;
  enrollLabel?: string;
};

function pct(v: number, max: number) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (v / max) * 100));
}

export default function SocialCreditCard({ score, onEnroll, enrollLabel = 'Enroll' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = score?.total ?? 0;
  const maxTotal = score?.maxTotal ?? 795;

  const percent = useMemo(() => pct(total, maxTotal), [total, maxTotal]);
  const barColor = percent >= 85 ? 'from-emerald-400 to-lime-300'
    : percent >= 60 ? 'from-cyan-400 to-emerald-400'
    : percent >= 35 ? 'from-amber-400 to-orange-400'
    : 'from-rose-400 to-red-500';

  return (
    <section className="rounded-[1.25rem] border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Social Credit Score</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-slate-100">{total}</div>
            <div className="text-sm text-slate-400">/ {maxTotal}</div>
          </div>
          <div className="mt-1 text-xs text-slate-300">
            {score?.discordEligible ? 'Discord unlocked · Highest trust tier' : 'Complete Base sign-in + all fields to unlock Discord'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
          >
            {expanded ? 'Hide breakdown' : 'Show breakdown'}
          </button>
          <button
            type="button"
            onClick={() => onEnroll()}
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {enrollLabel}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-3 w-full rounded-full bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{score ? `${score.completedTabs}/${score.totalTabs} fields completed` : 'Loading…'}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      </div>

      {expanded && score && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-black/30">
          <div className="max-h-56 overflow-y-auto p-3">
            <div className="grid grid-cols-1 gap-2">
              {score.components.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate">{c.label}</div>
                    {c.detail ? <div className="text-[11px] text-slate-400 truncate">{c.detail}</div> : null}
                  </div>
                  <div className="shrink-0 text-xs font-bold text-slate-100">
                    <span className={c.points > 0 ? 'text-emerald-300' : c.points < 0 ? 'text-rose-300' : 'text-slate-400'}>
                      {c.points}
                    </span>
                    <span className="text-slate-500">/{c.maxPoints}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
