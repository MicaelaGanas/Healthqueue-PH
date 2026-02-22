"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import Link from "next/link";

type QueueStatusData = {
  queueNumber: string;
  department: string;
  status: string;
  waitTime: string;
  appointmentDate: string | null;
  appointmentTime: string | null;
};

function formatTime(t?: string | null): string {
  if (!t) return "";
  const parts = String(t).trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(ymd?: string | null): string {
  if (!ymd) return "";
  try {
    const [y, m, d] = String(ymd).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(ymd);
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    waiting: "Waiting",
    scheduled: "Scheduled",
    called: "Called",
    "in progress": "In progress",
    completed: "Completed",
  };
  return labels[status] ?? status;
}

export function QueueStatus() {
  const [data, setData] = useState<QueueStatusData | null | undefined>(undefined);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Please sign in to view your queue status.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/queue/status/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setData(null);
          setError("");
          return;
        }
        const json = await res.json();
        setData(json ?? null);
        setError("");
      } catch {
        setError("Failed to load queue status.");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-8">
        <p className="text-gray-600">Loading your queue status…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-8">
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-8 text-center">
          <h3 className="text-lg font-semibold text-[#333333]">No active queue number</h3>
          <p className="mt-2 text-gray-600">
            You don’t have an appointment or queue number right now. Book an appointment and wait for confirmation, or check in at the front desk to get a queue number.
          </p>
          <Link
            href="/pages/book/step-1"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
          >
            Book an appointment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-8 space-y-6">
      <div className="bg-gray-50 p-8 rounded-lg">
        <p className="text-sm text-gray-600">Your Queue Number</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-5xl font-bold text-[#333333]">{data.queueNumber}</h2>
            <p className="text-gray-600">{data.department}</p>
            {(data.appointmentDate || data.appointmentTime) && (
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(data.appointmentDate)}
                {data.appointmentTime ? ` · ${formatTime(data.appointmentTime)}` : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-[#333333]">
              {statusLabel(data.status)}
            </span>
            {data.waitTime && (
              <p className="mt-2 text-lg font-semibold text-[#007bff]">Estimate: {data.waitTime}</p>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Please wait until your number is called. Check the appointments tab for your booking details.
      </p>
    </div>
  );
}
