
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
        {/* Hero Section with Animated Background */}
        <section className="w-full max-w-4xl mx-auto text-center py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0 animate-gradient-move">
            {/* Subtle SVG or gradient animation */}
            <svg width="100%" height="100%" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path fill="#6366f1" fillOpacity="0.15" d="M0,160L60,165.3C120,171,240,181,360,165.3C480,149,600,107,720,117.3C840,128,960,192,1080,218.7C1200,245,1320,235,1380,229.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
            </svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-xl mb-6 animate-fade-in">
              The Premier 411 for the Blockchain
            </h1>
            <p className="text-xl md:text-2xl text-cyan-100 font-medium mb-8 animate-fade-in delay-100">
              Discover, verify, and connect with blockchain wallets across all major chains.<br />
              <span className="text-blue-200">Now with avatar upload, advanced KYC, social profiles, wallet ratings, reviews, donation requests, and moderation.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in delay-200">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="btn-primary text-lg shadow-xl px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => router.push('/wallet/ethereum/0xDemoWallet')}
                className="btn-secondary text-lg shadow-xl px-8 py-3 rounded-full border border-blue-400 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 ml-0 sm:ml-4"
              >
                Try Demo
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4 animate-fade-in delay-300">
              <span className="badge bg-blue-700 text-white">Multi-Chain</span>
              <span className="badge bg-yellow-500 text-white">Star Ratings</span>
              <span className="badge bg-pink-600 text-white">Social Profiles</span>
              <span className="badge bg-green-600 text-white">KYC & Verification</span>
              <span className="badge bg-indigo-500 text-white">Donation Requests</span>
              <span className="badge bg-red-500 text-white">Moderation</span>
              <span className="badge bg-purple-500 text-white">Avatar Upload</span>
            </div>
            {/* Sample Wallet Profile Preview */}
            <div className="mt-10 flex justify-center animate-fade-in delay-400">
              <div className="card bg-gray-900/80 p-6 rounded-xl shadow-xl flex flex-col items-center w-80">
                <Image src="/avatars/sample-avatar.png" alt="Sample Avatar" width={72} height={72} className="rounded-full mb-3 border-4 border-blue-500" />
                <div className="flex gap-2 mb-2">
                  <span className="badge bg-green-600">KYC Verified</span>
                  <span className="badge bg-yellow-500">4.9 ★</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <span className="badge bg-blue-500">Twitter</span>
                  <span className="badge bg-indigo-500">Discord</span>
                  <span className="badge bg-pink-500">Instagram</span>
                </div>
                <span className="text-cyan-100 text-sm mb-2">Donation Request: <span className="font-bold text-green-400">0.05 ETH</span></span>
                <span className="text-xs text-gray-300">0xDemoWallet</span>
              </div>
            </div>
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
        {/* What's New in v4 Section */}
        <section className="w-full max-w-5xl mx-auto py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">What&apos;s New in v4</h2>
            <p className="text-lg text-cyan-100">Major upgrades for trust, reputation, and community safety.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card flex flex-col items-center p-6">
              <span className="badge bg-purple-500 text-white mb-3">Avatar Upload</span>
              <p className="text-cyan-100 text-center">Upload a custom avatar to personalize your wallet profile.</p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <span className="badge bg-green-600 text-white mb-3">Advanced KYC</span>
              <p className="text-cyan-100 text-center">KYC verification and gating for enhanced security and trust.</p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <span className="badge bg-pink-600 text-white mb-3">Social Profiles</span>
              <p className="text-cyan-100 text-center">Connect your wallet to your social presence and reputation.</p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <span className="badge bg-yellow-500 text-white mb-3">Wallet Ratings & Reviews</span>
              <p className="text-cyan-100 text-center">Rate and review wallets. Build trust with transparent, community-driven star ratings and feedback.</p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <span className="badge bg-indigo-500 text-white mb-3">Donation Requests</span>
              <p className="text-cyan-100 text-center">Request donations directly from your wallet profile.</p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <span className="badge bg-red-500 text-white mb-3">Moderation & Safety</span>
              <p className="text-cyan-100 text-center">Flag, report, and moderate wallets for community safety.</p>
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
