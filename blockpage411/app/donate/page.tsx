"use client";
import React, { useState } from "react";
import Image from "next/image";

const wallets = [
  {
    label: "Ethereum / EVM",
  address: "Ox96Od558829ac2d136526b1c864c927e4O5afcd89",
  qr: "/logos/ethereum.png"
  },
  {
    label: "Bitcoin",
    address: "bc1qdemobtcaddresshere",
  qr: "/logos/bitcoin.png"
  },
  {
    label: "Solana",
    address: "So1anaDemoWalletAddre55",
  qr: "/logos/solana.png"
  }
];

export default function DonatePage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1c] via-[#181f2f] to-[#1a2236] text-white">
      <div className="bg-gray-900/80 p-8 rounded-xl shadow-xl max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-cyan-300 animate-bounce">Support Blockpage411</h1>
        <p className="mb-6 text-cyan-100">You can support this project by sending donations to any of the wallet addresses below:</p>
        {/* WalletCard component must be defined before usage */}
        {(() => {
          function WalletCard({ label, address, img }: { label: string; address: string; img: string }) {
            const [copied, setCopied] = useState(false);
            return (
              <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center space-y-3 group relative">
                <span className="font-bold text-cyan-300">{label}</span>
                <div className="flex items-center space-x-2 relative">
                  <span className="font-mono text-sm text-green-400 select-all pr-6">{address}</span>
                  <button
                    className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded bg-cyan-700 text-white text-xs font-bold hover:bg-cyan-600 focus:outline-none"
                    style={{top: 0}}
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    }}
                    title="Copy address"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <Image src={img} alt={label + " QR"} width={96} height={96} className="rounded-lg shadow-md" />
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 mb-8 mt-2">
              {wallets.map((w, idx) => (
                <WalletCard key={w.label} label={w.label} address={w.address} img={w.qr} />
              ))}
            </div>
          );
        })()}
        <form className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-col items-center" onSubmit={handleSubmit}>
          <label className="text-cyan-200 font-semibold mb-2">Send a message or donation amount (optional):</label>
          <input
            type="text"
            placeholder="Amount (e.g. 0.05 ETH)"
            className="mb-2 px-3 py-2 rounded bg-gray-900 text-green-300 w-full max-w-xs border border-blue-700"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <textarea
            placeholder="Message (optional)"
            className="mb-2 px-3 py-2 rounded bg-gray-900 text-cyan-200 w-full max-w-xs border border-blue-700"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold shadow-lg border border-green-400 hover:scale-105 transition-all duration-200"
          >Send</button>
        </form>
        {submitted && (
          <div className="mb-4 animate-pulse">
            <span className="text-green-400 text-lg font-bold">Thank you for your support! 🎉</span>
          </div>
        )}
        <div className="flex justify-center gap-6 mt-6">
          <a href="https://twitter.com/blockpage411" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 text-xl">
            <Image src="/icons/twitter.svg" alt="Twitter" width={32} height={32} />
          </a>
          <a href="https://discord.gg/blockpage411" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 text-xl">
            <Image src="/icons/discord.svg" alt="Discord" width={32} height={32} />
          </a>
          <a href="mailto:support@blockpage411.com" className="hover:text-cyan-300 text-xl">
            <Image src="/icons/email.svg" alt="Email" width={32} height={32} />
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-6">Ethereum, Polygon, BNB, Bitcoin, Solana, and more supported.</p>
        <button
          className="mt-8 btn-primary bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 transform hover:scale-105 py-2 px-6 font-bold"
          onClick={() => window.location.href = '/search'}
        >
          Back to Search
        </button>
      </div>
    </div>
  );
}
