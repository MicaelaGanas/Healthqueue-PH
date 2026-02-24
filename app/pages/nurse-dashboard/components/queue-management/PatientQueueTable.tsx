"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useNurseQueue } from "../../context/NurseQueueContext";
import type { QueueRow } from "../../context/NurseQueueContext";
import type { QueueFiltersState } from "./QueueFilters";
import { formatDateDisplay } from "../../../../lib/schedule";
import { SLOT_TIMES_24, formatSlotDisplay } from "../../../../lib/slotTimes";

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

/** Status labels aligned with patient flow: Confirmed date → Arrived → Vitals & triage → Waiting for doctor → With doctor → Done */
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Waiting for doctor",
  waiting: "Waiting for doctor",
  called: "Waiting for doctor",
  "in progress": "With doctor",
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

type NoShowConfirm = { ticket: string; patientName: string; department: string; step: "confirm" | "reschedule" } | null;

type SlotStatus = "available" | "open" | "taken";

function getSlotStatusForDayDept(
  queueRows: QueueRow[],
  openSlots: { department: string; appointmentTime: string }[],
  department: string,
  dateStr: string,
  excludeTicket?: string
): Record<string, { status: SlotStatus; patientName?: string }> {
  const sameDeptDate = queueRows.filter(
    (r) =>
      r.department === department &&
      (r.appointmentDate ?? "").slice(0, 10) === dateStr.slice(0, 10) &&
      r.ticket !== excludeTicket
  );
  const openSet = new Set(
    openSlots.filter((s) => s.department === department).map((s) => s.appointmentTime)
  );
  const takenBy: Record<string, string> = {};
  for (const r of sameDeptDate) {
    if (!r.appointmentTime) continue;
    takenBy[r.appointmentTime] = r.patientName;
  }
  const result: Record<string, { status: SlotStatus; patientName?: string }> = {};
  for (const t of SLOT_TIMES_24) {
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

function getDefaultRescheduleDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function PatientQueueTable({ filters, managedDepartment, doctorOnDuty }: PatientQueueTableProps) {
  const { queueRows, openSlots, setPatientStatus, setPatientSlot } = useNurseQueue();
  const [ticketsWithVitals, setTicketsWithVitals] = useState<Set<string>>(new Set());
  const [noShowConfirm, setNoShowConfirm] = useState<NoShowConfirm>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

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
    // Do not show booked patients in Queue Management until vitals are recorded (Option A: they stay in Vitals & Triage first).
    scope = scope.filter((r) => r.source === "walk-in" || r.hasVitals === true || ticketsWithVitals.has(r.ticket));
    const sorted = [...scope].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      return ka.localeCompare(kb);
    });

    const byDept = !managedDepartment && filters.department !== "all"
      ? sorted.filter((r) => r.department === filters.department)
      : sorted;
    const byStatus =
      filters.status === "all"
        ? byDept.filter((r) => r.status !== "no show" && r.status !== "completed")
        : filters.status === "all_status"
          ? byDept
          : byDept.filter((r) => r.status === filters.status);
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

  const handleConfirmNoShow = () => {
    if (noShowConfirm) {
      setPatientStatus(noShowConfirm.ticket, "no show");
      setNoShowConfirm(null);
    }
  };

  const handleYesReschedule = () => {
    if (noShowConfirm) {
      setRescheduleDate(getDefaultRescheduleDate());
      setNoShowConfirm({ ...noShowConfirm, step: "reschedule" });
    }
  };

  const slotStatusForReschedule = useMemo(() => {
    if (!noShowConfirm || noShowConfirm.step !== "reschedule" || !rescheduleDate) return {};
    return getSlotStatusForDayDept(
      queueRows,
      openSlots,
      noShowConfirm.department,
      rescheduleDate,
      noShowConfirm.ticket
    );
  }, [noShowConfirm, rescheduleDate, queueRows, openSlots]);

  const handlePickRescheduleSlot = (time24: string) => {
    if (noShowConfirm && rescheduleDate) {
      setPatientSlot(noShowConfirm.ticket, time24, rescheduleDate);
      setNoShowConfirm(null);
    }
  };

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      {noShowConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="no-show-title">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h3 id="no-show-title" className="text-base font-semibold text-[#333333]">
              {noShowConfirm.step === "reschedule" ? "Reschedule appointment" : "Mark as no-show"}
            </h3>
            <p className="mt-2 text-sm text-[#6C757D]">
              <span className="font-medium text-[#333333]">{noShowConfirm.patientName}</span> ({noShowConfirm.ticket})
            </p>
            {noShowConfirm.step === "reschedule" ? (
              <>
                <p className="mt-2 text-sm text-[#6C757D]">Choose date, then pick an open or available slot:</p>
                <div className="mt-3">
                  <label htmlFor="reschedule-date" className="block text-xs font-medium text-[#6C757D]">Date</label>
                  <input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="mt-0.5 w-full max-w-[12rem] rounded border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
                  />
                </div>
                {rescheduleDate && (
                  <>
                    <p className="mt-3 mb-1 text-xs text-[#6C757D]">
                      Green = available. Teal = open (freed). Grey = taken.
                    </p>
                    <div className="grid max-h-[14rem] grid-cols-3 gap-2 overflow-auto sm:grid-cols-4">
                      {SLOT_TIMES_24.map((t) => {
                        const info = slotStatusForReschedule[t] ?? { status: "available" as SlotStatus };
                        const canSelect = info.status === "available" || info.status === "open";
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={!canSelect}
                            onClick={() => canSelect && handlePickRescheduleSlot(t)}
                            className={`rounded-lg border px-2.5 py-2 text-left text-sm font-medium ${
                              !canSelect
                                ? "cursor-not-allowed border-amber-200 bg-amber-50/50 text-amber-800"
                                : info.status === "open"
                                  ? "border-green-300 bg-green-50 text-green-800 hover:border-green-500 hover:bg-green-100"
                                  : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f0f7ff] hover:text-[#007bff]"
                            }`}
                          >
                            <span className="block whitespace-nowrap">{formatSlotDisplay(t)}</span>
                            {info.status === "taken" && info.patientName && (
                              <span className="mt-0.5 block text-xs text-amber-900">— {info.patientName}</span>
                            )}
                            {info.status === "open" && (
                              <span className="mt-0.5 block text-xs">Open</span>
                            )}
                            {info.status === "available" && (
                              <span className="mt-0.5 block text-xs text-[#6C757D]">Available</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNoShowConfirm({ ...noShowConfirm, step: "confirm" })}
                    className="rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
                  >
                    Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-[#6C757D]">Did the patient request to reschedule?</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleYesReschedule}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    Yes, reschedule
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmNoShow}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    No, no-show only
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoShowConfirm(null)}
                    className="rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <h3 className="border-b border-[#e9ecef] px-4 py-3 text-base font-bold text-[#333333]">
        Patient Queue
        <span className="ml-2 text-sm font-normal text-[#6C757D]">(sorted by priority, then date &amp; time — earliest first)</span>
      </h3>
      <div className="border-b border-[#e9ecef]">
        {currentWithDoctor && (
          <div className="flex flex-wrap items-center gap-3 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-medium text-emerald-800">With doctor:</span>
            <span className="text-sm font-semibold text-[#333333]">{currentWithDoctor.patientName}</span>
            <span className="text-sm text-[#6C757D]">({currentWithDoctor.ticket})</span>
            <span className="text-sm text-emerald-700 ml-auto">Mark this patient as Done before sending the next one to the doctor.</span>
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
              disabled={!!currentWithDoctor}
              onClick={() => !currentWithDoctor && setPatientStatus(suggestedNextTicket, "in progress")}
              title={currentWithDoctor ? "Doctor is currently with a patient — mark their consultation Done first" : "Send this patient to the doctor"}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-sky-600"
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
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]">Date</th>
              <th className="px-3 py-2.5 text-left font-medium text-[#333333]" title="Scheduled or added time — earliest at top">Time</th>
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
                        <span className="ml-1.5 inline rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-medium text-white">With doctor</span>
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
                    <span className="whitespace-nowrap" title={formatDateAndTime(r)}>
                      {r.appointmentDate ? formatDateDisplay(r.appointmentDate, { useTodayLabel: true }) : (r.addedAt ? new Date(r.addedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—")}
                    </span>
                  </td>
                  <td className="align-middle px-3 py-2.5 text-[#333333] whitespace-nowrap font-medium tabular-nums" title={r.appointmentTime ? "Scheduled time" : "Added time"}>
                    {formatSlotTime(r)}
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
                    {r.status !== "no show" &&
                      r.status !== "completed" &&
                      (getDisplayStatus(r) === "scheduled" || getDisplayStatus(r) === "waiting" || getDisplayStatus(r) === "needs_vitals") &&
                      r.source === "booked" && (
                        <button
                          type="button"
                          onClick={() => setNoShowConfirm({ ticket: r.ticket, patientName: r.patientName, department: r.department, step: "confirm" })}
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
