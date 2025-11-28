import React from 'react';

export default function DonationSectionSkeleton() {
  return (
    <div className="mt-6 w-full text-left" aria-hidden>
      <h3 className="text-cyan-300 font-semibold mb-4">Support this wallet</h3>
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <article key={i} className="bg-gray-800/60 border border-slate-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </article>
        ))}
      </div>
    </div>
  );
}
