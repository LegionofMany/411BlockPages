import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer className="w-full bg-blockchain-gradient text-white py-8 px-4 mt-12 shadow-inner border-t border-blue-400/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={32} height={32} className="w-8 h-8" priority />
          <span className="font-bold text-lg tracking-tight text-white">Blockpage411</span>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm font-medium text-white">
          <Link href="/" className="hover:underline text-white">Home</Link>
          <Link href="/search" className="hover:underline text-white">Search</Link>
          <a href="https://github.com/LegionofMany/411BlockPages" target="_blank" rel="noopener noreferrer" className="hover:underline text-white">GitHub</a>
          <Link href="/privacy" className="hover:underline text-white">Privacy</Link>
          <Link href="/terms" className="hover:underline text-white">Terms</Link>
        </nav>
        <div className="text-xs text-white mt-2 md:mt-0">&copy; {year ? year : ""} Blockpage411. All rights reserved.</div>
      </div>
    </footer>
  );
}
