import React, { useState } from "react";
import adminFetch from "./adminFetch";

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
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
            currentStatus === status
              ? 'bg-emerald-500/90 text-black border-emerald-400/60'
              : 'bg-slate-900/40 text-slate-100 border-slate-600/70 hover:bg-slate-900/70'
          } ${loading ? 'opacity-60' : ''}`}
          disabled={loading || currentStatus === status}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await adminFetch("/api/admin/kyc-status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, chain, kycStatus: status })
              });
              let result: any = null;
              try {
                result = await res.json();
              } catch (_) {
                result = { message: await res.text() };
              }
              if (res.ok && result.kycStatus) {
                onUpdate(result.kycStatus);
              } else if (res.status === 403) {
                setError('Not authorized — sign in as an admin or set an admin wallet in localStorage');
              } else {
                setError(result.message || "Failed to update KYC");
              }
            } catch (err: any) {
              setError(err?.message || "Network error");
            } finally {
              setLoading(false);
            }
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
      {error && <span className="w-full text-red-400 text-xs">{error}</span>}
    </div>
  );
};

export default KYCAdminControls;
