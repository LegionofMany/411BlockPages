import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type SuspiciousWallet = {
  address: string;
  suspicionReason?: string;
  suspiciousAt?: string | number | Date;
};

export default function SuspiciousWalletsDashboard() {
  const [wallets, setWallets] = useState<SuspiciousWallet[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchWallets() {
      setLoading(true);
      const res = await fetch("/api/wallet/suspicious");
      const data = await res.json();
      setWallets(data.wallets || []);
      setLoading(false);
    }
    fetchWallets();
  }, []);
  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col text-cyan-100">
      <Navbar variant="wallet" />
      <main className="flex-1 flex flex-col items-center py-8">
        <h1 className="text-2xl font-bold mb-4">Suspicious Wallets</h1>
        {loading ? <div>Loading...</div> : (
          <table className="w-full max-w-4xl text-sm bg-gray-900/60 rounded-lg border border-red-700">
            <thead>
              <tr>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Flagged At</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w, i) => (
                <tr key={i} className="border-b border-red-800">
                  <td className="px-3 py-2 font-mono">{w.address}</td>
                  <td className="px-3 py-2">{w.suspicionReason || "-"}</td>
                  <td className="px-3 py-2">{w.suspiciousAt ? new Date(w.suspiciousAt).toLocaleString() : '-'}</td>
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
