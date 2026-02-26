"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";

type PatientNotification = {
  id: string;
  type: string;
  title: string;
  detail: string;
  unread: boolean;
  createdAt?: string;
};

function formatWhen(value?: string): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export function Notification() {
  const [items, setItems] = useState<PatientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setError("Unable to load session.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError("Please sign in to view your notifications.");
          setItems([]);
          return;
        }

        const res = await fetch("/api/patient-notifications", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        const data = await res.json().catch(() => []);
        if (!res.ok) {
          setError("Failed to load notifications.");
          setItems([]);
          return;
        }

        setItems(Array.isArray(data) ? data : []);
        setError("");
      } catch {
        setError("Failed to load notifications.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

  if (loading) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-8" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
        <p className="text-gray-600">Loading notifications…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-8" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-8" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#333333]">Your notifications</h2>
        <span className="text-sm text-gray-500">Unread: {unreadCount}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600">No notifications yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-lg border p-4 ${item.unread ? "border-[#007bff]/30 bg-[#e7f1ff]/40" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#333333]">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-700">{item.detail}</p>
                  {item.createdAt && (
                    <p className="mt-2 text-xs text-gray-500">{formatWhen(item.createdAt)}</p>
                  )}
                </div>
                {item.unread && (
                  <span className="inline-flex rounded-full bg-[#007bff] px-2 py-0.5 text-[11px] font-semibold text-white">
                    New
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
