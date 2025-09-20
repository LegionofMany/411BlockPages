"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "search" | "wallet" }) {
  const router = useRouter();
  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-blockchain-gradient shadow-xl border-b border-blue-400/30 fixed top-0 z-50">
      <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => router.push("/")}> 
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-900 border-2 border-blue-400/40">
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={32} height={32} className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <span className="ml-2 text-lg md:text-2xl font-black text-white tracking-tight drop-shadow-lg uppercase" style={{letterSpacing: '0.04em'}}>Blockpage411</span>
      </div>
      <div className="flex gap-2 md:gap-4 items-center">
        {variant === "landing" && (
          <button
            className="btn-primary"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        )}
        {variant === "search" && (
          <>
            <button
              className="btn-primary bg-gray-900 hover:bg-gray-800"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 cursor-not-allowed"
              disabled
            >
              Search
            </button>
          </>
        )}
        {variant === "wallet" && (
          <>
            <button
              className="btn-primary bg-gray-900 hover:bg-gray-800"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="btn-primary"
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
