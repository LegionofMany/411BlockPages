import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer className="w-full bg-gradient-to-br from-darkbg via-darkbg-light to-darkbg-accent text-darktext py-8 px-4 mt-12 shadow-inner border-t-2 border-blue-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 select-none">
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={32} height={32} className="w-8 h-8" priority />
          <span className="font-bold text-lg tracking-tight text-darktext">Blockpage411</span>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm font-semibold text-darktext">
          <Link href="/" className="hover:text-accent-cyan transition-colors">Home</Link>
          <Link href="/search" className="hover:text-accent-cyan transition-colors">Search</Link>
          <a href="https://github.com/LegionofMany/411BlockPages" target="_blank" rel="noopener noreferrer" className="hover:text-accent-cyan transition-colors">GitHub</a>
          <Link href="/privacy" className="hover:text-accent-cyan transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-accent-cyan transition-colors">Terms</Link>
        </nav>
        <div className="text-xs text-darktext mt-2 md:mt-0 opacity-80">&copy; {year ? year : ""} Blockpage411. All rights reserved.</div>
      </div>
    </footer>
  );
}
