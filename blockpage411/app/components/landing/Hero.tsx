"use client";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  return (
    <section
      className="relative w-full max-w-6xl mx-auto text-center pt-24 sm:pt-32 pb-20 sm:pb-32 px-4"
      style={{
        color: '#0b1220'
      }}
    >
      {/* Radiant Light Effect */}
      <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[150%] h-[150%] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.15)_0%,_rgba(124,58,237,0)_50%)]" />
      </div>

      <div className="relative z-10">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent drop-shadow-sm mb-6"
          style={{
            WebkitTextStroke: '0.2px rgba(11,17,32,0.02)',
            backgroundImage: 'linear-gradient(90deg, rgba(250,204,21,0.95) 0%, rgba(245,158,11,0.9) 100%)'
          }}
        >
          On-Chain Reputation for Every Wallet
        </h1>
        <p
          className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl font-medium mb-8"
          style={{
            color: 'rgba(255, 223, 99, 0.95)',
            background: 'linear-gradient(90deg, rgba(255,223,99,0.06), rgba(255,223,99,0.02))',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            boxShadow: '0 6px 24px rgba(124,58,237,0.06)',
            backdropFilter: 'blur(6px)'
          }}
        >
          Discover verified wallet profiles and trust signals across multiple chains. Use community reviews, on-chain heuristics, and curated risk indicators to rapidly assess wallet history, flag suspicious activity, and make better decisions when interacting on Web3.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full sm:w-auto text-base md:text-lg font-bold px-8 py-3 rounded-full shadow-lg text-white transition-transform duration-200 ease-in-out transform hover:-translate-y-1 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, rgba(255,196,64,1) 0%, rgba(245,158,11,0.95) 45%, rgba(124,58,237,0.9) 100%)',
              boxShadow: '0 12px 36px rgba(124,58,237,0.14), 0 2px 8px rgba(255,196,64,0.06)'
            }}
            aria-label="Claim your profile"
          >
            <span className="inline-flex items-center gap-3">
              <span className="text-lg">🚀</span>
              <span>Claim Your Profile</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="w-full sm:w-auto text-base md:text-lg font-semibold px-6 py-3 rounded-full border text-white backdrop-blur-sm transition-colors duration-200 transform hover:-translate-y-0.5 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(124,58,237,0.03))',
              borderColor: 'rgba(124,58,237,0.18)'
            }}
            aria-label="Explore wallets"
          >
            <span className="inline-flex items-center gap-3">
              <span className="text-lg">🔍</span>
              <span>Explore Wallets</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
