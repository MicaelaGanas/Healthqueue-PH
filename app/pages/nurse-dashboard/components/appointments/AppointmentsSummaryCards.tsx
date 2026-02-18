"use client";

import { useMemo, useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useNurseQueue } from "../../context/NurseQueueContext";

type AppointmentsSummaryCardsProps = {
  pendingRefreshKey?: number;
};

export function AppointmentsSummaryCards({ pendingRefreshKey = 0 }: AppointmentsSummaryCardsProps) {
  const { queueRows } = useNurseQueue();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/booking-requests?status=pending", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    })();
  }, [pendingRefreshKey]);

  const stats = useMemo(() => {
    const booked = queueRows.filter((r) => r.source === "booked");
    const today = new Date();
    const todayBooked = booked.filter((r) => {
      const d = r.appointmentDate ? new Date(r.appointmentDate) : r.addedAt ? new Date(r.addedAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    });
    const scheduled = booked.filter((r) => r.status === "scheduled" || r.status === "waiting");
    const completed = booked.filter((r) => r.status === "completed");

    return {
      total: String(booked.length),
      today: String(todayBooked.length),
      inQueue: String(scheduled.length),
      completed: String(completed.length),
    };
  }, [queueRows]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-amber-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{pendingCount !== null ? String(pendingCount) : "—"}</p>
          <p className="text-sm text-[#6C757D]">Pending requests</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-[#007bff]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.total}</p>
          <p className="text-sm text-[#6C757D]">Total booked</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-[#007bff]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.today}</p>
          <p className="text-sm text-[#6C757D]">Today</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-green-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.inQueue}</p>
          <p className="text-sm text-[#6C757D]">In queue</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-[#6C757D]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.completed}</p>
          <p className="text-sm text-[#6C757D]">Completed</p>
        </div>
      </div>
    </div>
  );
}
