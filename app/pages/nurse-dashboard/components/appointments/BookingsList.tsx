"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useNurseQueue } from "../../context/NurseQueueContext";

type DateFilter = "all" | "today" | "week";

/** Confirmed booking request (from GET /api/booking-requests?status=confirmed). */
type ConfirmedBooking = {
  id: string;
  referenceNo: string;
  bookingType: string;
  patientFirstName?: string;
  patientLastName?: string;
  beneficiaryFirstName?: string;
  beneficiaryLastName?: string;
  department?: string;
  preferredDoctor?: string;
  requestedDate?: string;
  requestedTime?: string;
};

function formatTime(aptTime?: string): string {
  if (!aptTime) return "—";
  const [h, m] = aptTime.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getBookingDate(r: ConfirmedBooking): Date | null {
  if (r.requestedDate) {
    const d = new Date(r.requestedDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInWeek(bookingDate: Date, ref: Date): boolean {
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  const end = new Date(ref);
  end.setDate(end.getDate() + 7);
  end.setHours(0, 0, 0, 0);
  const t = bookingDate.getTime();
  return t >= start.getTime() && t < end.getTime();
}

function patientName(r: ConfirmedBooking): string {
  if (r.bookingType === "dependent") {
    return [r.beneficiaryFirstName, r.beneficiaryLastName].filter(Boolean).join(" ").trim() || "Dependent";
  }
  return [r.patientFirstName, r.patientLastName].filter(Boolean).join(" ").trim() || "Patient";
}

type BookingsListProps = {
  refreshTrigger?: number;
  onGoToVitals?: () => void;
};

export function BookingsList({ refreshTrigger = 0, onGoToVitals }: BookingsListProps) {
  const { queueRows, removeBookedPatient, confirmBooking, confirmedForTriage, refetchQueue } = useNurseQueue();
  const [confirmedList, setConfirmedList] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [justConfirmedRef, setJustConfirmedRef] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const ticketsInQueue = useMemo(() => new Set(queueRows.map((r) => r.ticket)), [queueRows]);

  const loadConfirmed = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase?.auth.getSession) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/booking-requests?status=confirmed", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Failed to load confirmed bookings");
      setConfirmedList([]);
      return;
    }
    const data = await res.json();
    setConfirmedList(Array.isArray(data) ? data : []);
    setError("");
  }, []);

  useEffect(() => {
    setLoading(true);
    loadConfirmed().finally(() => setLoading(false));
  }, [loadConfirmed, refreshTrigger]);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = confirmedList;
    if (dateFilter === "today") {
      list = list.filter((r) => {
        const d = getBookingDate(r);
        return d && sameDay(d, now);
      });
    } else if (dateFilter === "week") {
      list = list.filter((r) => {
        const d = getBookingDate(r);
        return d && isInWeek(d, now);
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          patientName(r).toLowerCase().includes(q) ||
          (r.referenceNo ?? "").toLowerCase().includes(q) ||
          (r.department ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [confirmedList, dateFilter, search]);

  const handleConfirmArrival = async (r: ConfirmedBooking) => {
    const supabase = createSupabaseBrowser();
    if (!supabase?.auth.getSession) return;
    setActingId(r.id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch(`/api/booking-requests/${r.id}/add-to-queue`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setActingId(null);
    if (res.ok) {
      await refetchQueue();
      confirmBooking(r.referenceNo);
      setJustConfirmedRef(r.referenceNo);
      await loadConfirmed();
    } else {
      const body = await res.json().catch(() => ({}));
      setError((body.error as string) || "Failed to add to queue");
    }
  };

  const handleCancel = async (r: ConfirmedBooking) => {
    if (typeof window !== "undefined" && !window.confirm("Cancel this booking? The patient will be removed from the queue.")) return;
    if (ticketsInQueue.has(r.referenceNo)) {
      removeBookedPatient(r.referenceNo);
      return;
    }
    const supabase = createSupabaseBrowser();
    if (!supabase?.auth.getSession) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch(`/api/booking-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) await loadConfirmed();
  };

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      {justConfirmedRef && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Arrival confirmed for <strong>{justConfirmedRef}</strong>. Go to Vitals &amp; Triage to record vitals; then they will appear in Queue Management.
          </p>
          <div className="flex items-center gap-2">
            {onGoToVitals && (
              <button
                type="button"
                onClick={() => { onGoToVitals(); setJustConfirmedRef(null); }}
                className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
              >
                Go to Vitals & Triage
              </button>
            )}
            <button
              type="button"
              onClick={() => setJustConfirmedRef(null)}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-800 hover:bg-green-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <h3 className="border-b border-[#e9ecef] px-4 py-3 text-base font-bold text-[#333333]">
        Patient booking requests
      </h3>
      {error && (
        <div className="border-b border-[#e9ecef] px-4 py-2 bg-red-50 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="underline">Dismiss</button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-b border-[#e9ecef] p-4 sm:gap-3">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reference, department..."
            className="w-full rounded-lg border border-[#dee2e6] py-2 pl-10 pr-3 text-sm text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        >
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
        </select>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Department</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Doctor</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Time</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Date</th>
              <th className="px-4 py-3 text-right font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#6C757D]">Loading confirmed bookings…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#6C757D]">
                  {confirmedList.length === 0
                    ? "No confirmed bookings. Confirm pending requests above to add them here; then confirm arrival when the patient shows up."
                    : "No bookings match the current filters."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const bookingDate = getBookingDate(r);
                const dateStr = bookingDate ? bookingDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";
                const inQueue = ticketsInQueue.has(r.referenceNo);
                const alreadyConfirmedForTriage = confirmedForTriage.includes(r.referenceNo);
                return (
                  <tr key={r.id} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-medium text-[#333333]">{r.referenceNo}</td>
                    <td className="px-4 py-3 text-[#333333]">{patientName(r)}</td>
                    <td className="px-4 py-3 text-[#333333]">{r.department ?? "—"}</td>
                    <td className="px-4 py-3 text-[#333333]">{r.preferredDoctor ?? "—"}</td>
                    <td className="px-4 py-3 text-[#333333]">{formatTime(r.requestedTime)}</td>
                    <td className="px-4 py-3 text-[#333333]">{dateStr}</td>
                    <td className="px-4 py-3 text-right">
                      {alreadyConfirmedForTriage ? (
                        <span className="text-xs font-medium text-[#6C757D]">Confirmed</span>
                      ) : inQueue ? (
                        <span className="text-xs font-medium text-[#6C757D]">In queue</span>
                      ) : (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={actingId === r.id}
                            onClick={() => handleConfirmArrival(r)}
                            className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-100 disabled:opacity-50"
                          >
                            {actingId === r.id ? "Adding…" : "Confirm arrival"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(r)}
                            className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Cancel booking
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
