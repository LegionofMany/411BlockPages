"use client";

import React from "react";
import type { RiskCategory } from "../services/risk/calculateRiskScore";

export interface RiskBadgeProps {
  score: number | null | undefined;
  category: RiskCategory | null | undefined;
  compact?: boolean;
}

function getLabel(category: RiskCategory | null | undefined): string {
  if (!category) return "Unknown";
  if (category === "green") return "Low Risk";
  if (category === "yellow") return "Medium Risk";
  return "High Risk";
}

function getColors(category: RiskCategory | null | undefined): string {
  switch (category) {
    case "green":
      return "bg-emerald-500/15 text-emerald-200 border border-emerald-400/60";
    case "yellow":
      return "bg-amber-500/15 text-amber-200 border border-amber-400/60";
    case "red":
      return "bg-red-500/15 text-red-200 border border-red-400/60";
    default:
      return "bg-slate-700/50 text-slate-200 border border-slate-500/60";
  }
}

export default function RiskBadge({ score, category, compact }: RiskBadgeProps) {
  const pct = typeof score === "number" ? Math.round(Math.max(0, Math.min(100, score))) : null;
  const label = getLabel(category);
  const colors = getColors(category);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${colors}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {!compact && <span>{label}</span>}
      {pct !== null && <span className="opacity-80">{pct}</span>}
    </span>
  );
}
