"use client";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  return (
    <section className="w-full max-w-5xl mx-auto text-center py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 animate-gradient-move">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path
            fill="url(#grad1)"
            d="M0,160L60,165.3C120,171,240,181,360,165.3C480,149,600,107,720,117.3C840,128,960,192,1080,218.7C1200,245,1320,235,1380,229.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
      </div>
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-500 drop-shadow-md mb-4 sm:mb-6">
          Blockpage411: Your Web3 Reputation
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted font-medium mb-6 sm:mb-8">
          Build your on-chain identity, showcase your reputation, and connect with others in the decentralized world.
          <br />
          <span className="text-cyan-200 font-semibold">
            KYC verification, social profiles, wallet ratings, reviews, and more.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full sm:w-auto text-base md:text-lg font-bold px-6 py-3 rounded-full btn-primary flex items-center justify-center gap-2"
            aria-label="Claim your profile"
          >
            🚀 Claim Your Profile
          </button>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="w-full sm:w-auto text-base md:text-lg font-semibold px-5 py-2 rounded-full border border-blue-600 text-white hover:bg-blue-700/20 transition-colors duration-150"
            aria-label="Explore wallets"
          >
            🔍 Explore Wallets
          </button>
        </div>
      </div>
    </section>
  );
}
