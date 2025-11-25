"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer className="w-full bg-gray-900/80 text-white py-8 px-4 mt-12 shadow-inner border-t-2 border-blue-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={36} height={36} priority />
          <span className="font-bold text-xl">Blockpage411</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold justify-center">
          <Link href="/" className="hover:text-cyan-300 transition-colors">Home</Link>
          <Link href="/search" className="hover:text-cyan-300 transition-colors">Search</Link>
          <a href="https://github.com/LegionofMany/411BlockPages" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors">GitHub</a>
          <Link href="/privacy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
        </nav>
        <div className="text-sm text-gray-400 mt-4 md:mt-0">&copy; {year} Blockpage411. All Rights Reserved.</div>
      </div>
    </footer>
  );
}