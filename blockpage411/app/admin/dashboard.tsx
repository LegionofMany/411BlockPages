// app/admin/dashboard.tsx
import useSWR from 'swr';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function fetcher(url: string) {
  return fetch(url).then(res => res.json());
}

export default function AdminDashboard() {
  const { data, error } = useSWR('/api/admin/summary', fetcher);
  if (error) return <div>Error loading dashboard.</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col items-center">
      <Navbar variant="admin" />
      <div className="max-w-3xl w-full bg-gray-900/80 rounded-2xl shadow-xl mt-10 p-8 flex flex-col items-center border border-blue-700">
        <h1 className="text-2xl font-bold text-yellow-300 mb-6">Admin Dashboard</h1>
        <div className="w-full mb-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-2">Suspicious Wallets</h2>
          <ul className="space-y-2">
            {data.suspicious.map((wallet: { address: string; chain: string; flags?: string[]; blacklisted?: boolean }) => (
              <li key={wallet.address + wallet.chain} className="bg-red-900/40 border border-red-700 rounded p-3 flex flex-col gap-1">
                <span className="text-yellow-100 text-sm">{wallet.address} ({wallet.chain})</span>
                <span className="text-red-300 text-xs">Flags: {wallet.flags?.length || 0}</span>
                <span className="text-red-200 text-xs">Blacklisted: {wallet.blacklisted ? 'Yes' : 'No'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full mb-6">
          <h2 className="text-lg font-semibold text-green-300 mb-2">Popular Wallets</h2>
          <ul className="space-y-2">
            {data.popular.map((wallet: { address: string; chain: string; flags?: string[]; blacklisted?: boolean }) => (
              <li key={wallet.address + wallet.chain} className="bg-green-900/40 border border-green-700 rounded p-3 flex flex-col gap-1">
                <span className="text-yellow-100 text-sm">{wallet.address} ({wallet.chain})</span>
                <span className="text-green-300 text-xs">Flags: {wallet.flags?.length || 0}</span>
                <span className="text-green-200 text-xs">Blacklisted: {wallet.blacklisted ? 'Yes' : 'No'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full mb-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-2">Flag & Rating Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-yellow-200 font-bold mb-2">Recent Flags</h3>
              <ul className="space-y-2">
                {data.flags.map((flag: { _id: string; address: string; chain: string; reason?: string; comment?: string }) => (
                  <li key={flag._id} className="bg-yellow-900/40 border border-yellow-700 rounded p-3">
                    <span className="text-yellow-100 text-sm">Wallet: {flag.address} ({flag.chain})</span><br/>
                    <span className="text-yellow-200 text-xs">Reason: {flag.reason}</span><br/>
                    {flag.comment && <span className="text-blue-200 text-xs">Comment: {flag.comment}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-green-200 font-bold mb-2">Recent Ratings</h3>
              <ul className="space-y-2">
                {data.ratings.map((rating: { _id: string; address: string; chain: string; score: number; text?: string }) => (
                  <li key={rating._id} className="bg-green-900/40 border border-green-700 rounded p-3">
                    <span className="text-green-100 text-sm">Wallet: {rating.address} ({rating.chain})</span><br/>
                    <span className="text-green-200 text-xs">Score: {rating.score}</span><br/>
                    {rating.text && <span className="text-blue-200 text-xs">Comment: {rating.text}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
