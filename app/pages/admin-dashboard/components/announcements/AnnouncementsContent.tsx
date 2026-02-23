"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";

export type AnnouncementType = "notice" | "info" | "alert";

type Announcement = {
  id: string;
  type: AnnouncementType;
  title: string;
  description: string;
  created_at: string;
  created_by?: string | null;
  hidden?: boolean;
};

const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: "notice", label: "Notice" },
  { value: "info", label: "Info" },
  { value: "alert", label: "Alert" },
];

export function AnnouncementsContent() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "notice" as AnnouncementType, title: "", description: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHideMode, setShowHideMode] = useState(false);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hideSelected = async () => {
    if (selectedIds.size === 0) return;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: {session} } = await supabase.auth.getSession();
    if(!session?.access_token) {
      setError("Not signed in");
      return;
    }
    setError(null);
    try{
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), hidden: true }),

      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to hide announcements");
        return;
      }
      setSelectedIds(new Set());
      setShowHideMode(false);
      await load();
    } catch {
      setError("Request failed");
    }
  };

  const load = async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/admin/announcements", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Not signed in");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create announcement");
        return;
      }
      setForm({ type: "notice", title: "", description: "" });
      await load();
    } catch (e) {
      setError("Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso.slice(0, 10);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Announcements</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">Post notices, info, or alerts. They appear on the landing page.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#333333]">New announcement</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#333333]">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AnnouncementType }))}
              className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#333333]">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. System Maintenance"
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#333333]">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Full announcement text..."
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9] disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post announcement"}
          </button>
        </div>
      </form>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-center font-semibold text-[#333333]">Posted announcements</h3>
          {showHideMode ? (
            <div className="flex gap-3">
              <button onClick={hideSelected} disabled={selectedIds.size === 0} className="bg-orange-400 rounded-lg shadow-sm border-sm text-sm font-medium text-white py-2 px-4 text-lg disabled:opacity-50">
                Hide Selected
              </button>
              <button onClick={() => { setShowHideMode(false); setSelectedIds(new Set()); }} className="bg-gray-400 rounded-lg shadow-sm border-sm text-sm font-medium text-white py-2 px-4 text-lg">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowHideMode(true)} className="bg-orange-400 rounded-lg shadow-sm border-sm text-sm font-medium text-white py-2 px-4 text-lg">
              Hide Announcements
            </button>
          )}
        </div>
        {loading ? (
          <p className="mt-2 text-sm text-[#6C757D]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="mt-2 text-sm text-[#6C757D]">No announcements yet. Post one above.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {list.map((item) => (
              <article
                key={item.id}
                className={`flex gap-4 rounded-xl border p-4 shadow-sm ${
                  item.hidden
                    ? "border-[#D9D9D9] bg-[#F0F0F0]"
                    : "border-[#E9ECEF] bg-white"
                }`}
              >
                {showHideMode && (
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      className="h-4 w-4 accent-[#007bff]"
                      aria-label={`Select announcement ${item.title}`}
                    />
                  </div>
                )}

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 bg-white ${
                    item.type === "notice"
                      ? "border-[#FFC107]"
                      : item.type === "info"
                        ? "border-[#1877F2]"
                        : "border-[#EF5350]"
                  }`}
                >
                  <span
                    className={`text-lg ${
                      item.type === "notice"
                        ? "text-[#FFC107]"
                        : item.type === "info"
                          ? "text-[#1877F2]"
                          : "text-[#EF5350]"
                    }`}
                    aria-hidden
                  >
                    {item.type === "notice" ? "📅" : item.type === "info" ? "ℹ" : "⚠"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.type === "notice"
                          ? "bg-[#FFF3E0] text-[#333333]"
                          : item.type === "info"
                            ? "bg-[#E0EDFF] text-[#333333]"
                            : "bg-[#FFEBEE] text-[#333333]"
                      }`}
                    >
                      {TYPE_OPTIONS.find((o) => o.value === item.type)?.label ?? item.type}
                    </span>
                    {item.hidden && (
                      <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-[#E8E8E8] text-[#666666]">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#6C757D]">{formatDate(item.created_at)}</p>
                  <h4 className="mt-1 font-semibold text-[#333333]">{item.title}</h4>
                  <p className="mt-2 text-sm text-[#6C757D]">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
