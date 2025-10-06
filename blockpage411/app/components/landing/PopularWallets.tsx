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
    <section className="w-full max-w-6xl mx-auto text-center py-16">
      <h2 className="text-4xl font-bold mb-8 text-cyan-200">Trending Wallets</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {(Array.isArray(wallets) && wallets.length > 0) ? (
          wallets.map((wallet) => (
            <div key={wallet.address} className="bg-gray-800/50 p-4 rounded-lg shadow-lg hover:bg-gray-700/50 transition-colors duration-200">
              <p className="text-lg font-bold text-white truncate">{wallet.address}</p>
              <p className="text-sm text-gray-400">Searches: {wallet.searchCount}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-cyan-400 text-lg py-8">No popular wallets found.</div>
        )}
      </div>
    </section>
  );
}
