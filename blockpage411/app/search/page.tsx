  "use client";
  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Navbar from "../components/Navbar";
  import Footer from "../components/Footer";


  export default function Search() {
    const [searchTerm, setSearchTerm] = useState("");
    const [chain, setChain] = useState("ethereum");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        router.push(`/wallet/${chain}/${searchTerm.trim()}`);
      }
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
        </main>
        <Footer />
      </div>
    );
  }
