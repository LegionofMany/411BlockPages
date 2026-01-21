"use client";

import React from 'react';

type Props = {
  score: number | null;
  variant?: 'gauge' | 'stars';
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function labelFor(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Mixed';
  if (score >= 20) return 'Caution';
  return 'High risk signals';
}

function starsFor(score: number): number {
  // 0..100 -> 1..5 (unknown handled separately)
  const s = clamp(score, 0, 100);
  if (s >= 85) return 5;
  if (s >= 70) return 4;
  if (s >= 50) return 3;
  if (s >= 30) return 2;
  return 1;
}

export function ReputationGauge({ score, variant = 'gauge' }: Props) {
  if (score == null || !Number.isFinite(score)) {
    return (
      <div>
        <div className="text-xl font-semibold text-slate-100">Unknown</div>
        <div className="text-xs text-slate-400">Not enough data to score yet.</div>
      </div>
    );
  }

  const s = clamp(Math.round(score), 0, 100);
  const label = labelFor(s);
  const color = s >= 80 ? 'bg-emerald-400' : s >= 60 ? 'bg-emerald-300' : s >= 40 ? 'bg-amber-300' : s >= 20 ? 'bg-orange-300' : 'bg-red-400';

  if (variant === 'stars') {
    const stars = starsFor(s);
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5" aria-label={`Reputation ${stars} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < stars ? 'text-amber-300' : 'text-slate-600'} aria-hidden="true">★</span>
          ))}
        </div>
        <div className="text-sm text-slate-200">{s}/100 · {label}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold text-slate-100">{s}/100</div>
        <div className="text-xs font-semibold text-slate-200">{label}</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
        <div className={`h-full ${color}`} style={{ width: `${s}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-400">This is a risk signal, not an accusation.</div>
    </div>
  );
}
