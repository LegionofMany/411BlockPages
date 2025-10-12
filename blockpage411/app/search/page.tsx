  "use client";
  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Navbar from "../components/Navbar";
  import Footer from "../components/Footer";


  export default function Search() {
    const [searchTerm, setSearchTerm] = useState("");
    const [chain, setChain] = useState("ethereum");
    const [error, setError] = useState<string | null>(null);
    const [detectedChain, setDetectedChain] = useState<string | null>(null);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const term = searchTerm.trim();
      if (!term) return;

      // Simple address validators for major chains
      const isEvm = /^0x[a-fA-F0-9]{40}$/.test(term);
      const isBitcoin = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[0-9a-z]{25,39})$/i.test(term);
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(term);
      const isTron = /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(term);
      const isXrp = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(term);

      const evmChains = ['ethereum','bsc','polygon','arbitrum','optimism'];

      // If the input looks like an address for any chain, enforce correct chain selection.
      if (isEvm || isBitcoin || isSolana || isTron || isXrp) {
        let matchesSelected = false;
        let detected: string | null = null;
        if (isEvm) { detected = 'ethereum'; if (evmChains.includes(chain)) matchesSelected = true; }
        if (isBitcoin) { detected = 'bitcoin'; if (chain === 'bitcoin') matchesSelected = true; }
        if (isSolana) { detected = 'solana'; if (chain === 'solana') matchesSelected = true; }
        if (isTron) { detected = 'tron'; if (chain === 'tron') matchesSelected = true; }
        if (isXrp) { detected = 'xrp'; if (chain === 'xrp') matchesSelected = true; }

        if (!matchesSelected) {
          // Save detected chain so we can offer a quick switch
          setDetectedChain(detected);
          setError(`Wrong wallet address for selected chain. Detected: ${detected ?? 'unknown'}.`);
          return;
        }
        setDetectedChain(null);
      }

      router.push(`/wallet/${chain}/${term}`);
    };

    const chains = [
      { value: "ethereum", label: "Ethereum" },
      { value: "bitcoin", label: "Bitcoin" },
      { value: "bsc", label: "BNB Chain" },
      { value: "polygon", label: "Polygon" },
      { value: "arbitrum", label: "Arbitrum" },
      { value: "optimism", label: "Optimism" },
      { value: "solana", label: "Solana" },
      { value: "tron", label: "Tron" },
      { value: "xrp", label: "XRP" },
      // Add more supported chains as needed
    ];

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar variant="search" />
        <main className="flex-1 flex flex-col items-center justify-center w-full px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white">
            Explore the Blockchain
          </h1>
          <p className="text-xl md:text-2xl text-cyan-200 mb-8">
            Search for any wallet address to view its profile and reputation.
          </p>
          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl flex items-center bg-gray-800/50 rounded-full shadow-2xl border-2 border-blue-700"
          >
            <select
              value={chain}
              onChange={e => setChain(e.target.value)}
              className="bg-gray-900 text-white px-4 py-4 rounded-l-full border-none focus:outline-none font-bold"
              style={{ minWidth: 140 }}
            >
              {chains.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter wallet address, ENS, or name"
              className="w-full bg-transparent text-white px-6 py-4 rounded-none focus:outline-none placeholder-gray-400"
              style={{ borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px' }}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-full ml-2 hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              Search
            </button>
          </form>
          {error && (
            <div className="mt-4 text-sm text-red-300 font-medium">
              {error}
              {detectedChain && (
                <div className="mt-2">
                  <button
                    className="ml-2 px-3 py-1 rounded bg-cyan-700 text-white text-xs font-bold"
                    onClick={() => {
                      setChain(detectedChain);
                      setError(null);
                      // perform search immediately with the corrected chain
                      router.push(`/wallet/${detectedChain}/${searchTerm.trim()}`);
                    }}
                  >Switch to {detectedChain}</button>
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }
