"use client";

import { useMemo, useState } from "react";
import { useNurseQueue } from "../../context/NurseQueueContext";
import type { QueueRow } from "../../context/NurseQueueContext";
import type { OpenSlot } from "../../context/NurseQueueContext";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  normal: 1,
};

function sortKey(r: QueueRow): string {
  const p = PRIORITY_ORDER[r.priority] ?? 2;
  const time =
    r.source === "booked" && r.appointmentTime
      ? "A" + r.appointmentTime
      : "B" + (r.addedAt ?? "9999");
  return `${p}-${time}`;
}

function formatSlotTime(t: string): string {
  if (!t || t.length < 4) return t;
  const [h, m] = t.split(":").map(Number);
  if (h === 12) return `12:${String(m).padStart(2, "0")} PM`;
  if (h === 0) return `12:${String(m).padStart(2, "0")} AM`;
  if (h > 12) return `${h - 12}:${String(m).padStart(2, "0")} PM`;
  return `${h}:${String(m).padStart(2, "0")} AM`;
}

function getNextOfferee(
  queueRows: QueueRow[],
  slot: OpenSlot,
  doctorOnDuty?: string
): QueueRow | null {
  const offered = new Set(slot.offeredToTickets || []);
  const candidates = queueRows.filter(
    (r) =>
      r.source === "booked" &&
      r.department === slot.department &&
      (r.status === "scheduled" || r.status === "waiting") &&
      !offered.has(r.ticket) &&
      (!doctorOnDuty || r.assignedDoctor === doctorOnDuty)
  );
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  return sorted[0];
}

function getWalkInsForSlot(queueRows: QueueRow[], department: string): { sameDept: QueueRow[]; other: QueueRow[] } {
  const walkIns = queueRows.filter(
    (r) => r.source === "walk-in" && r.status !== "completed" && r.status !== "no show"
  );
  const sameDept = walkIns.filter((r) => r.department === department);
  const other = walkIns.filter((r) => r.department !== department);
  return { sameDept, other };
}

type OpenSlotsPanelProps = {
  /** When set, only show open slots for this specialty. */
  managedDepartment?: string;
  /** When set, only offer slots to this doctor's patients. */
  doctorOnDuty?: string;
};

export function OpenSlotsPanel({ managedDepartment, doctorOnDuty }: OpenSlotsPanelProps = {}) {
  const { queueRows, openSlots, acceptSlotForPatient, declineSlot, assignSlotToWalkIn } = useNurseQueue();
  const [assigningSlotId, setAssigningSlotId] = useState<string | null>(null);

  const slotWithOfferee = useMemo(() => {
    const slots = managedDepartment
      ? openSlots.filter((s) => s.department === managedDepartment)
      : openSlots;
    return slots.map((slot) => ({
      slot,
      nextOfferee: getNextOfferee(queueRows, slot, doctorOnDuty),
      walkIns: getWalkInsForSlot(queueRows, slot.department),
    }));
  }, [openSlots, queueRows, managedDepartment, doctorOnDuty]);

  if (slotWithOfferee.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-[#333333]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">!</span>
        Open slots (from no-shows)
      </h3>
      <p className="mb-4 text-sm text-[#6C757D]">
        Offer each slot to the next reserved patient in that department. If they accept, they move to this time and their old slot opens for the next person. If they decline, offer to the next. When no booked patient takes it, assign to a walk-in.
      </p>
      <div className="space-y-4">
        {slotWithOfferee.map(({ slot, nextOfferee, walkIns }) => (
          <div
            key={slot.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-white p-3"
          >
            <span className="font-medium text-[#333333]">
              {slot.department} — {formatSlotTime(slot.appointmentTime)}
            </span>
            {nextOfferee ? (
              <>
                <span className="text-sm text-[#6C757D]">Offer to:</span>
                <span className="font-medium text-[#333333]">{nextOfferee.patientName} ({nextOfferee.ticket})</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptSlotForPatient(slot.id, nextOfferee.ticket)}
                    className="rounded bg-[#28a745] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#218838]"
                  >
                    Accept (move here)
                  </button>
                  <button
                    type="button"
                    onClick={() => declineSlot(slot.id, nextOfferee.ticket)}
                    className="rounded border border-[#dee2e6] bg-white px-3 py-1.5 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                  >
                    Decline (offer to next)
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-[#6C757D]">No more booked patients to offer. Assign to walk-in:</span>
                {assigningSlotId === slot.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {walkIns.sameDept.length === 0 && walkIns.other.length === 0 ? (
                      <span className="text-xs text-[#6C757D]">No walk-ins in queue.</span>
                    ) : (
                      <>
                        {walkIns.sameDept.map((w) => (
                          <button
                            key={w.ticket}
                            type="button"
                            onClick={() => {
                              assignSlotToWalkIn(slot.id, w.ticket);
                              setAssigningSlotId(null);
                            }}
                            className="rounded bg-[#007bff] px-2 py-1 text-xs text-white hover:bg-[#0069d9]"
                          >
                            {w.patientName} ({w.ticket}) — same dept
                          </button>
                        ))}
                        {walkIns.other.map((w) => (
                          <button
                            key={w.ticket}
                            type="button"
                            onClick={() => {
                              assignSlotToWalkIn(slot.id, w.ticket);
                              setAssigningSlotId(null);
                            }}
                            className="rounded border border-[#6c757d] bg-white px-2 py-1 text-xs text-[#6C757D] hover:bg-[#f8f9fa]"
                          >
                            {w.patientName} ({w.ticket}) — {w.department}
                          </button>
                        ))}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setAssigningSlotId(null)}
                      className="text-xs text-[#6C757D] hover:text-[#333333]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAssigningSlotId(slot.id)}
                    className="rounded border border-[#007bff] bg-white px-3 py-1.5 text-xs font-medium text-[#007bff] hover:bg-[#e7f1ff]"
                  >
                    Assign to walk-in
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
