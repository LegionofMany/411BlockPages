import React from "react";

interface StatusBadgesProps {
  suspicious?: boolean;
  popular?: boolean;
  blacklisted?: boolean;
  flagsCount?: number;
  kycStatus?: string;
  verificationBadge?: string;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ suspicious, popular, blacklisted, flagsCount, kycStatus, verificationBadge }) => (
  <div className="flex gap-2 mt-2">
    {suspicious && <span className="px-2 py-1 rounded bg-red-700 text-red-100 text-xs font-bold">Suspicious</span>}
    {popular && <span className="px-2 py-1 rounded bg-yellow-500 text-yellow-100 text-xs font-bold">Popular</span>}
    {blacklisted && <span className="px-2 py-1 rounded bg-red-700 text-red-100 text-xs font-bold">Blacklisted</span>}
    {flagsCount && flagsCount > 0 && <span className="px-2 py-1 rounded bg-yellow-700 text-yellow-100 text-xs font-bold">Flagged ({flagsCount})</span>}
    {kycStatus === 'verified' && <span className="px-2 py-1 rounded bg-green-700 text-green-100 text-xs font-bold">Verified</span>}
    {verificationBadge && <span className="px-2 py-1 rounded bg-yellow-700 text-yellow-200 text-xs font-semibold mt-2">{verificationBadge} Badge</span>}
  </div>
);

export default StatusBadges;
