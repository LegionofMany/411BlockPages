import React from "react";
import type { DonationRequest } from "../../../../lib/types";

interface DonationSectionProps {
  donationRequests?: DonationRequest[];
}

const DonationSection: React.FC<DonationSectionProps> = ({ donationRequests }) => {
  if (!donationRequests || donationRequests.length === 0) return null;
  return (
    <div className="mt-4 w-full text-left">
      <h3 className="text-cyan-300 font-semibold mb-2">Donation Requests</h3>
      <ul className="space-y-2">
        {donationRequests.map((donation, i) => (
          <li key={i} className="bg-blue-950 border border-blue-800 rounded-lg p-2">
            <span className="text-cyan-200 font-mono">{donation.platform}</span> - <a href={donation.url} target="_blank" rel="noopener" className="text-blue-400 underline">{donation.url}</a>
            <div className="text-cyan-400">{donation.description}</div>
            <span className="text-xs text-cyan-500">Expires: {donation.expiresAt ? new Date(donation.expiresAt).toLocaleString() : 'N/A'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonationSection;
