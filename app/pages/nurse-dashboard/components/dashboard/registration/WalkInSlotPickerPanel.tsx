"use client";

import { useMemo } from "react";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { QueueRow } from "../../../context/NurseQueueContext";
import { SLOT_TIMES_24 } from "../../../../../lib/slotTimes";
import { formatSlotDisplay } from "../../../../../lib/slotTimes";
import { formatDateDisplay } from "../../../../../lib/schedule";

type SlotStatus = "available" | "open" | "taken";

function getSlotStatusForDay(
  queueRows: QueueRow[],
  openSlots: { department: string; appointmentTime: string }[],
  department: string,
  doctor: string,
  dateStr: string
): Record<string, { status: SlotStatus; patientName?: string }> {
  const sameQueue = queueRows.filter(
    (r) => r.department === department && r.assignedDoctor === doctor && (r.appointmentDate ?? "").slice(0, 10) === dateStr.slice(0, 10)
  );
  const openSet = new Set(
    openSlots
      .filter((s) => s.department === department)
      .map((s) => s.appointmentTime)
  );
  const takenBy: Record<string, string> = {};
  for (const r of sameQueue) {
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

type WalkInSlotPickerPanelProps = {
  patientName: string;
  department: string;
  doctor: string;
  dateStr: string;
  onSelect: (time24: string) => void;
  onClose: () => void;
};

export function WalkInSlotPickerPanel({
  patientName,
  department,
  doctor,
  dateStr,
  onSelect,
  onClose,
}: WalkInSlotPickerPanelProps) {
  const { queueRows, openSlots } = useNurseQueue();

  const slotStatus = useMemo(
    () => getSlotStatusForDay(queueRows, openSlots, department, doctor, dateStr),
    [queueRows, openSlots, department, doctor, dateStr]
  );

  const dateLabel = useMemo(() => formatDateDisplay(dateStr, { useTodayLabel: true }), [dateStr]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-[#e9ecef] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#333333]">Pick time slot</h3>
            <p className="mt-0.5 text-sm text-[#6C757D]">{patientName}</p>
            <p className="mt-0.5 text-xs text-[#6C757D]">{department} · {doctor}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-1 text-sm font-medium text-[#333333]">For: {dateLabel}</p>
        <p className="mb-3 text-xs text-[#6C757D]">
          Green = available. Teal = open (freed). Grey = taken (another patient). Pick an available or open slot.
        </p>
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-auto sm:grid-cols-4">
          {SLOT_TIMES_24.map((t) => {
            const info = slotStatus[t] ?? { status: "available" as SlotStatus };
            const canSelect = info.status === "available" || info.status === "open";
            return (
              <button
                key={t}
                type="button"
                disabled={!canSelect}
                onClick={() => {
                  if (!canSelect) return;
                  onSelect(t);
                  onClose();
                }}
                className={`rounded-lg border py-2.5 text-left text-sm font-medium ${
                  !canSelect
                    ? "cursor-not-allowed border-amber-200 bg-amber-50/50 text-amber-800"
                    : info.status === "open"
                      ? "border-green-300 bg-green-50 text-green-800 hover:border-green-500 hover:bg-green-100"
                      : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f0f7ff] hover:text-[#007bff]"
                }`}
              >
                <span className="block">{formatSlotDisplay(t)}</span>
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
  );
}
