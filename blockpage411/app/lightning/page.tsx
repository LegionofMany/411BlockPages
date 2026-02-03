import React, { Suspense } from 'react';
import LightningClient from './LightningClient';

export default function LightningPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ background: '#020617', color: '#f8fafc' }}>
          <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-200">
              Loading Lightning…
            </div>
          </main>
        </div>
      }
    >
      <LightningClient />
    </Suspense>
  );
}
