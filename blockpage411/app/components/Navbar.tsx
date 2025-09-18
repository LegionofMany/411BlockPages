"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "search" | "wallet" }) {
  const router = useRouter();
  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#0f2027] via-[#2c5364] to-[#00c6ff] shadow-2xl z-20 backdrop-blur border-b border-blue-300/40">
      <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => router.push("/")}> 
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#00c6ff] to-[#2c5364] shadow-xl border-2 border-white/30">
          <img src="/block411-logo.svg" alt="Blockpage411 Logo" className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <span className="ml-2 text-lg md:text-2xl font-black text-white tracking-tight drop-shadow-lg uppercase" style={{letterSpacing: '0.04em', color: '#fff'}}>Blockpage411</span>
      </div>
      <div className="flex gap-2 md:gap-4 items-center">
        {variant === "landing" && (
          <button
            className="px-4 md:px-5 py-2 rounded-lg font-bold bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-white shadow-lg border-2 border-green-200/30 hover:from-[#38f9d7] hover:to-[#43e97b] hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-150 text-base tracking-wide"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        )}
        {variant === "search" && (
          <>
            <button
              className="px-4 md:px-5 py-2 rounded-lg font-bold bg-gradient-to-r from-[#00c6ff] to-[#2c5364] text-white shadow-lg border-2 border-cyan-200/30 hover:from-[#2c5364] hover:to-[#00c6ff] hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-150 text-base tracking-wide"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="px-4 md:px-5 py-2 rounded-lg font-bold bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-white shadow-lg border-2 border-green-200/30 hover:from-[#38f9d7] hover:to-[#43e97b] hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-150 text-base tracking-wide"
              onClick={() => router.push("/search")}
              disabled
            >
              Search
            </button>
          </>
        )}
        {variant === "wallet" && (
          <>
            <button
              className="px-4 md:px-5 py-2 rounded-lg font-bold bg-gradient-to-r from-[#00c6ff] to-[#2c5364] text-white shadow-lg border-2 border-cyan-200/30 hover:from-[#2c5364] hover:to-[#00c6ff] hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-150 text-base tracking-wide"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="px-4 md:px-5 py-2 rounded-lg font-bold bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-white shadow-lg border-2 border-green-200/30 hover:from-[#38f9d7] hover:to-[#43e97b] hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-150 text-base tracking-wide"
              onClick={() => router.push("/search")}
            >
              Search
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
