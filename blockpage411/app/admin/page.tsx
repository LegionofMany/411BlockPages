"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function AdminPanel() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [address, setAddress] = useState("");

  useEffect(() => {
    // Example: get wallet address from localStorage or wallet provider
    const wallet = window.localStorage.getItem("wallet") || "";
    setAddress(wallet);
    const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").split(",").map(a => a.toLowerCase().trim());
    setIsAdmin(adminWallets.includes(wallet.toLowerCase()));
    if (wallet && !adminWallets.includes(wallet.toLowerCase())) {
      router.replace("/"); // redirect non-admins
    }
  }, [router]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-red-400">
        <Navbar variant="wallet" />
        <h1 className="text-3xl font-bold mt-32">Access Denied</h1>
        <p className="mt-4">You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white">
      <Navbar variant="wallet" />
      <div className="mt-32 w-full max-w-2xl bg-gray-800 rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold mb-6">Admin Panel</h1>
        <p className="mb-4">Welcome, admin wallet: <span className="font-mono text-green-400">{address}</span></p>
        {/* Add admin tools/components here */}
      </div>
    </div>
  );
}
