import React from 'react';

export default function TransactionListSkeleton() {
  return (
    <div className="mt-6 w-full text-left" aria-hidden>
      <h3 className="text-cyan-300 font-semibold mb-2">Recent Transactions</h3>
      <ul className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="bg-gray-800/60 border border-blue-800 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-full mb-2 max-w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-full mb-2 max-w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
