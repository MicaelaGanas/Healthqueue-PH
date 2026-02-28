"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { AdminSectionHeader } from "../layout/AdminSectionHeader";

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
  const [manageVisibility, setManageVisibility] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ type: AnnouncementType; title: string; description: string }>({ type: "notice", title: "", description: "" });
  const [editSaving, setEditSaving] = useState(false);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateVisibility = async (hidden: boolean) => {
    if (selectedIds.size === 0) return;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Not signed in");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), hidden }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (hidden ? "Failed to hide" : "Failed to unhide"));
        return;
      }
      setSelectedIds(new Set());
      setManageVisibility(false);
      await load();
    } catch {
      setError("Request failed");
    }
  };

  const hideSelected = () => updateVisibility(true);
  const unhideSelected = () => updateVisibility(false);

  const startEdit = (item: Announcement) => {
    setEditingId(item.id);
    setEditForm({ type: item.type, title: item.title, description: item.description });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editForm.title.trim() || !editForm.description.trim()) {
      setError("Title and description are required");
      return;
    }
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Not signed in");
      return;
    }
    setError(null);
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/announcements/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: editForm.type,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      setEditingId(null);
      await load();
    } catch {
      setError("Request failed");
    } finally {
      setEditSaving(false);
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
      <AdminSectionHeader
        title="Announcements"
        description="Post notices, info, or alerts. They appear on the landing page."
      />

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#333333]">Posted announcements</h3>
          {manageVisibility ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={hideSelected}
                disabled={selectedIds.size === 0}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
              >
                Hide selected
              </button>
              <button
                type="button"
                onClick={unhideSelected}
                disabled={selectedIds.size === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                Unhide selected
              </button>
              <button
                type="button"
                onClick={() => { setManageVisibility(false); setSelectedIds(new Set()); }}
                className="rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setManageVisibility(true)}
              className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0069d9]"
            >
              Manage visibility (hide / unhide)
            </button>
          )}
        </div>
        {loading ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-6">
            <div className="h-8 w-8 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" aria-hidden />
            <span className="text-sm text-[#6C757D]">Loading…</span>
          </div>
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
                {manageVisibility && (
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
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#6C757D]">Type</label>
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as AnnouncementType }))}
                          className="mt-0.5 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
                        >
                          {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6C757D]">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          maxLength={200}
                          className="mt-0.5 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6C757D]">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          rows={3}
                          maxLength={2000}
                          className="mt-0.5 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={editSaving}
                          className="rounded-lg bg-[#007bff] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0069d9] disabled:opacity-50"
                        >
                          {editSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={editSaving}
                          className="rounded-lg border border-[#dee2e6] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa] disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
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
                        {!manageVisibility && (
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded border border-[#dee2e6] bg-white px-2 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#6C757D]">{formatDate(item.created_at)}</p>
                      <h4 className="mt-1 font-semibold text-[#333333]">{item.title}</h4>
                      <p className="mt-2 text-sm text-[#6C757D]">{item.description}</p>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
