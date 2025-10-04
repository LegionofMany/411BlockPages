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
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl mb-8 animate-fade-in">
          Blockpage411: Blockchain Identity & Trust
        </h1>
        <p className="text-2xl md:text-3xl text-cyan-100 font-medium mb-10 animate-fade-in delay-100">
          Discover, verify, and connect with blockchain wallets across all major
          chains.
          <br />
          <span className="text-blue-200">
            Avatar upload, advanced KYC, social profiles, wallet ratings,
            reviews, donation requests, and moderation.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10 animate-fade-in delay-200">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-lg font-bold shadow-xl px-10 py-4 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 border-2 border-green-400 hover:scale-105 transition-all duration-200"
          >
            🚀 Get Started
          </button>
          <button
            type="button"
            onClick={() => router.push("/wallet/ethereum/0xDemoWallet")}
            className="text-lg font-bold shadow-xl px-10 py-4 rounded-full border-2 border-blue-400 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 ml-0 sm:ml-4 hover:scale-105 transition-all duration-200"
          >
            🧑‍💻 Try Demo
          </button>
        </div>
      </div>
    </section>
  );
}
