import React, { useState } from "react";
import adminFetch from "./adminFetch";

interface RoleAdminControlsProps {
  address: string;
  chain: string;
  currentRole: string;
  onUpdate: (role: string) => void;
}

const RoleAdminControls: React.FC<RoleAdminControlsProps> = ({ address, chain, currentRole, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roles = ["user", "moderator", "admin"];
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <button
          key={role}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
            currentRole === role
              ? 'bg-emerald-500/90 text-black border-emerald-400/60'
              : 'bg-slate-900/40 text-slate-100 border-slate-600/70 hover:bg-slate-900/70'
          } ${loading ? 'opacity-60' : ''}`}
          disabled={loading || currentRole === role}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await adminFetch("/api/admin/role", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ address, chain, role })
              });
              const result = await res.json();
              if (res.ok && result.role) {
                onUpdate(result.role);
              } else {
                setError(result.message || "Failed to update role");
              }
            } catch {
              setError("Network error");
            } finally {
              setLoading(false);
            }
          }}
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </button>
      ))}
      {error && <span className="w-full text-red-400 text-xs">{error}</span>}
    </div>
  );
};

export default RoleAdminControls;
