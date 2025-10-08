"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Utility to get wallet from localStorage (client-only)
function getWalletAddress(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("wallet");
  }
  return null;
}

// Utility to get admin wallets from env (client-only)
function getAdminWallets(): string[] {
  if (typeof window !== "undefined") {
    // Try window env first
    // @ts-ignore
    const env = window.NEXT_PUBLIC_ADMIN_WALLETS || process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
    return env.split(",").map((w: string) => w.trim().toLowerCase());
  }
  return [];
}

const AdminAccessButton: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const wallet = getWalletAddress();
    const adminWallets = getAdminWallets();
    const walletLower = wallet ? wallet.toLowerCase() : "";
    const isAdminWallet = adminWallets.some(a => a === walletLower);
    console.log("[ADMIN BUTTON DEBUG] Wallet:", wallet);
    console.log("[ADMIN BUTTON DEBUG] Admin Wallets:", adminWallets);
    console.log("[ADMIN BUTTON DEBUG] isAdminWallet:", isAdminWallet);
    if (walletLower && isAdminWallet) {
      setIsAdmin(true);
    }
  }, []);


  if (!isAdmin) {
    console.log("[ADMIN BUTTON DEBUG] Button not rendered: not admin");
    return null;
  }


  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("[ADMIN BUTTON DEBUG] Button clicked");
    try {
      router.push("/admin");
      setTimeout(() => {
        // Fallback in case router.push does not work
        if (window.location.pathname !== "/admin") {
          console.log("[ADMIN BUTTON DEBUG] router.push fallback to window.location.href");
          window.location.href = "/admin";
        }
      }, 500);
    } catch (err) {
      console.error("[ADMIN BUTTON DEBUG] router.push error", err);
      window.location.href = "/admin";
    }
  };

  return (
    <button
      onClick={handleClick}
      className="btn-primary text-lg mt-8 cursor-pointer select-none"
      style={{ letterSpacing: "0.03em" }}
      tabIndex={0}
      aria-label="Go to Admin Dashboard"
    >
      <span className="inline-flex items-center gap-2 select-none">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm0 0V7m0 4v4m0 0c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" /></svg>
        Admin Dashboard
      </span>
    </button>
  );
};

export default AdminAccessButton;
