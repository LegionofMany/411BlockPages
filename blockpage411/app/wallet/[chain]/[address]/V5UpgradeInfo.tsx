import React from "react";

const features = [
  "Multi-chain wallet support",
  "Community wallet rating system",
  "Donation requests and history",
  "KYC status and verification",
  "Admin flagging and moderation",
  "Suspicious/Popular/Blacklisted badges",
  "Improved UI/UX and modular components"
];

const V5UpgradeInfo: React.FC = () => (
  <div className="mb-6 w-full bg-gradient-to-r from-indigo-900 via-blue-900 to-blue-950 border border-yellow-500 rounded-xl p-4 shadow-lg flex flex-col items-center">
    <span className="px-4 py-1 rounded-full bg-yellow-500 text-white font-bold text-lg mb-2">v5 Upgrade</span>
  <h3 className="text-yellow-200 font-bold text-xl mb-2">What&apos;s New in v5?</h3>
    <ul className="list-disc list-inside text-yellow-100 text-sm">
      {features.map(f => <li key={f}>{f}</li>)}
    </ul>
  </div>
);

export default V5UpgradeInfo;
