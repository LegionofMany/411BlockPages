import React, { useEffect, useState } from "react";
import adminFetch from "./adminFetch";

interface ModerationItem {
  id: string;
  type: "comment" | "rating" | "message";
  content: string;
  user: string;
  date: string;
  flagged?: boolean;
}

const ContentModerationTable: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/moderation-items")
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Moderation fetch error', err);
        setError("Failed to load moderation items");
        setLoading(false);
      });
  }, []);

  const handleRemove = async (id: string) => {
    const res = await adminFetch("/api/admin/remove-moderation-item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100">Content Moderation</h2>
      </div>
      {loading ? (
        <div className="px-4 py-4 text-slate-200">Loading...</div>
      ) : error ? (
        <div className="px-4 py-4 text-red-400">{error}</div>
      ) : items.length === 0 ? (
        <div className="px-4 py-4 text-slate-200">No flagged content found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-200">
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Content</th>
                <th className="py-2 px-4 text-left">User</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{item.type}</td>
                  <td className="py-2 px-4 text-slate-200 max-w-[22rem] sm:max-w-[32rem] break-words">
                    {item.content}
                  </td>
                  <td className="py-2 px-4 font-mono text-slate-300 break-all">{item.user}</td>
                  <td className="py-2 px-4 text-slate-300 whitespace-nowrap">{new Date(item.date).toLocaleString()}</td>
                  <td className="py-2 px-4">
                    <button
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-red-400/30 bg-red-500/90 text-black hover:bg-red-500"
                      onClick={() => handleRemove(item.id)}
                      type="button"
                    >Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ContentModerationTable;
