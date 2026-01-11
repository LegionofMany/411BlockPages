"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "../../components/admin/AdminLayout";
import useAdminWallet from "../../hooks/useAdminWallet";
import adminFetch from "../../components/admin/adminFetch";

type CharityRow = {
  _id?: string;
  charityId?: string;
  givingBlockId?: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  donationAddress?: string;
  hidden?: boolean;
  tags?: string[];
  categories?: string[];
  givingBlockEmbedUrl?: string;
};

export default function AdminCharitiesAppPage() {
  const pathname = usePathname() || "/admin/charities";
  const { adminWallet } = useAdminWallet();
  const [items, setItems] = useState<CharityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState<CharityRow | null>(null);
  const [form, setForm] = useState<CharityRow>({
    name: "",
    website: "",
    description: "",
    logo: "",
    donationAddress: "",
    tags: [],
    categories: [],
    givingBlockEmbedUrl: "",
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/charities?includeHidden=1", { credentials: "include" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const js = await res.json();
      const list = (js && js.results) || js || [];
      setItems(list as CharityRow[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load charities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditing(null);
    setForm({
      name: "",
      website: "",
      description: "",
      logo: "",
      donationAddress: "",
      givingBlockId: "",
      charityId: "",
      tags: [],
      categories: [],
      givingBlockEmbedUrl: "",
    });
  }

  function startEdit(c: CharityRow) {
    setEditing(c);
    setForm({
      _id: c._id,
      charityId: c.charityId,
      givingBlockId: c.givingBlockId,
      name: c.name || "",
      website: c.website || "",
      description: c.description || "",
      logo: c.logo || "",
      donationAddress: c.donationAddress || "",
      hidden: c.hidden,
      tags: c.tags || [],
      categories: c.categories || [],
      givingBlockEmbedUrl: c.givingBlockEmbedUrl || "",
    });
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    // Normalize and validate inputs before sending to server
    function normalizeCharityInput(c: CharityRow) {
      return {
        ...c,
        description: c.description ? String(c.description).slice(0, 1000) : "",
        // mission field support: keep if present
        mission: (c as any).mission ? String((c as any).mission).slice(0, 500) : undefined,
      };
    }

    const normalized = normalizeCharityInput(form);
    if ((normalized.description || "").length > 1000) {
      alert('Description exceeds allowed length (1000 characters)');
      return;
    }

    const payload: any = {
      name: form.name,
      website: form.website,
      description: normalized.description,
      logo: form.logo,
      donationAddress: form.donationAddress,
      givingBlockId: form.givingBlockId,
      charityId: form.charityId,
      tags: form.tags,
      categories: form.categories,
       givingBlockEmbedUrl: form.givingBlockEmbedUrl,
    };
    try {
      const method = editing && editing._id ? "PATCH" : "POST";
      const res = await adminFetch("/api/charities", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editing?._id }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      await load();
      setEditing(null);
      setForm({
        name: "",
        website: "",
        description: "",
        logo: "",
        donationAddress: "",
        givingBlockId: "",
        charityId: "",
        tags: [],
        categories: [],
        givingBlockEmbedUrl: "",
      });
    } catch (e: any) {
      alert(e?.message || "Failed to save charity");
    }
  }

  async function toggleHidden(item: CharityRow) {
    if (!item._id) return;
    try {
      const res = await adminFetch("/api/admin/charities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, hidden: !item.hidden }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const js = await res.json();
      const updated = (js && js.charity) || null;
      if (!updated) return;
      setItems((prev) =>
        prev.map((c) =>
          c._id === updated._id ? { ...c, hidden: updated.hidden } : c
        )
      );
    } catch (e: any) {
      alert(e?.message || "Failed to update charity");
    }
  }

  async function runSync() {
    if (!confirm("Run charity sync from The Giving Block now?")) return;
    setSyncing(true);
    try {
      const res = await adminFetch("/api/charities/sync", { method: "POST" });
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
      await load();
      alert("Sync complete");
    } catch (e: any) {
      alert(e?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AdminLayout currentPath={pathname} adminWallet={adminWallet}>
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">
          Charity Directory Management
        </h2>
        <p className="text-sm text-slate-300/90">
          Create, update, and hide charities synced from The Giving Block or
          added locally.
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-3xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-100 max-w-6xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-300">Loading charities…</div>
      ) : (
        <>
          <section className="mb-6 max-w-6xl">
            <form
              onSubmit={saveForm}
              className="rounded-3xl border border-emerald-500/25 bg-black/70 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.9)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  {editing ? "Edit charity" : "Create charity"}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={startCreate}
                    className="inline-flex items-center justify-center rounded-full border border-slate-500/70 bg-slate-800/70 px-3 py-1.5 font-semibold uppercase tracking-[0.14em] text-slate-100 hover:bg-slate-700/80 transition-colors"
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={runSync}
                    disabled={syncing}
                    className="inline-flex items-center justify-center rounded-full border border-amber-400/70 bg-amber-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20 disabled:opacity-60 transition-colors"
                  >
                    {syncing ? "Syncing…" : "Sync from Giving Block"}
                  </button>
                </div>
              </div>
              <div className="mb-2 grid gap-2 md:grid-cols-2 text-xs text-slate-300">
                <label className="flex flex-col">
                  Name
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="flex flex-col">
                  Website
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={form.website || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, website: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  Description
                  <textarea
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50 h-32 overflow-y-auto resize-none"
                    rows={4}
                    maxLength={1000}
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                  <div className="mt-1 text-xs text-slate-400">{(form.description || "").length}/1000</div>
                </label>
                <label className="flex flex-col md:col-span-2">
                  Logo URL
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={form.logo || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, logo: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  Donation wallet address
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    placeholder="0x... or other on-chain address"
                    value={form.donationAddress || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, donationAddress: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  Giving Block embed URL
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    placeholder="https://...thegivingblock.com/embed/..."
                    value={form.givingBlockEmbedUrl || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, givingBlockEmbedUrl: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col">
                  Giving Block ID
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={form.givingBlockId || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, givingBlockId: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col">
                  Local Charity ID
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={form.charityId || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, charityId: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  Tags (comma-separated)
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={(form.tags || []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parts = raw
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setForm((f) => ({ ...f, tags: parts }));
                    }}
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  Categories (comma-separated)
                  <input
                    className="mt-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-sm text-amber-50"
                    value={(form.categories || []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parts = raw
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setForm((f) => ({ ...f, categories: parts }));
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-2 mt-3 text-[11px]">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/20 transition-colors"
                >
                  {editing ? "Save changes" : "Create"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-slate-500/70 bg-slate-800/70 px-3 py-1.5 font-semibold uppercase tracking-[0.14em] text-slate-100 hover:bg-slate-700/80 transition-colors"
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        name: "",
                        website: "",
                        description: "",
                        logo: "",
                        donationAddress: "",
                        givingBlockId: "",
                        charityId: "",
                        tags: [],
                        categories: [],
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="max-w-6xl space-y-2">
            {items.map((c) => (
              <div
                key={c._id || c.charityId || c.name}
                className="flex items-center justify-between rounded-3xl border border-slate-700/70 bg-black/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
              >
                <div>
                  <div className="text-sm font-medium text-amber-50">
                    {c.name}
                    {c.hidden && (
                      <span className="ml-2 text-[11px] text-slate-400">
                        (hidden)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300">{c.website}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                    {c.givingBlockId && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600/70">
                        GB: {c.givingBlockId}
                      </span>
                    )}
                    {c.charityId && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600/70">
                        Local: {c.charityId}
                      </span>
                    )}
                    {(c.tags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <button
                    onClick={() => startEdit(c)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-500/70 bg-slate-800/70 px-3 py-1.5 font-semibold uppercase tracking-[0.14em] text-slate-100 hover:bg-slate-700/80 transition-colors"
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleHidden(c)}
                    className="inline-flex items-center justify-center rounded-full border border-amber-400/70 bg-amber-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20 transition-colors"
                    type="button"
                  >
                    {c.hidden ? "Unhide" : "Hide"}
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </AdminLayout>
  );
}
