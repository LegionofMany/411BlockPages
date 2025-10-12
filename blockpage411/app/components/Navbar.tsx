"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "search" | "wallet" | "admin" }) {
  const router = useRouter();
  return (
    <>
      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-3 bg-gray-900/80 shadow-lg border-b-2 border-blue-700 fixed top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => router.push("/") }>
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={36} height={36} />
          <span className="text-xl font-bold text-white">Blockpage411</span>
        </div>
        <div className="flex gap-4 items-center">
  <Link href="/search" className="text-white hover:text-cyan-300 transition-colors">Search</Link>
  <Link href="/fundraisers" className="text-white hover:text-cyan-300 transition-colors">Fundraisers</Link>
        {variant === "landing" && (
          <button
            className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold border-2 border-blue-500 hover:from-indigo-600 hover:to-blue-600 hover:scale-105 transition-all duration-200 px-6 py-2 rounded-full"
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
      {/* Spacer to offset fixed navbar height so page content isn't hidden behind it */}
      <div aria-hidden="true" className="h-14 md:h-16" />
    </>
  );
}
