  "use client";
  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Navbar from "../components/Navbar";
  import Footer from "../components/Footer";


  export default function SearchPage() {
    const [address, setAddress] = useState("");
    const [chain, setChain] = useState("ethereum");
      type SearchProfile = {
        address: string;
        chain: string;
        ens?: string;
        avgRating?: number;
        nftCount?: number;
        statusTags?: string[];
      };
      const [results, setResults] = useState<SearchProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSearch(e: React.FormEvent) {
      e.preventDefault();
      if (!address.trim()) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/search?q=${address.trim()}&chain=${chain}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setError("Failed to fetch search results");
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="min-h-screen bg-darkbg flex flex-col">
        <Navbar variant="search" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative z-10 bg-darkbg-light rounded-2xl shadow-card w-full max-w-md flex flex-col items-center animate-fade-in border-2 border-blue-800 p-6">
            {/* Icon and Title */}
            <div className="mb-6 flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-accent-indigo shadow-xl border-4 border-blue-700">
                <span className="text-darktext text-3xl select-none">🔍</span>
              </div>
              <h1 className="text-3xl font-extrabold text-darktext tracking-tight mb-1">Search Wallet</h1>
              <p className="text-darktext/80 text-sm font-medium text-center max-w-xs">
                Enter a wallet address and select a chain (Ethereum, BSC, Polygon, Bitcoin, Solana, or Tron) to view its reputation, flags, ratings, and transaction history.
              </p>
            </div>
            <form onSubmit={handleSearch} className="w-full flex flex-col items-center gap-4">
              <div className="w-full flex flex-col gap-2">
                <label className="text-darktext font-semibold mb-1" htmlFor="chain">Select Chain</label>
                <select
                  id="chain"
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-700 bg-darkbg-accent text-darktext focus:outline-none focus:ring-2 focus:ring-accent-cyan transition-all duration-200 hover:border-accent-cyan hover:bg-darkbg-light"
                  value={chain}
                  onChange={e => setChain(e.target.value)}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="bsc">Binance Smart Chain</option>
                  <option value="polygon">Polygon</option>
                  <option value="bitcoin">Bitcoin</option>
                  <option value="solana">Solana</option>
                  <option value="tron">Tron</option>
                  <option value="xrp">XRP</option>
                </select>
              </div>
              <div className="w-full flex items-center bg-darkbg-accent border-2 border-blue-700 rounded-full shadow-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                <span className="text-accent-cyan text-xl mr-2">🔎</span>
                <input
                  className="flex-1 bg-transparent outline-none text-darktext font-mono text-base placeholder-blue-200 px-2"
                  placeholder={
                    chain === "bitcoin"
                      ? "e.g. 1A1zP1... (BTC address)"
                      : chain === "bsc"
                      ? "e.g. 0x1234...abcd (BSC address)"
                      : chain === "polygon"
                      ? "e.g. 0x1234...abcd (Polygon address)"
                      : chain === "solana"
                      ? "e.g. 4Nd1m... (Solana address)"
                      : chain === "tron"
                      ? "e.g. TQJt... (Tron address)"
                      : chain === "xrp"
                      ? "e.g. rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv (XRP address)"
                      : "e.g. 0x1234...abcd (Ethereum address)"
                  }
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  autoFocus
                  spellCheck={false}
                  maxLength={44}
                />
                <button
                  className="ml-2 bg-accent-blue hover:bg-accent-cyan text-darkbg font-semibold px-5 py-2 rounded-full shadow transition-all duration-150 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={!address.trim()}
                >
                  Search
                </button>
              </div>
            </form>
            {/* Search Results Section */}
            {loading && <div className="mt-4 text-blue-400">Loading...</div>}
            {error && <div className="mt-4 text-red-400">{error}</div>}
            {results.length > 0 && (
              <div className="mt-6 w-full">
                <h2 className="text-lg font-bold text-blue-300 mb-2">Search Results</h2>
                <ul className="space-y-4">
                  {results.map((profile, i) => (
                    <li key={i} className="bg-gray-900 border border-blue-700 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-200 text-base">{profile.address}</span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-800 text-blue-200">{profile.chain}</span>
                        {profile.statusTags && profile.statusTags.map((tag:string, j:number) => (
                          <span key={j} className={`text-xs px-2 py-1 rounded font-bold ${tag.includes('Blacklisted') ? 'bg-red-700 text-red-100' : tag.includes('Flagged') ? 'bg-yellow-700 text-yellow-100' : tag.includes('Verified') ? 'bg-green-700 text-green-100' : 'bg-blue-700 text-blue-100'}`}>{tag}</span>
                        ))}
                      </div>
                      {profile.ens && <div className="text-blue-300 text-sm">ENS: {profile.ens}</div>}
                      {profile.avgRating !== undefined && <div className="text-blue-300 text-sm">Avg Rating: {profile.avgRating}</div>}
                      {profile.nftCount !== undefined && <div className="text-blue-300 text-sm">NFTs: {profile.nftCount}</div>}
                      <button className="mt-2 px-3 py-1 rounded bg-blue-700 text-white font-bold" onClick={()=>router.push(`/wallet/${profile.chain}/${profile.address}`)}>View Profile</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* Animation keyframes */}
        <style>{`
          .animate-fade-in {
            animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to { opacity: 1; transform: none; }
          }
        `}</style>
        <Footer />
      </div>
    );
  }

