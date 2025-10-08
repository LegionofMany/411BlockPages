import React, { useEffect, useState } from "react";

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
    fetch("/api/admin/system-settings")
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(() => {
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
    const res = await fetch("/api/admin/system-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!res.ok) setError("Failed to save settings");
    setSaving(false);
  };

  if (loading) return <div className="text-cyan-200">Loading system settings...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!settings) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-cyan-200 mb-4">System Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-cyan-100 font-bold mb-1">Admin Wallets (comma separated)</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-gray-800 text-cyan-100 border border-cyan-700"
            value={settings.NEXT_PUBLIC_ADMIN_WALLETS}
            onChange={e => handleChange("NEXT_PUBLIC_ADMIN_WALLETS", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-cyan-100 font-bold mb-1">Maintenance Mode</label>
          <input
            type="checkbox"
            checked={!!settings.MAINTENANCE_MODE}
            onChange={e => handleChange("MAINTENANCE_MODE", e.target.checked)}
            className="mr-2"
          />
          <span className="text-cyan-100">Enable maintenance mode</span>
        </div>
        {/* Add more settings fields as needed */}
      </div>
      <button
        className="mt-4 bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded font-bold"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </section>
  );
};

export default SystemSettingsPanel;
