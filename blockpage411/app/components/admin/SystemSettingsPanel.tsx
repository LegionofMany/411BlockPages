import React, { useEffect, useState } from "react";
import adminFetch from "./adminFetch";

interface Settings {
  NEXT_PUBLIC_ADMIN_WALLETS: string;
  MAINTENANCE_MODE: boolean;
  [key: string]: string | boolean;
}

const SystemSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/system-settings")
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error('SystemSettings fetch error', err);
        setError("Failed to load system settings");
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(s => s ? { ...s, [key]: value } : s);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await adminFetch("/api/admin/system-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!res.ok) setError("Failed to save settings");
    setSaving(false);
  };

  if (loading) return <div className="text-slate-200">Loading system settings...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!settings) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100">System Settings</h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-slate-200 text-sm font-semibold mb-1">Admin Wallets (comma separated)</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-md bg-black/30 text-slate-100 border border-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            value={settings.NEXT_PUBLIC_ADMIN_WALLETS}
            onChange={e => handleChange("NEXT_PUBLIC_ADMIN_WALLETS", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-slate-200 text-sm font-semibold mb-2">Maintenance Mode</label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={!!settings.MAINTENANCE_MODE}
              onChange={e => handleChange("MAINTENANCE_MODE", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30"
            />
            Enable maintenance mode
          </label>
        </div>
        {/* Add more settings fields as needed */}
      </div>
      <div className="px-4 pb-4">
        <button
          className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold border border-emerald-400/40 bg-emerald-500/90 text-black hover:bg-emerald-500 disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </section>
  );
};

export default SystemSettingsPanel;
