import { useEffect, useState } from "react";
import Footer from "../components/Footer";

type PopularWallet = {
  address: string;
  searchCount?: number;
  lastRefreshed?: string | number | Date;
};

export default function PopularWalletsDashboard() {
  const [wallets, setWallets] = useState<PopularWallet[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchWallets() {
      setLoading(true);
      const res = await fetch("/api/wallet/popular");
      const data = await res.json();
      setWallets(data.wallets || []);
      setLoading(false);
    }
    fetchWallets();
  }, []);
  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col text-cyan-100">
      <main className="flex-1 flex flex-col items-center py-8">
        <h1 className="text-2xl font-bold mb-4">Popular Wallets</h1>
        {loading ? <div>Loading...</div> : (
          <table className="w-full max-w-4xl text-sm bg-gray-900/60 rounded-lg border border-yellow-700">
            <thead>
              <tr>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Search Count</th>
                <th className="px-3 py-2">Last Refreshed</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w, i) => (
                <tr key={i} className="border-b border-yellow-800">
                  <td className="px-3 py-2 font-mono">{w.address}</td>
                  <td className="px-3 py-2">{w.searchCount || "-"}</td>
                  <td className="px-3 py-2">{w.lastRefreshed ? new Date(w.lastRefreshed).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
      <Footer />
    </div>
  );
}
