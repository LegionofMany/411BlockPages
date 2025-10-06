
import React, { useState } from "react";
import Image from "next/image";

const wallets = [
  {
    label: "Ethereum / EVM",
    address: "0xDemoWalletAddressHere",
    qr: "/qr/eth.png"
  },
  {
    label: "Bitcoin",
    address: "bc1qdemobtcaddresshere",
    qr: "/qr/btc.png"
  },
  {
    label: "Solana",
    address: "So1anaDemoWalletAddre55",
    qr: "/qr/sol.png"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {wallets.map(w => (
            <div key={w.label} className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
              <span className="font-bold text-cyan-300 mb-2">{w.label}</span>
              <span className="font-mono text-sm text-green-400 select-all mb-2">{w.address}</span>
              <Image src={w.qr} alt={w.label + " QR"} width={96} height={96} className="rounded-lg shadow-md" />
            </div>
          ))}
        </div>
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
      </div>
    </div>
  );
}
