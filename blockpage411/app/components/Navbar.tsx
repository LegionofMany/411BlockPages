"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "search" | "wallet" | "admin" }) {
  const router = useRouter();
  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-gradient-to-br from-darkbg via-darkbg-light to-darkbg-accent shadow-card border-b-2 border-blue-700 fixed top-0 z-50">
      <div className="flex items-center gap-2 md:gap-3 cursor-pointer select-none" onClick={() => router.push("/")}> 
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-darkbg-accent border-2 border-blue-700 shadow-lg transition-all duration-200 hover:scale-105">
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={32} height={32} className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <span className="ml-2 text-lg md:text-2xl font-black text-darktext tracking-tight drop-shadow-lg uppercase" style={{letterSpacing: '0.04em'}}>Blockpage411</span>
      </div>
      <div className="flex gap-2 md:gap-4 items-center">
        {variant === "landing" && (
          <button
            className="btn-primary bg-gradient-to-r from-accent-blue to-accent-indigo text-darktext font-bold border-2 border-blue-700 hover:from-accent-indigo hover:to-accent-blue hover:scale-105 transition-all duration-200"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        )}
        {variant === "search" && (
          <>
            <button
              className="btn-primary bg-darkbg-light border-2 border-blue-700 text-darktext font-bold hover:bg-darkbg-accent hover:scale-105 transition-all duration-200"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="btn-primary bg-gradient-to-r from-accent-blue to-accent-indigo border-2 border-blue-700 text-darktext font-bold cursor-not-allowed opacity-70"
              disabled
            >
              Search
            </button>
          </>
        )}
        {variant === "wallet" && (
          <>
            <button
              className="btn-primary bg-darkbg-light border-2 border-blue-700 text-darktext font-bold hover:bg-darkbg-accent hover:scale-105 transition-all duration-200"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="btn-primary bg-gradient-to-r from-accent-blue to-accent-indigo border-2 border-blue-700 text-darktext font-bold hover:from-accent-indigo hover:to-accent-blue hover:scale-105 transition-all duration-200"
              onClick={() => router.push("/search")}
            >
              Search
            </button>
          </>
        )}
        {variant === "admin" && (
          <>
            <button
              className="btn-primary bg-darkbg-light border-2 border-blue-700 text-darktext font-bold hover:bg-darkbg-accent hover:scale-105 transition-all duration-200"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="btn-primary bg-gradient-to-r from-accent-blue to-accent-indigo border-2 border-blue-700 text-darktext font-bold hover:from-accent-indigo hover:to-accent-blue hover:scale-105 transition-all duration-200"
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
