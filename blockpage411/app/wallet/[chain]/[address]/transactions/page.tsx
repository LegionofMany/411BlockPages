"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import Footer from "../../../../components/Footer";
import TransactionList from "../TransactionList";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WalletTransactionsPage() {
  const params = useParams();
  // @ts-expect-error params type is not inferred correctly by Next.js router
  const { chain, address } = params;
  const { data, error } = useSWR(`/api/wallet/${chain}/${address}`, fetcher);
  const router = useRouter();

  if (error) return <div className="text-center py-10 text-red-400">Failed to load transactions.</div>;
  if (!data) return <div className="text-center py-10 text-cyan-200">Loading...</div>;

    return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="flex-1 w-full max-w-4xl px-4 py-8 mt-16">
        <div className="bg-gray-900/80 rounded-2xl shadow-2xl p-8 border-2 border-blue-700">
          <h2 className="text-2xl font-bold text-cyan-300 mb-6">Recent Transactions</h2>
          <TransactionList transactions={data?.transactions} />
          <button className="mt-8 btn-primary bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 transform hover:scale-105 py-2 px-6 font-bold" onClick={() => router.back()}>
            Back to Wallet Profile
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
