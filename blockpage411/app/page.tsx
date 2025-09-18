"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRef, useEffect } from "react";
import Navbar from "./components/Navbar";

export default function Home() {
  const router = useRouter();


  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-pink-100 text-gray-900 animate-gradient-x">
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 12s ease-in-out infinite;
        }
      `}</style>
      {/* Navigation Bar */}
      <Navbar variant="landing" />
      {/* Main Content */}
      {/* Blockchain Logos Row - now directly under navbar */}
      <div className="w-full bg-black rounded-xl flex justify-between items-center px-2 py-2" style={{marginTop: 0, paddingTop: 0}}>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/bitcoin.png" alt="Bitcoin" className="w-full h-full object-contain" title="Bitcoin" />
        </div>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/ethereum.png" alt="Ethereum" className="w-full h-full object-contain" title="Ethereum" />
        </div>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/binance.png" alt="Binance" className="w-full h-full object-contain" title="Binance" />
        </div>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/solana.png" alt="Solana" className="w-full h-full object-contain" title="Solana" />
        </div>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/polygon.png" alt="Polygon" className="w-full h-full object-contain" title="Polygon" />
        </div>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/cardano.png" alt="Cardano" className="w-full h-full object-contain" title="Cardano" />
        </div>
        <div className="flex-1 h-12 sm:h-16 md:h-20 flex items-center justify-center">
          <img src="/logos/avalanche.png" alt="Avalanche" className="w-full h-full object-contain" title="Avalanche" />
        </div>
      </div>
  <main className="flex-1 px-4 pt-0 pb-8 flex justify-center items-center">
  <section className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white p-0 sm:p-0 flex flex-col items-center">
          {/* Hero Section */}
          <div className="w-full flex flex-col items-center justify-center py-12 px-4 md:px-12 bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-400">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg text-center mb-3 tracking-tight">Blockpage411</h1>
            <p className="text-lg md:text-2xl text-cyan-100 font-medium text-center max-w-2xl mb-6">The Professional Blockchain 411 Directory for All Chains</p>
            <button
              className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-12 py-4 rounded-2xl text-lg font-extrabold uppercase tracking-wide shadow-2xl ring-4 ring-yellow-200/40 text-white mb-2 transition-all duration-200 ease-in-out
                hover:from-pink-500 hover:via-yellow-400 hover:to-orange-400 hover:scale-105 hover:-translate-y-1 hover:ring-pink-200/60
                focus:outline-none focus:ring-4 focus:ring-pink-400/70"
              style={{boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.25), 0 1.5px 6px 0 rgba(255, 64, 129, 0.15)'}}
              onClick={() => router.push('/login')}
            >
              <span className="drop-shadow-lg">Get Started / Login</span>
              <span className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-pink-500/10" />
            </button>
          </div>
          {/* Features Section */}
          <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 px-4 md:px-10 py-10 bg-white">
            <div className="flex-1 flex flex-col items-center text-center gap-3 bg-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-transform">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-500 text-white text-3xl shadow-lg">🔍</div>
              <div className="font-bold text-blue-900 text-lg">Wallet Search</div>
              <div className="text-blue-800 text-sm">Find any wallet address and view its reputation, flags, and ratings across multiple blockchains.</div>
            </div>
            <div className="flex-1 flex flex-col items-center text-center gap-3 bg-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-transform">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-white text-3xl shadow-lg">✅</div>
              <div className="font-bold text-blue-900 text-lg">Flag & Report</div>
              <div className="text-blue-800 text-sm">Report scam, trusted, or suspicious wallets to help protect the community.</div>
            </div>
            <div className="flex-1 flex flex-col items-center text-center gap-3 bg-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-transform">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-400 text-white text-3xl shadow-lg">⭐</div>
              <div className="font-bold text-blue-900 text-lg">Rate & Review</div>
              <div className="text-blue-800 text-sm">Leave ratings and reviews for wallet addresses to build a transparent reputation system.</div>
            </div>
            <div className="flex-1 flex flex-col items-center text-center gap-3 bg-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-transform">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-500 text-white text-3xl shadow-lg">👤</div>
              <div className="font-bold text-blue-900 text-lg">Profile & History</div>
              <div className="text-blue-800 text-sm">View wallet profiles, transaction history, and community feedback in one place.</div>
            </div>
          </div>
          {/* Visual Background Accent */}
          <div className="absolute -bottom-10 -right-10 opacity-20 pointer-events-none select-none">
            <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="50" fill="#2563EB" fillOpacity="0.12" />
              <rect x="150" y="40" width="50" height="50" rx="12" fill="#9333EA" fillOpacity="0.10" />
              <rect x="40" y="110" width="40" height="20" rx="8" fill="#22D3EE" fillOpacity="0.09" />
              <rect x="170" y="100" width="30" height="30" rx="8" fill="#F472B6" fillOpacity="0.08" />
              <circle cx="190" cy="60" r="14" fill="#FBBF24" fillOpacity="0.10" />
            </svg>
          </div>
        </section>
      </main>
      <footer className="w-full mt-10 bg-gradient-to-r from-[#0f2027] via-[#2c5364] to-[#00c6ff] text-white py-8 px-4 md:px-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          {/* Logo and About */}
          <div className="flex flex-col items-center md:items-start gap-3 md:gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#00c6ff] to-[#2c5364] shadow-xl border-2 border-white/30 mb-1">
              <img src="/block411-logo.svg" alt="Blockpage411 Logo" className="w-7 h-7" />
            </div>
            <span className="text-lg font-black tracking-wide uppercase">Blockpage411</span>
            <p className="text-sm text-blue-100 max-w-xs text-center md:text-left">The professional blockchain-powered 411 directory for Ethereum wallets. Search, flag, and rate wallet addresses. Build trust and reputation in Web3.</p>
          </div>
          {/* Contact & Social */}
          <div className="flex flex-col items-center md:items-end gap-3 md:gap-4">
            <div className="flex flex-col gap-1 items-center md:items-end">
              <span className="font-semibold text-base">Contact</span>
              <a href="mailto:info@blockpage411.com" className="text-blue-200 hover:text-cyan-200 underline text-sm">info@blockpage411.com</a>
            </div>
            <div className="flex gap-4 mt-2">
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-cyan-300 transition text-xl">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.763.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 2.281 1.581 4.415 3.949 4.89-.385.104-.792.16-1.211.16-.296 0-.583-.028-.862-.08.584 1.823 2.28 3.15 4.29 3.187A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"/></svg>
              </a>
              <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-cyan-300 transition text-xl">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.88v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z"/></svg>
              </a>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-cyan-300 transition text-xl">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .318.216.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 text-xs text-blue-100 opacity-80 text-center">
          &copy; {new Date().getFullYear()} Blockpage411. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
