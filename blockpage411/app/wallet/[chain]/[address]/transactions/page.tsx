"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Footer from "../../../../components/Footer";
import dynamic from 'next/dynamic';
import TransactionListSkeleton from '../TransactionListSkeleton';

const TransactionList = dynamic(() => import('../TransactionList'), {
  ssr: false,
  loading: () => <TransactionListSkeleton />,
});

export default function WalletTransactionsPage() {
  const params = useParams();
  // @ts-expect-error params type is not inferred correctly by Next.js router
  const { chain, address } = params;
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPage(p = 1) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/${chain}/${encodeURIComponent(address)}?page=${p}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const js = await res.json();
      const txs = Array.isArray(js.transactions) ? js.transactions : [];
      if (p === 1) setTransactions(txs);
      else setTransactions((prev) => [...prev, ...txs]);
      setHasMore(Boolean(js.pagination && js.pagination.hasMore));
      setPage(p);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, address]);

  if (error) return <div className="text-center py-10 text-red-400">{error}</div>;
  if (!transactions.length && loading) return <div className="text-center py-10 text-cyan-200">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="flex-1 w-full max-w-3xl px-4 py-8 mt-8 sm:mt-16">
        <div className="bg-gray-900 rounded-xl shadow-md p-6 border border-slate-800" style={{ boxShadow: '0 6px 18px rgba(2,6,23,0.6)' }}>
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">Recent Transactions</h2>
          <TransactionList transactions={transactions} />
          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              {loading && <span className="text-sm text-slate-400">Loading…</span>}
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-cyan-300 text-sm" onClick={() => router.back()}>
                Back
              </button>
              {hasMore ? (
                <button disabled={loading} onClick={() => loadPage(page + 1)} className="px-4 py-2 rounded bg-emerald-500 text-white text-sm" style={{ boxShadow: '0 18px 46px rgba(16,185,129,0.25)' }}>
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
