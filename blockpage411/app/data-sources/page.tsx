import React from 'react';

export default function DataSourcesPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Data Sources</h1>
      <p className="mt-4">We aggregate publicly available sources. Each claim is attributed to the original source and raw snapshots are stored for auditability.</p>
      <ul className="mt-4 list-disc pl-6 text-sm">
        <li>BitcoinAbuse (public reports)</li>
        <li>Chainabuse (multi-chain community reports)</li>
        <li>Etherscan public labels</li>
        <li>OFAC sanctioned lists (public)</li>
        <li>Curated community repos on GitHub</li>
      </ul>
      <p className="mt-4 text-xs text-slate-400">We do not use leaked or private datasets.</p>
    </div>
  );
}
