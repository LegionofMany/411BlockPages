
"use client";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
          <p className="text-xl md:text-2xl text-cyan-100 font-medium mb-8 animate-fade-in delay-100">
            Discover, verify, and connect with blockchain wallets across all major chains.<br />
            <span className="text-blue-200">Now with social profiles, wallet ratings, reviews, KYC, and donation requests.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in delay-200">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="btn-primary text-lg shadow-xl px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400"
            >
              Get Started
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4 animate-fade-in delay-300">
            <span className="badge bg-blue-700 text-white">Multi-Chain</span>
            <span className="badge bg-yellow-500 text-white">Star Ratings</span>
            <span className="badge bg-pink-600 text-white">Social Profiles</span>
            <span className="badge bg-green-600 text-white">KYC & Verification</span>
            <span className="badge bg-indigo-500 text-white">Donation Requests</span>
          </div>
        </section>

        {/* Supported Chains Section */}
        <section className="w-full max-w-5xl mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">Supported Chains</h2>
            <p className="text-lg text-cyan-100">We support all major blockchains, with more to come.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-8">
            {[
              { name: 'Bitcoin', logo: '/logos/bitcoin.png' },
              { name: 'Ethereum', logo: '/logos/ethereum.png' },
              { name: 'Binance', logo: '/logos/binance.png' },
              { name: 'Polygon', logo: '/logos/polygon.png' },
              { name: 'Solana', logo: '/logos/solana.png' },
              { name: 'Tron', logo: '/logos/tron.png' },
              { name: 'XRP', logo: '/logos/xrp.png' },
            ].map(chain => (
              <div key={chain.name} className="flex flex-col items-center card hover:scale-105 transition-transform duration-200">
                <Image className="h-12 mb-2" src={chain.logo} alt={chain.name} width={48} height={48} />
                <span className="font-semibold text-white text-base">{chain.name}</span>
              </div>
            ))}
          </div>
        </section>
        {/* v3 Social & Ratings Section */}
        <section className="w-full max-w-4xl mx-auto py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">Social Profiles & Ratings</h2>
            <p className="text-lg text-cyan-100">Connect your wallet to your social presence and reputation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card flex flex-col items-center p-6">
              <div className="flex flex-wrap justify-center gap-2 mb-3 w-full">
                <span className="badge bg-blue-500 text-white">Telegram</span>
                <span className="badge bg-green-600 text-white">WhatsApp</span>
                <span className="badge bg-blue-400 text-white">Twitter</span>
                <span className="badge bg-blue-800 text-white">Facebook</span>
                <span className="badge bg-pink-500 text-white">Instagram</span>
                <span className="badge bg-blue-700 text-white">LinkedIn</span>
                <span className="badge bg-indigo-500 text-white">Discord</span>
              </div>
              <p className="text-cyan-100 text-center">Showcase your social links and connect with the Web3 community directly from your wallet profile.</p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <div className="flex items-center gap-2 mb-3">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className="text-yellow-400 text-2xl">★</span>
                ))}
                <span className="ml-2 text-lg font-bold text-yellow-200">4.8</span>
              </div>
              <p className="text-cyan-100 text-center">Rate and review wallets. Build trust with transparent, community-driven star ratings and feedback.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-5xl mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">All-in-One Web3 Directory</h2>
            <p className="text-lg text-cyan-100">Everything you need to build trust, reputation, and community in Web3.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Wallet Search</span>
              <p className="text-cyan-100 text-center">Find any wallet address and view its reputation, flags, ratings, and social links across all major chains.</p>
            </div>
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Flag & Report</span>
              <p className="text-cyan-100 text-center">Report scam, trusted, or suspicious wallets to help protect the community.</p>
            </div>
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Rate & Review</span>
              <p className="text-cyan-100 text-center">Leave star ratings and reviews for wallet addresses to build a transparent reputation system.</p>
            </div>
            <div className="card flex flex-col items-center">
              <span className="badge mb-4">Profile, KYC & Donations</span>
              <p className="text-cyan-100 text-center">View wallet profiles, KYC status, donation requests, transaction history, and community feedback in one place.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
