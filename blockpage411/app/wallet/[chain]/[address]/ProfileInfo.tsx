import React from "react";
import Image from "next/image";

interface ProfileInfoProps {
  displayName?: string;
  avatarUrl?: string;
  address: string;
  chain: string;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ displayName, avatarUrl, address, chain }) => (
  <div className="flex flex-col items-center mb-6">
    {avatarUrl ? (
      <Image src={avatarUrl} alt="avatar" width={80} height={80} className="rounded-full border-2 border-cyan-400 mb-2 bg-cyan-900" />
    ) : (
      <div className="rounded-full border-2 border-cyan-400 mb-2 bg-cyan-900 w-20 h-20 flex items-center justify-center">
        <span className="text-cyan-300 text-3xl">&#9787;</span>
      </div>
    )}
    <span className="text-2xl font-bold text-cyan-100">{displayName || "Wallet Profile"}</span>
    <span className="font-mono text-lg text-cyan-200 break-all mt-2">{address}</span>
    <span className="text-cyan-400 mt-1">Chain: {chain}</span>
  </div>
);

export default ProfileInfo;
