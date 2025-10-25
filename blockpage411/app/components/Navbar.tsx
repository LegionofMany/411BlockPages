"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Navbar({ variant = "landing" }: { variant?: "landing" | "search" | "wallet" | "admin" }) {
  const router = useRouter();
  return (
    <>
      <nav role="navigation" aria-label="Main" className="w-full flex items-center justify-between px-4 md:px-8 py-3 glass fixed top-0 z-50 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/") } className="flex items-center gap-3 focus:outline-none" aria-label="Go to homepage">
            <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={36} height={36} />
            <span className="text-lg md:text-xl font-semibold text-white">Blockpage411</span>
          </button>
        </div>

        <ul className="flex gap-6 items-center list-none m-0 p-0">
          <li><Link href="/search" className="nav-link">Search</Link></li>
          <li><Link href="/fundraisers" className="nav-link">Fundraisers</Link></li>
          <li><Link href="/donate" className="nav-link">Donate</Link></li>
          <li><Link href="/wallet/popular" className="nav-link">Trending</Link></li>
          {variant === 'admin' && (
            <li><Link href="/admin" className="nav-link">Admin</Link></li>
          )}
          <li><Link href="/login" className="nav-link">Sign in</Link></li>
        </ul>
      </nav>
      {/* Spacer to offset fixed navbar height so page content isn't hidden behind it */}
      <div aria-hidden="true" className="h-14 md:h-16" />
    </>
  );
}
