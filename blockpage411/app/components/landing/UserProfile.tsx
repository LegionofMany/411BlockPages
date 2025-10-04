"use client";
import Image from "next/image";
import useProfile from "../../hooks/useProfile";

export default function UserProfile() {
  const { profile: user, loading, error } = useProfile();

  if (loading) {
    return <div className="text-center py-8 text-cyan-200">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <section className="w-full max-w-xl mx-auto text-center py-12 animate-fade-in">
      <div className="card bg-gray-900/80 p-6 rounded-xl shadow-xl flex flex-col items-center">
        <Image
          src={user.avatarUrl || "/avatars/sample-avatar.png"}
          alt="User Avatar"
          width={72}
          height={72}
          className="rounded-full mb-3 border-4 border-blue-500"
        />
        <div className="flex gap-2 mb-2">
          <span className="badge bg-green-600">
            {user.kycStatus || "KYC Pending"}
          </span>
          <span className="badge bg-yellow-500">
            {user.rating ? `${user.rating} ★` : "No Rating"}
          </span>
        </div>
        <div className="flex gap-2 mb-2">
          {user.socials?.map((s: string) => (
            <span key={s} className="badge bg-blue-500">
              {s}
            </span>
          ))}
        </div>
        <span className="text-cyan-100 text-sm mb-2">
          Donation Request:{" "}
          <span className="font-bold text-green-400">
            {user.donation || "None"}
          </span>
        </span>
        <span className="text-xs text-gray-300">{user.address}</span>
      </div>
    </section>
  );
}