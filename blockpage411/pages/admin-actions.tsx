import { useEffect, useState } from "react";
// Types for admin actions
type AdminAction = {
  admin: string;
  action: string;
  target: string;
  reason: string;
  date?: string;
};
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";

export default function AdminActionsPage() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchActions() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin-actions");
        if (!res.ok) throw new Error("Failed to fetch actions");
        const data = await res.json();
        setActions(data.actions || []);
      } catch (e: unknown) {
        if (e instanceof Error) setError(e.message);
        else setError("Error loading actions");
      } finally {
        setLoading(false);
      }
    }
    fetchActions();
  }, []);

  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col text-cyan-100">
  <Navbar variant="wallet" />
      <main className="flex-1 flex flex-col items-center py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Action Log</h1>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        <ul className="w-full max-w-2xl divide-y divide-blue-200 bg-gray-900/60 rounded-lg border border-blue-200">
          {actions.map((a, i) => (
            <li key={i} className="p-3 flex flex-col gap-1">
              <span><b>Admin:</b> {a.admin}</span>
              <span><b>Action:</b> {a.action}</span>
              <span><b>Target:</b> {a.target}</span>
              <span><b>Reason:</b> {a.reason}</span>
              <span><b>Timestamp:</b> {a.date ? new Date(a.date).toLocaleString() : 'N/A'}</span>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
