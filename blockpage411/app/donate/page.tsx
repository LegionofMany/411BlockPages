"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import useProfile from '../hooks/useProfile';

const wallets = [
  {
    label: "Ethereum / EVM",
    address: "0x32f70478D25Cc1846F4b2AE7C977B5fA1e5C7969",
    qr: "/logos/ethereum.png"
  },
  {
    label: "Bitcoin",
    address: "bc1q8664htax0udktaj634ud7nc7smdn5edt0y7c0z",
    qr: "/logos/bitcoin.png"
  },
  {
    label: "BNB",
    address: "0x32f70478D25Cc1846F4b2AE7C977B5fA1e5C7969",
    qr: "/logos/binance.png"
  },
  {
    label: "Solana",
    address: "G5oEZV7nU9oo1b3MmFj5s1HBLKJHSFjwUVtyzU3NT7bi",
    qr: "/logos/solana.png"
  }
];

export default function DonatePage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();

  const [queryAddress, setQueryAddress] = useState<string | null>(null);
  const [queryChain, setQueryChain] = useState<string | null>(null);

  // read query params client-side to avoid useSearchParams prerender issues
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    setQueryAddress(sp.get('address'));
    setQueryChain(sp.get('chain'));
  }, []);

  // Create donation request form state
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!platform || !url) {
      setCreateError('Platform and URL/address are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/donation-request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url, description: descriptionInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data?.message || 'Failed to create donation request');
      } else {
        setCreateSuccess(true);
        // redirect back to wallet page when created
        setTimeout(() => {
          router.push(queryChain && queryAddress ? `/wallet/${queryChain}/${queryAddress}` : '/');
        }, 1200);
      }
    } catch (err) {
      setCreateError((err as Error)?.message ?? 'Network error');
    } finally {
      setCreating(false);
    }
  }

  const profileAddress = profile && typeof (profile as { address?: unknown }).address === 'string' ? (profile as { address?: unknown }).address as string : null;
  const isOwner = !!(profileAddress && queryAddress && profileAddress.toLowerCase() === queryAddress.toLowerCase());

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1c] via-[#181f2f] to-[#1a2236] text-white">
      <div className="bg-gray-900/80 p-8 rounded-xl shadow-xl max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-cyan-300 animate-bounce">Support Blockpage411</h1>
        <p className="mb-6 text-cyan-100">You can support this project by sending donations to any of the wallet addresses below:</p>
        {queryAddress && queryChain ? (
          <div className="mb-4 text-sm text-slate-300">Creating a donation request for <span className="font-mono">{queryAddress}</span> on <span className="font-semibold">{queryChain}</span></div>
        ) : null}
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
              {wallets.map((w) => (
                <WalletCard key={w.label} label={w.label} address={w.address} img={w.qr} />
              ))}
            </div>
          );
        })()}
        {/* If query params provided AND user is owner, show creation form */}
        {queryAddress && queryChain ? (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            {profileLoading ? (
              <div className="text-sm text-cyan-200">Checking account...</div>
            ) : isOwner ? (
              <form onSubmit={handleCreate} className="flex flex-col items-center gap-2">
                <h2 className="text-lg font-semibold text-cyan-200">Create Donation Request</h2>
                <input className="w-full max-w-md px-3 py-2 rounded bg-gray-900 text-white" placeholder="Platform (e.g. OpenCollective)" value={platform} onChange={e=>setPlatform(e.target.value)} />
                <input className="w-full max-w-md px-3 py-2 rounded bg-gray-900 text-white" placeholder="URL or wallet address" value={url} onChange={e=>setUrl(e.target.value)} />
                <textarea className="w-full max-w-md px-3 py-2 rounded bg-gray-900 text-white" placeholder="Description" value={descriptionInput} onChange={e=>setDescriptionInput(e.target.value)} />
                <div className="flex gap-2">
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 rounded text-white">{creating ? 'Creating...' : 'Create Request'}</button>
                  <button type="button" className="px-4 py-2 bg-gray-700 rounded text-white" onClick={()=>router.push(`/wallet/${queryChain}/${queryAddress}`)}>Cancel</button>
                </div>
                {createError && <div className="text-red-400 text-sm mt-2">{createError}</div>}
                {createSuccess && <div className="text-green-400 text-sm mt-2">Request created — redirecting...</div>}
              </form>
            ) : (
              <div className="text-sm text-yellow-200">To request donations for this wallet you must be the wallet owner and signed in. <button className="ml-2 underline" onClick={()=>router.push('/login')}>Sign in</button></div>
            )}
          </div>
        ) : null}
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
