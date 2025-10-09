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
    const res = await fetch("/api/admin/remove-moderation-item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-pink-200 mb-4">Content Moderation</h2>
      {loading ? (
        <div className="text-pink-200">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-pink-200">No flagged content found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 rounded-xl shadow-xl">
            <thead>
              <tr className="bg-pink-900 text-pink-200">
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Content</th>
                <th className="py-2 px-4">User</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-pink-800 hover:bg-pink-950">
                  <td className="py-2 px-4 text-pink-100">{item.type}</td>
                  <td className="py-2 px-4 text-pink-100 max-w-xs truncate">{item.content}</td>
                  <td className="py-2 px-4 text-pink-100">{item.user}</td>
                  <td className="py-2 px-4 text-pink-100">{new Date(item.date).toLocaleString()}</td>
                  <td className="py-2 px-4">
                    <button
                      className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded text-xs font-bold"
                      onClick={() => handleRemove(item.id)}
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
