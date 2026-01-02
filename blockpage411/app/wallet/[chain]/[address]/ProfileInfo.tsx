import React from "react";
import UserProfile from '../../../components/UserProfile';

interface ProfileInfoProps {
  displayName?: string;
  avatarUrl?: string;
  address: string;
  chain: string;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ address, chain }) => (
  <div className="flex flex-col items-center mb-6">
    <UserProfile walletAddress={address} chain={chain} />
  </div>
);

export default ProfileInfo;
