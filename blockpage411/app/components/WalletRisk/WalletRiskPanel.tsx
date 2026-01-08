"use client";

import React from 'react';

export default function WalletRiskPanel({ risk_score, risk_level, flags, behavior_signals }: any) {
  const color = risk_level === 'high' ? 'text-red-400' : risk_level === 'medium' ? 'text-amber-300' : 'text-green-400';
  return (
    <section className="rounded-xl border p-4 bg-black/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Risk Score</h3>
          <div className={`text-3xl font-bold ${color}`}>{risk_score ?? 0}</div>
          <div className="text-xs text-slate-400">{risk_level?.toUpperCase()}</div>
        </div>
        <div className="text-sm text-slate-300 max-w-md">
          <p>Risk signals derive from public reports and on-chain analysis. A higher
          score indicates greater exposure; this is not a determination of guilt.</p>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-xs font-semibold text-slate-300">Flags & Sources</h4>
        {(!flags || flags.length === 0) && <div className="text-xs text-slate-500">No public flags recorded.</div>}
        {flags && flags.length > 0 && (
          <table className="w-full text-xs mt-2">
            <thead className="text-slate-400"><tr><th>Source</th><th>Category</th><th>Confidence</th><th>First seen</th></tr></thead>
            <tbody>
              {flags.map((f: any, i: number) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-1">{f.source}</td>
                  <td>{f.category}</td>
                  <td>{f.confidence}</td>
                  <td>{new Date(f.first_seen).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        <div>Behavior signals: rapid fund hopping: {behavior_signals?.rapid_fund_hopping ? 'Yes' : 'No'}</div>
        <div>Mixer proximity: {behavior_signals?.mixer_proximity ? 'Yes' : 'No'}</div>
        <div>Scam cluster exposure: {behavior_signals?.scam_cluster_exposure_score ?? 0}</div>
      </div>
    </section>
  );
}
