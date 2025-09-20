
"use client";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  return (
  <div className="min-h-screen bg-blockchain-gradient text-white flex flex-col">
      <Navbar variant="landing" />
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <section className="w-full max-w-3xl mx-auto text-center py-24">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-xl mb-6 animate-fade-in">
            The Premier 411 for the Blockchain
          </h1>
          <p className="text-xl md:text-2xl text-cyan-100 font-medium mb-10 animate-fade-in delay-100">
            A professional, multi-chain directory for blockchain wallets. Search, flag, and rate wallet addresses to build trust and reputation in Web3.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="btn-primary text-lg shadow-xl animate-fade-in delay-200"
          >
            Get Started
          </button>
        </section>

        {/* Supported Chains Section */}
        <section className="w-full max-w-5xl mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">Supported Chains</h2>
            <p className="text-lg text-cyan-100">We support a growing number of blockchains, with more to come.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {[
              { name: 'Bitcoin', logo: '/logos/bitcoin.png' },
              { name: 'Ethereum', logo: '/logos/ethereum.png' },
              { name: 'Binance', logo: '/logos/binance.png' },
              { name: 'Polygon', logo: '/logos/polygon.png' },
              { name: 'Solana', logo: '/logos/solana.png' },
              { name: 'Tron', logo: '/logos/tron.png' },
            ].map(chain => (
              <div key={chain.name} className="flex flex-col items-center card hover:scale-105 transition-transform duration-200">
                <Image className="h-12 mb-2" src={chain.logo} alt={chain.name} width={48} height={48} />
                <span className="font-semibold text-white text-base">{chain.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-5xl mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">Features</h2>
            <p className="text-lg text-cyan-100">Everything you need to navigate Web3 with confidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Wallet Search</span>
              <p className="text-cyan-100 text-center">Find any wallet address and view its reputation, flags, and ratings across multiple blockchains.</p>
            </div>
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Flag & Report</span>
              <p className="text-cyan-100 text-center">Report scam, trusted, or suspicious wallets to help protect the community.</p>
            </div>
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Rate & Review</span>
              <p className="text-cyan-100 text-center">Leave ratings and reviews for wallet addresses to build a transparent reputation system.</p>
            </div>
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Profile & History</span>
              <p className="text-cyan-100 text-center">View wallet profiles, transaction history, and community feedback in one place.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
