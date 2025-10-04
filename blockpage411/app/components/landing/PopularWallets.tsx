"use client";
import { useEffect, useState } from "react";

interface Wallet {
  address: string;
  searchCount: number;
  lastRefreshed: string;
  popular: boolean;
}

export default function PopularWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopularWallets() {
      try {
        setLoading(true);
        const res = await fetch("/api/wallet/popular");
        const data = await res.json();
        setWallets(data.wallets);
      } catch (error) {
        console.error("Failed to fetch popular wallets", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPopularWallets();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-cyan-200">Loading Popular Wallets...</div>;
  }

  return (
    <section className="w-full max-w-5xl mx-auto text-center py-16">
      <h2 className="text-4xl font-bold mb-8 text-cyan-200">Popular Wallets</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wallets.map((wallet) => (
          <div key={wallet.address} className="bg-gray-800/50 p-4 rounded-lg shadow-lg">
            <p className="text-lg font-bold text-white truncate">{wallet.address}</p>
            <p className="text-sm text-gray-400">Search Count: {wallet.searchCount}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
