  "use client";
  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Navbar from "../components/Navbar";
  import Footer from "../components/Footer";


  export default function Search() {
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        router.push(`/wallet/ethereum/${searchTerm.trim()}`);
      }
    };

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
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter wallet address, ENS, or name"
                  className="w-full bg-transparent text-white px-6 py-4 rounded-full focus:outline-none placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-full hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                >
                  Search
                </button>
              </form>
            </main>
            <Footer />
          </div>    );
  }
