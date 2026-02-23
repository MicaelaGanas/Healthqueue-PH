"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useNurseQueue } from "../../context/NurseQueueContext";
import type { QueueRow } from "../../context/NurseQueueContext";
import type { QueueFiltersState } from "./QueueFilters";
import { formatDateDisplay } from "../../../../lib/schedule";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  normal: 1,
};

const PRIORITY_STYLES: Record<string, string> = {
  normal: "bg-blue-100 text-blue-800",
  urgent: "bg-amber-100 text-amber-800",
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  waiting: "bg-gray-100 text-gray-700",
  called: "bg-amber-100 text-amber-800",
  "in progress": "bg-emerald-100 text-emerald-800",
  completed: "bg-green-100 text-green-800",
  "no show": "bg-red-100 text-red-800",
  "needs_vitals": "bg-amber-50 text-amber-900 border border-amber-200",
};

/** Status labels aligned with patient flow: Confirmed date → Arrived → Vitals & triage → Waiting for doctor → Meeting with doctor → Done */
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Waiting for doctor",
  waiting: "Waiting for doctor",
  called: "Waiting for doctor",
  "in progress": "Meeting with doctor",
  completed: "Done",
  "no show": "No show",
  "needs_vitals": "Needs vitals",
};

const SOURCE_STYLES: Record<string, string> = {
  booked: "bg-indigo-100 text-indigo-800",
  "walk-in": "bg-teal-100 text-teal-800",
};

/** Format slot time for display (24h "HH:mm" → 12h). */
function formatSlotTime(r: QueueRow): string {
  if (r.appointmentTime) {
    const [h, m] = r.appointmentTime.split(":").map(Number);
    const hour = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  if (r.addedAt) {
    const d = new Date(r.addedAt);
    return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return "—";
}

/** Format date + time for queue display (e.g. "Today, Feb 12 · 9:30 AM"). */
function formatDateAndTime(r: QueueRow): string {
  const timeStr = formatSlotTime(r);
  if (r.appointmentDate) {
    return formatDateDisplay(r.appointmentDate, { useTodayLabel: true }) + " · " + timeStr;
  }
  return timeStr;
}

const MINS_PER_PATIENT = 10;

function sortKey(r: QueueRow): string {
  const p = PRIORITY_ORDER[r.priority] ?? 2;
  const date = r.appointmentDate ?? "9999-99-99";
  const time = r.appointmentTime
    ? "A" + r.appointmentTime
    : "B" + (r.addedAt ?? "9999");
  return `${p}-${date}-${time}`;
}

function getEstimatedWait(sortedRows: QueueRow[], ticket: string, department: string): string {
  const waitingInDept = sortedRows.filter(
    (r) => r.status === "waiting" && r.department === department
  );
  const idx = waitingInDept.findIndex((r) => r.ticket === ticket);
  if (idx < 0) return "";
  const mins = idx * MINS_PER_PATIENT;
  return mins > 0 ? `~${mins} min` : "—";
}

function Badge({ value, styles, labels }: { value: string; styles: Record<string, string>; labels?: Record<string, string> }) {
  const key = value.toLowerCase();
  const label = (labels && (labels[value] ?? labels[key])) ?? value.replace(/_/g, " ");
  const cls = styles[value] ?? styles[key] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

type PatientQueueTableProps = {
  filters: QueueFiltersState;
  managedDepartment?: string;
  doctorOnDuty?: string;
};

/** Booked patients need vitals before they can be "waiting for doctor". Walk-ins are ready once in queue. */
function isReadyForDoctor(r: QueueRow, ticketsWithVitals: Set<string>): boolean {
  return r.source === "walk-in" || ticketsWithVitals.has(r.ticket);
}

/** Display status: show "Needs vitals" for booked patients without vitals who are scheduled/waiting. */
function displayStatus(r: QueueRow, ticketsWithVitals: Set<string>): string {
  if (
    r.source === "booked" &&
    !ticketsWithVitals.has(r.ticket) &&
    (r.status === "scheduled" || r.status === "waiting")
  ) {
    return "needs_vitals";
  }
  return r.status;
}

export function PatientQueueTable({ filters, managedDepartment, doctorOnDuty }: PatientQueueTableProps) {
  const { queueRows, setPatientStatus } = useNurseQueue();
  const [ticketsWithVitals, setTicketsWithVitals] = useState<Set<string>>(new Set());

  const fetchVitals = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/vitals", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const tickets = new Set<string>(list.map((v: { ticket: string }) => v.ticket));
    setTicketsWithVitals(tickets);
  }, []);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals, queueRows.length]);

  const { sortedAndFiltered, currentWithDoctor, suggestedNextTicket, suggestedNextPatientName, waitTimeByTicket } = useMemo(() => {
    let scope = managedDepartment
      ? queueRows.filter((r) => r.department === managedDepartment)
      : queueRows;
    if (doctorOnDuty) {
      scope = scope.filter((r) => r.assignedDoctor === doctorOnDuty);
    }
    // Do not show booked patients in queue until vitals are recorded (they belong in Vitals & Triage first).
    scope = scope.filter((r) => r.source === "walk-in" || ticketsWithVitals.has(r.ticket));
    const sorted = [...scope].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      return ka.localeCompare(kb);
    });

    const byDept = !managedDepartment && filters.department !== "all"
      ? sorted.filter((r) => r.department === filters.department)
      : sorted;
    const byStatus = filters.status !== "all"
      ? byDept.filter((r) => r.status === filters.status)
      : byDept;
    const searchLower = filters.search.trim().toLowerCase();
    const filtered = searchLower
      ? byStatus.filter(
          (r) =>
            r.patientName.toLowerCase().includes(searchLower) ||
            r.ticket.toLowerCase().includes(searchLower)
        )
      : byStatus;

    const currentWithDoctor = filtered.find((r) => r.status === "in progress") ?? null;
    const firstWaiting = filtered.find(
      (r) =>
        (r.status === "waiting" || r.status === "scheduled" || r.status === "called") &&
        isReadyForDoctor(r, ticketsWithVitals)
    );
    const suggestedNextTicket = firstWaiting?.ticket ?? null;
    const suggestedNextPatientName = firstWaiting?.patientName ?? null;

    const waitingForDoctor = sorted.filter((r) => r.status === "waiting" && isReadyForDoctor(r, ticketsWithVitals));
    const waitTimeByTicket: Record<string, string> = {};
    filtered.forEach((r) => {
      if (r.status === "waiting" && isReadyForDoctor(r, ticketsWithVitals)) {
        waitTimeByTicket[r.ticket] = getEstimatedWait(waitingForDoctor, r.ticket, r.department);
      }
    });

    return {
      sortedAndFiltered: filtered,
      currentWithDoctor,
      suggestedNextTicket,
      suggestedNextPatientName,
      waitTimeByTicket,
    };
  }, [queueRows, filters, managedDepartment, doctorOnDuty, ticketsWithVitals]);

  const getDisplayStatus = useCallback(
    (r: QueueRow) => displayStatus(r, ticketsWithVitals),
    [ticketsWithVitals]
  );

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      <h3 className="border-b border-[#e9ecef] px-4 py-3 text-base font-bold text-[#333333]">
        Patient Queue
        <span className="ml-2 text-sm font-normal text-[#6C757D]">(sorted by priority, then appointment/add time)</span>
      </h3>
      <div className="border-b border-[#e9ecef]">
        {currentWithDoctor && (
          <div className="flex flex-wrap items-center gap-3 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-medium text-emerald-800">Meeting with doctor:</span>
            <span className="text-sm font-semibold text-[#333333]">{currentWithDoctor.patientName}</span>
            <span className="text-sm text-[#6C757D]">({currentWithDoctor.ticket})</span>
          </div>
        )}
        {suggestedNextTicket && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-50/80 px-4 py-3">
            <p className="text-sm text-[#333333]">
              <span className="font-medium text-sky-800">Next (waiting for doctor):</span>{" "}
              <span className="font-semibold">{suggestedNextPatientName}</span> ({suggestedNextTicket})
            </p>
            <button
              type="button"
              onClick={() => setPatientStatus(suggestedNextTicket, "in progress")}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              <PlayIcon className="h-5 w-5" />
              Send to doctor
            </button>
          </div>
        )}
        {!currentWithDoctor && !suggestedNextTicket && sortedAndFiltered.length > 0 && (
          <div className="px-4 py-3 text-sm text-[#6C757D]">
            No one meeting with the doctor. Everyone below is done or no-show — no one waiting for doctor. Record vitals in Vitals &amp; Triage, then they will appear here to send to doctor.
          </div>
        )}
        {!currentWithDoctor && !suggestedNextTicket && sortedAndFiltered.length === 0 && (
          <div className="px-4 py-3 text-sm text-[#6C757D]">
            Queue is empty. Confirm arrivals in Manage Bookings, record vitals in Vitals &amp; Triage, or add walk-ins in Registration.
          </div>
        )}
      </div>
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="sticky top-0 z-10 border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <th className="px-2 py-2.5 text-center font-medium text-[#333333]" title="Position in queue">#</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Ticket</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Department</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Date & time</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Type</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Priority</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Status</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Wait</th>
              <th className="px-3 py-2.5 text-right font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((r, index) => {
              const isSuggestedNext = r.ticket === suggestedNextTicket;
              const isInProgress = r.status.toLowerCase() === "in progress";
              const estWait = r.status === "waiting" ? (waitTimeByTicket[r.ticket] ?? "—") : (r.waitTime || "—");
              return (
                <tr
                  key={r.ticket}
                  className={`border-b border-[#e9ecef] last:border-b-0 ${
                    isInProgress
                      ? "border-l-4 border-l-emerald-500 bg-emerald-50/80 hover:bg-emerald-50"
                      : isSuggestedNext
                        ? "bg-sky-50 ring-inset ring-1 ring-sky-200 hover:bg-sky-100/80"
                        : "hover:bg-[#f8f9fa]"
                  }`}
                >
                  <td className="align-middle px-2 py-2.5 text-center text-[#6C757D] tabular-nums">
                    {index + 1}
                  </td>
                  <td className="align-middle min-w-0 overflow-hidden px-3 py-2.5 font-medium text-[#333333]" title={r.ticket}>
                    <span className="inline-block max-w-full truncate align-middle">
                      {r.ticket}
                      {isSuggestedNext && (
                        <span className="ml-1.5 inline rounded bg-sky-600 px-1.5 py-0.5 text-xs font-medium text-white">Next</span>
                      )}
                      {isInProgress && (
                        <span className="ml-1.5 inline rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-medium text-white">Meeting with doctor</span>
                      )}
                    </span>
                  </td>
                  <td className="align-middle min-w-0 overflow-hidden px-3 py-2.5 text-[#333333]" title={r.patientName}>
                    <span className="block truncate">{r.patientName}</span>
                  </td>
                  <td className="align-middle px-3 py-2.5 text-[#333333]" title={r.department}>
                    <span className="block truncate max-w-[120px]">{r.department}</span>
                  </td>
                  <td className="align-middle px-3 py-2.5 text-[#333333]">
                    <span className="whitespace-nowrap" title={formatDateAndTime(r)}>{formatDateAndTime(r)}</span>
                  </td>
                  <td className="align-middle px-3 py-2.5">
                    <Badge value={r.source === "booked" ? "Reserved" : "Walk-in"} styles={{ Reserved: SOURCE_STYLES.booked, "Walk-in": SOURCE_STYLES["walk-in"] } as Record<string, string>} />
                  </td>
                  <td className="align-middle px-3 py-2.5">
                    <Badge value={r.priority} styles={PRIORITY_STYLES} />
                  </td>
                  <td className="align-middle px-3 py-2.5">
                    <Badge value={getDisplayStatus(r)} styles={STATUS_STYLES} labels={STATUS_LABELS} />
                  </td>
                  <td className="align-middle px-3 py-2.5 whitespace-nowrap text-[#333333]">{estWait}</td>
                  <td className="align-middle px-3 py-2.5 text-right">
                    {(getDisplayStatus(r) === "scheduled" || getDisplayStatus(r) === "waiting" || getDisplayStatus(r) === "needs_vitals") && r.source === "booked" && (
                      <button
                        type="button"
                        onClick={() => setPatientStatus(r.ticket, "no show")}
                        className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        title="Mark no-show"
                      >
                        No show
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
