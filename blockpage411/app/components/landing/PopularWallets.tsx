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

  const WalletCard = ({ wallet }: { wallet: Wallet }) => (
    <div
      className="group relative p-6 rounded-3xl backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-2"
      style={{
        backgroundColor: "rgba(0,0,0,0.86)",
        border: "none",
      }}
    >
      <p className="text-lg font-bold truncate mb-2" style={{ color: 'var(--section-text)' }}>{wallet.address}</p>
      <p className="text-sm font-mono" style={{ color: 'var(--muted-text)' }}>Searches: {wallet.searchCount}</p>
      <span
        aria-hidden="true"
        className="absolute top-6 right-6 text-slate-500 transition-transform duration-300 transform group-hover:rotate-[-45deg]"
        style={{ color: 'rgba(203,213,225,0.7)' }}
      >
        e
      </span>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="p-6 rounded-3xl bg-white/5/ bg-opacity-5 backdrop-blur-2xl animate-pulse" style={{ border: "none" }}>
      <div className="h-7 bg-slate-700/50 rounded w-3/4 mb-3"></div>
      <div className="h-5 bg-slate-700/50 rounded w-1/2"></div>
    </div>
  );

  return (
    <section
      className="w-full max-w-7xl mx-auto text-center py-20 px-4"
      style={{
        color: "#e6d6a7",
        border: "none",
      }}
    >
      <h2 className="text-4xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
        Trending Wallets
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} />)
        ) : Array.isArray(wallets) && wallets.length > 0 ? (
          wallets.slice(0, 6).map((wallet) => (
            <WalletCard key={wallet.address} wallet={wallet} />
          ))
        ) : (
          <div className="col-span-full text-slate-400 text-lg py-8">No popular wallets found.</div>
        )}
      </div>
    </section>
  );
}
