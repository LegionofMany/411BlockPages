import React, { useState } from "react";

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
    <div className="flex gap-1 mt-1">
      {roles.map((role) => (
        <button
          key={role}
          className={`px-2 py-0.5 rounded text-xs font-bold border ${currentRole === role ? 'bg-blue-700 text-white' : 'bg-gray-800 text-blue-200'} ${loading ? 'opacity-60' : ''}`}
          disabled={loading || currentRole === role}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const adminWallet = localStorage.getItem("wallet") || "";
              const res = await fetch("/api/admin/role", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-admin-address": adminWallet
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
      {error && <span className="ml-2 text-red-400 text-xs">{error}</span>}
    </div>
  );
};

export default RoleAdminControls;
