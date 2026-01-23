"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const discordInviteUrl =
    (process.env.NEXT_PUBLIC_DISCORD_INVITE_URL && String(process.env.NEXT_PUBLIC_DISCORD_INVITE_URL).trim()) ||
    'https://discord.gg/z8MgDnHdR';

  return (
    <footer style={{ backgroundColor: '#070812' }} className="w-full bg-gray-900/80 text-white py-8 px-4 mt-12 shadow-inner border-t-2 border-blue-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={36} height={36} priority />
          <span className="font-bold text-xl" style={{ color: '#ffffff', backgroundColor: '#070812', padding: '2px 6px', borderRadius: 6 }}>Blockpage411</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold justify-center">
          <Link href="/" className="transition-colors" style={{ color: '#9ae6b4' }}>Home</Link>
          <Link href="/search" className="transition-colors" style={{ color: '#9ae6b4' }}>Search</Link>
          <Link href="/phone-book" className="transition-colors" style={{ color: '#9ae6b4' }}>Phone Book</Link>
          <a
            href={discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors inline-flex items-center gap-2"
            style={{ color: '#9ae6b4' }}
          >
            <Image src="/icons/discord.svg" alt="Discord" width={16} height={16} />
            Discord
          </a>
          <a href="https://github.com/LegionofMany/411BlockPages" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: '#9ae6b4' }}>GitHub</a>
          <Link href="/privacy" className="transition-colors" style={{ color: '#9ae6b4' }}>Privacy Policy</Link>
          <Link href="/terms" className="transition-colors" style={{ color: '#9ae6b4' }}>Terms of Service</Link>
        </nav>
        <div className="text-sm mt-4 md:mt-0" style={{ color: '#d1fae5', backgroundColor: '#070812', padding: '2px 4px', borderRadius: 4 }}>&copy; {year} Blockpage411. All Rights Reserved.</div>
      </div>
    </footer>
  );
}