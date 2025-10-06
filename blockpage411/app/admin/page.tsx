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
    <div className="min-h-screen flex flex-col items-center text-white">
      <Navbar variant="admin" />
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 text-center">
        <div className="w-full max-w-4xl bg-gray-900/80 rounded-2xl shadow-2xl p-8 border-2 border-blue-700">
          <h1 className="text-4xl font-extrabold mb-2 text-white">Admin Dashboard</h1>
          <p className="text-cyan-200 mb-6">Welcome, {address}</p>
          {/* Admin tools and components will go here */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
              <p className="text-gray-400">Manage users, roles, and permissions.</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Content Moderation</h2>
              <p className="text-gray-400">Review and moderate user-submitted content.</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-4">System Analytics</h2>
              <p className="text-gray-400">View system-wide analytics and reports.</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
              <p className="text-gray-400">Configure system settings and parameters.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
