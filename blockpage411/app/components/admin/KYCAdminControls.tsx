import React, { useState } from "react";

interface KYCAdminControlsProps {
  address: string;
  chain: string;
  currentStatus: string;
  onUpdate: (status: string) => void;
}

const KYCAdminControls: React.FC<KYCAdminControlsProps> = ({ address, chain, currentStatus, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statuses = ["verified", "pending", "rejected"];
  return (
    <div className="flex gap-1 mt-1">
      {statuses.map((status) => (
        <button
          key={status}
          className={`px-2 py-0.5 rounded text-xs font-bold border ${currentStatus === status ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200'} ${loading ? 'opacity-60' : ''}`}
          disabled={loading || currentStatus === status}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const adminWallet = localStorage.getItem("wallet") || "";
              const res = await fetch("/api/admin/kyc-status", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-admin-address": adminWallet
                },
                body: JSON.stringify({ address, chain, kycStatus: status })
              });
              const result = await res.json();
              if (res.ok && result.kycStatus) {
                onUpdate(result.kycStatus);
              } else {
                setError(result.message || "Failed to update KYC");
              }
            } catch {
              setError("Network error");
            } finally {
              setLoading(false);
            }
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
      {error && <span className="ml-2 text-red-400 text-xs">{error}</span>}
    </div>
  );
};

export default KYCAdminControls;
