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
  const [adminWallets, setAdminWallets] = useState<string[]>([]);
  const [userAddress, setUserAddress] = useState<string>("");
  useState(() => {
    if (typeof window !== 'undefined') {
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
      setAdminWallets(envAdmins);
      setUserAddress(localStorage.getItem('walletAddress') || "");
    }
  });
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminWallets.includes(userAddress.toLowerCase())) return;
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
  }, [adminWallets, userAddress]);

  // Restrict page to admins only
  if (!adminWallets.includes(userAddress.toLowerCase())) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-cyan-200">
        <Navbar variant="wallet" />
        <h1 className="text-2xl font-bold mb-4">Admin Only</h1>
        <p className="mb-6">You must be an admin wallet to view this page.</p>
        <Footer />
      </div>
    );
  }
  // UI state for search, filter, sort, and pagination
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Filter, search, sort, paginate actions
  let filtered = actions.filter(a =>
    (!search || a.target?.toLowerCase().includes(search.toLowerCase()) || a.reason?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterAction || a.action === filterAction) &&
    (!filterAdmin || a.admin === filterAdmin)
  );
  filtered = filtered.sort((a, b) => {
    const va = a[sortBy] || "";
    const vb = b[sortBy] || "";
    if (sortDir === "asc") return va > vb ? 1 : va < vb ? -1 : 0;
    return va < vb ? 1 : va > vb ? -1 : 0;
  });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);
  // Unique actions/admins for filter dropdowns
  const actionTypes = Array.from(new Set(actions.map(a => a.action)));
  const adminList = Array.from(new Set(actions.map(a => a.admin)));
  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col text-cyan-100">
      <Navbar variant="wallet" />
      <main className="flex-1 flex flex-col items-center py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Action Log</h1>
        <div className="mb-4 flex flex-wrap gap-4 items-center w-full max-w-4xl">
          <input className="px-3 py-2 rounded border border-blue-400 bg-gray-900 text-cyan-100" placeholder="Search target or reason..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="px-3 py-2 rounded border border-blue-400 bg-gray-900 text-cyan-100" value={filterAction} onChange={e=>setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            {actionTypes.map(a=>(<option key={a} value={a}>{a}</option>))}
          </select>
          <select className="px-3 py-2 rounded border border-blue-400 bg-gray-900 text-cyan-100" value={filterAdmin} onChange={e=>setFilterAdmin(e.target.value)}>
            <option value="">All Admins</option>
            {adminList.map(a=>(<option key={a} value={a}>{a}</option>))}
          </select>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        <div className="w-full max-w-4xl overflow-x-auto">
          <table className="w-full text-sm bg-gray-900/60 rounded-lg border border-blue-200">
            <thead>
              <tr>
                <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortBy("admin");setSortDir(sortDir==="asc"?"desc":"asc")}}>Admin</th>
                <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortBy("action");setSortDir(sortDir==="asc"?"desc":"asc")}}>Action</th>
                <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortBy("target");setSortDir(sortDir==="asc"?"desc":"asc")}}>Target</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortBy("date");setSortDir(sortDir==="asc"?"desc":"asc")}}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((a, i) => (
                <tr key={i} className="border-b border-blue-800">
                  <td className="px-3 py-2 font-mono">{a.admin}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${a.action==='blacklist_wallet'?'bg-red-700 text-white':a.action==='dismiss_flag'?'bg-yellow-700 text-white':'bg-blue-700 text-white'}`}>{a.action}</span>
                  </td>
                  <td className="px-3 py-2 font-mono">{a.target}</td>
                  <td className="px-3 py-2">{a.reason}</td>
                  <td className="px-3 py-2">{a.date ? new Date(a.date).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-4 flex gap-2 items-center">
          <button className="px-3 py-1 rounded bg-blue-700 text-white font-bold" disabled={page===1} onClick={()=>setPage(page-1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button className="px-3 py-1 rounded bg-blue-700 text-white font-bold" disabled={page===totalPages} onClick={()=>setPage(page+1)}>Next</button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
