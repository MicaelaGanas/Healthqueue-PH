"use client";

import { useMemo, useState } from "react";
import { useNurseQueue } from "../../context/NurseQueueContext";
import type { QueueRow } from "../../context/NurseQueueContext";
import type { QueueFiltersState } from "./QueueFilters";
import { PatientSummaryOverlay } from "../PatientSummaryOverlay";
import { SLOT_TIMES_24 } from "../../../../lib/slotTimes";
import { formatDateDisplay, getTodayYYYYMMDD } from "../../../../lib/schedule";

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
  "in progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  "no show": "bg-red-100 text-red-800",
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

function Badge({ value, styles }: { value: string; styles: Record<string, string> }) {
  const label = value.replace(/_/g, " ");
  const cls = styles[value] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6v0a6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
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

const TIME_OPTIONS = SLOT_TIMES_24;

type PatientQueueTableProps = {
  filters: QueueFiltersState;
  /** When set, only show queue for this specialty. */
  managedDepartment?: string;
  /** When set with managedDepartment, only show this doctor's queue (no other doctors' patients). */
  doctorOnDuty?: string;
};

type SlotStatus = "available" | "open" | "taken";

function getSlotStatusForTimes(
  queueRows: QueueRow[],
  openSlots: { department: string; appointmentTime: string }[],
  managedDepartment: string,
  doctorOnDuty: string | undefined,
  excludeTicket: string
): Record<string, { status: SlotStatus; patientName?: string }> {
  const scope = managedDepartment
    ? queueRows.filter((r) => r.department === managedDepartment)
    : queueRows;
  const sameQueue = doctorOnDuty ? scope.filter((r) => r.assignedDoctor === doctorOnDuty) : scope;
  const openSet = new Set(
    openSlots
      .filter((s) => !managedDepartment || s.department === managedDepartment)
      .map((s) => s.appointmentTime)
  );
  const takenBy: Record<string, string> = {};
  for (const r of sameQueue) {
    if (r.ticket === excludeTicket || !r.appointmentTime) continue;
    takenBy[r.appointmentTime] = r.patientName;
  }
  const result: Record<string, { status: SlotStatus; patientName?: string }> = {};
  for (const t of TIME_OPTIONS) {
    if (openSet.has(t)) {
      result[t] = { status: "open" };
    } else if (takenBy[t]) {
      result[t] = { status: "taken", patientName: takenBy[t] };
    } else {
      result[t] = { status: "available" };
    }
  }
  return result;
}

export function PatientQueueTable({ filters, managedDepartment, doctorOnDuty }: PatientQueueTableProps) {
  const { queueRows, setPatientStatus, setPatientSlot, openSlots } = useNurseQueue();
  const [notifiedTicket, setNotifiedTicket] = useState<string | null>(null);
  const [rescheduleFor, setRescheduleFor] = useState<{ ticket: string; patientName: string } | null>(null);
  const [summaryForTicket, setSummaryForTicket] = useState<string | null>(null);

  const { sortedAndFiltered, suggestedNextTicket, waitTimeByTicket } = useMemo(() => {
    let scope = managedDepartment
      ? queueRows.filter((r) => r.department === managedDepartment)
      : queueRows;
    if (doctorOnDuty) {
      scope = scope.filter((r) => r.assignedDoctor === doctorOnDuty);
    }
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

    const firstWaiting = filtered.find((r) => r.status === "waiting");
    const suggestedNextTicket = firstWaiting?.ticket ?? null;

    const waitTimeByTicket: Record<string, string> = {};
    filtered.forEach((r) => {
      if (r.status === "waiting") {
        waitTimeByTicket[r.ticket] = getEstimatedWait(sorted, r.ticket, r.department);
      }
    });

    return {
      sortedAndFiltered: filtered,
      suggestedNextTicket,
      waitTimeByTicket,
    };
  }, [queueRows, filters, managedDepartment, doctorOnDuty]);

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, []);

  const rescheduleSlotStatus = useMemo(() => {
    if (!rescheduleFor || !managedDepartment) return {};
    return getSlotStatusForTimes(
      queueRows,
      openSlots,
      managedDepartment,
      doctorOnDuty,
      rescheduleFor.ticket
    );
  }, [rescheduleFor, queueRows, openSlots, managedDepartment, doctorOnDuty]);

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      {rescheduleFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden
            onClick={() => setRescheduleFor(null)}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-xl border border-[#e9ecef] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#333333]">Reschedule</h3>
                <p className="mt-1 text-base font-semibold text-[#333333]">
                  {rescheduleFor.patientName}
                </p>
                <p className="mt-0.5 text-sm text-[#6C757D]">
                  Ticket: {rescheduleFor.ticket}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleFor(null)}
                className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-1 text-sm font-medium text-[#333333]">For: {todayLabel}</p>
            <p className="mb-3 text-xs text-[#6C757D]">
              Slots for this day. Available = free; Open = freed (no-show/cancel); Taken = another patient.
            </p>
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-auto sm:grid-cols-4">
              {TIME_OPTIONS.map((t) => {
                const info = rescheduleSlotStatus[t] ?? { status: "available" as SlotStatus };
                const canSelect = info.status === "available" || info.status === "open";
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!canSelect}
                    onClick={() => {
                      if (!canSelect) return;
                      setPatientSlot(rescheduleFor.ticket, t, getTodayYYYYMMDD());
                      setRescheduleFor(null);
                    }}
                    className={`rounded-lg border py-2.5 text-left text-sm font-medium ${
                      !canSelect
                        ? "cursor-not-allowed border-amber-200 bg-amber-50/50 text-amber-800"
                        : info.status === "open"
                          ? "border-green-300 bg-green-50 text-green-800 hover:border-green-500 hover:bg-green-100"
                          : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f0f7ff] hover:text-[#007bff]"
                    }`}
                  >
                    <span className="block">{formatSlotTime({ appointmentTime: t, addedAt: undefined } as QueueRow)}</span>
                    {info.status === "taken" && info.patientName && (
                      <span className="mt-0.5 block text-xs font-medium text-amber-900">— {info.patientName}</span>
                    )}
                    {info.status === "open" && (
                      <span className="mt-0.5 block text-xs font-normal">Open slot</span>
                    )}
                    {info.status === "available" && (
                      <span className="mt-0.5 block text-xs font-normal text-[#6C757D]">Available</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <h3 className="border-b border-[#e9ecef] px-4 py-3 text-base font-bold text-[#333333]">
        Patient Queue
        <span className="ml-2 text-sm font-normal text-[#6C757D]">(sorted by priority: urgent then normal, then by appointment/add time)</span>
      </h3>
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[72px]" />
            <col className="w-[120px]" />
            <col className="w-[110px]" />
            <col className="w-[140px]" />
            <col className="w-[80px]" />
            <col className="w-[72px]" />
            <col className="w-[88px]" />
            <col className="w-[64px]" />
            <col className="w-[220px]" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
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
            {sortedAndFiltered.map((r) => {
              const isSuggestedNext = r.ticket === suggestedNextTicket;
              const estWait = r.status === "waiting" ? (waitTimeByTicket[r.ticket] ?? "—") : (r.waitTime || "—");
              return (
                <tr
                  key={r.ticket}
                  className={`border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa] ${
                    isSuggestedNext ? "bg-sky-50 ring-inset ring-1 ring-sky-200" : ""
                  }`}
                >
                  <td className="align-middle px-3 py-2.5 font-medium text-[#333333]">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      {r.ticket}
                      {isSuggestedNext && (
                        <span className="rounded bg-sky-600 px-1.5 py-0.5 text-xs font-medium text-white">Next</span>
                      )}
                    </span>
                  </td>
                  <td className="align-middle px-3 py-2.5 text-[#333333] truncate" title={r.patientName}>{r.patientName}</td>
                  <td className="align-middle px-3 py-2.5 text-[#333333] truncate" title={r.department}>{r.department}</td>
                  <td className="align-middle px-3 py-2.5 whitespace-nowrap text-[#333333]">{formatDateAndTime(r)}</td>
                  <td className="align-middle px-3 py-2.5">
                    <Badge value={r.source === "booked" ? "Reserved" : "Walk-in"} styles={{ Reserved: SOURCE_STYLES.booked, "Walk-in": SOURCE_STYLES["walk-in"] }} />
                  </td>
                  <td className="align-middle px-3 py-2.5">
                    <Badge value={r.priority} styles={PRIORITY_STYLES} />
                  </td>
                  <td className="align-middle px-3 py-2.5">
                    <Badge value={r.status} styles={STATUS_STYLES} />
                  </td>
                  <td className="align-middle px-3 py-2.5 whitespace-nowrap text-[#333333]">{estWait}</td>
                  <td className="align-middle px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSummaryForTicket(r.ticket)}
                        className="inline-flex items-center gap-1 rounded border border-[#dee2e6] bg-white px-2 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                        title="View and download patient summary"
                      >
                        Summary
                      </button>
                      {(r.status === "waiting" || r.status === "called") && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifiedTicket(r.ticket);
                              setTimeout(() => setNotifiedTicket(null), 2000);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[#dee2e6] bg-white px-2 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                            title="Send 'You're up soon' notification to patient"
                          >
                            <BellIcon className="h-4 w-4" />
                            {notifiedTicket === r.ticket ? "Sent!" : "Notify"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientStatus(r.ticket, "in progress")}
                            className="inline-flex items-center gap-1 rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                            title="Call this patient in — mark as in progress"
                          >
                            <PlayIcon className="h-4 w-4" />
                            Call in
                          </button>
                        </>
                      )}
                      {(r.status === "scheduled" || r.status === "waiting") && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRescheduleFor({ ticket: r.ticket, patientName: r.patientName })}
                            className="inline-flex items-center gap-1 rounded border border-[#dee2e6] bg-white px-2 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                            title="Change this patient's slot time (reschedule)"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientSlot(r.ticket, "23:59")}
                            className="inline-flex items-center gap-1 rounded border border-[#dee2e6] bg-white px-2 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                            title="Move this patient to end of queue"
                          >
                            Move to end
                          </button>
                        </>
                      )}
                      {(r.status === "scheduled" || r.status === "waiting") && r.source === "booked" && (
                        <button
                          type="button"
                          onClick={() => setPatientStatus(r.ticket, "no show")}
                          className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          title="Mark no-show — frees this slot for next booked or walk-in"
                        >
                          No show
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PatientSummaryOverlay
        open={summaryForTicket !== null}
        onClose={() => setSummaryForTicket(null)}
        queueRow={summaryForTicket != null ? sortedAndFiltered.find((r) => r.ticket === summaryForTicket) ?? null : null}
      />
    </div>
  );
}
