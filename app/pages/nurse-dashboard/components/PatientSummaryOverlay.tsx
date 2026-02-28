"use client";

import { useRef, useCallback } from "react";
import type { QueueRow, PendingWalkIn } from "../context/NurseQueueContext";
import { formatDateDisplay } from "../../../lib/schedule";
import { formatSlotDisplay } from "../../../lib/slotTimes";

type PatientSummaryOverlayProps = {
  open: boolean;
  onClose: () => void;
  /** Queue patient (in queue management). */
  queueRow?: QueueRow | null;
  /** Pending walk-in (registered, not yet in queue). */
  pendingWalkIn?: PendingWalkIn | null;
};

function buildSummaryText(queueRow?: QueueRow | null, pendingWalkIn?: PendingWalkIn | null): string {
  const lines: string[] = ["PATIENT SUMMARY", "—".repeat(40), ""];
  if (queueRow) {
    lines.push("Ticket:", queueRow.ticket);
    lines.push("Patient:", queueRow.patientName);
    lines.push("Department:", queueRow.department);
    if (queueRow.assignedDoctor) lines.push("Assigned doctor:", queueRow.assignedDoctor);
    if (queueRow.appointmentDate) {
      const timeStr = queueRow.appointmentTime ? formatSlotDisplay(queueRow.appointmentTime) : "—";
      lines.push("Date:", formatDateDisplay(queueRow.appointmentDate, { useTodayLabel: true }));
      lines.push("Time:", timeStr);
    }
    lines.push("Type:", queueRow.source === "booked" ? "Reserved" : "Walk-in");
    lines.push("Priority:", queueRow.priority);
    lines.push("Status:", queueRow.status);
    if (queueRow.waitTime) lines.push("Wait time:", queueRow.waitTime);
  } else if (pendingWalkIn) {
    const name = `${pendingWalkIn.firstName} ${pendingWalkIn.lastName}`.trim() || "—";
    lines.push("Patient:", name);
    lines.push("Age:", pendingWalkIn.age || "—");
    lines.push("Sex:", pendingWalkIn.sex || "—");
    lines.push("Phone:", pendingWalkIn.phone || "—");
    lines.push("Email:", pendingWalkIn.email || "—");
    lines.push("Registered at:", pendingWalkIn.registeredAt || "—");
  }
  lines.push("", "—".repeat(40));
  return lines.join("\n");
}

function getSummaryTitle(queueRow?: QueueRow | null, pendingWalkIn?: PendingWalkIn | null): string {
  if (queueRow) return `${queueRow.ticket} — ${queueRow.patientName}`;
  if (pendingWalkIn) {
    const name = `${pendingWalkIn.firstName} ${pendingWalkIn.lastName}`.trim() || "Patient";
    return `Pending — ${name}`;
  }
  return "Patient summary";
}

export function PatientSummaryOverlay({
  open,
  onClose,
  queueRow,
  pendingWalkIn,
}: PatientSummaryOverlayProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const text = buildSummaryText(queueRow, pendingWalkIn);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = queueRow ? queueRow.ticket : pendingWalkIn?.id ?? "patient-summary";
    a.download = `patient-summary-${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [queueRow, pendingWalkIn]);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>${getSummaryTitle(queueRow, pendingWalkIn)}</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 24px; max-width: 480px;">
          <pre style="white-space: pre-wrap; font-size: 14px;">${buildSummaryText(queueRow, pendingWalkIn).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  }, [queueRow, pendingWalkIn]);

  if (!open) return null;

  const title = getSummaryTitle(queueRow, pendingWalkIn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        ref={printRef}
        className="relative z-10 w-full max-w-md rounded-xl border border-[#e9ecef] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#e9ecef] px-5 py-4">
          <h3 className="text-lg font-bold text-[#333333]">Patient summary</h3>
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
        <div className="max-h-[60vh] overflow-auto px-5 py-4">
          <p className="mb-4 text-sm font-medium text-[#6C757D]">{title}</p>
          <dl className="space-y-3 text-sm">
            {queueRow && (
              <>
                <div>
                  <dt className="text-[#6C757D]">Ticket</dt>
                  <dd className="font-medium text-[#333333]">{queueRow.ticket}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Patient</dt>
                  <dd className="font-medium text-[#333333]">{queueRow.patientName}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Department</dt>
                  <dd className="text-[#333333]">{queueRow.department}</dd>
                </div>
                {queueRow.assignedDoctor && (
                  <div>
                    <dt className="text-[#6C757D]">Assigned doctor</dt>
                    <dd className="text-[#333333]">{queueRow.assignedDoctor}</dd>
                  </div>
                )}
                {(queueRow.appointmentDate || queueRow.appointmentTime) && (
                  <>
                    {queueRow.appointmentDate && (
                      <div>
                        <dt className="text-[#6C757D]">Date</dt>
                        <dd className="text-[#333333]">{formatDateDisplay(queueRow.appointmentDate, { useTodayLabel: true })}</dd>
                      </div>
                    )}
                    {queueRow.appointmentTime && (
                      <div>
                        <dt className="text-[#6C757D]">Time</dt>
                        <dd className="text-[#333333]">{formatSlotDisplay(queueRow.appointmentTime)}</dd>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <dt className="text-[#6C757D]">Type</dt>
                  <dd className="text-[#333333]">{queueRow.source === "booked" ? "Reserved" : "Walk-in"}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Priority</dt>
                  <dd className="text-[#333333]">{queueRow.priority}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Status</dt>
                  <dd className="text-[#333333]">{queueRow.status}</dd>
                </div>
                {queueRow.waitTime && (
                  <div>
                    <dt className="text-[#6C757D]">Wait time</dt>
                    <dd className="text-[#333333]">{queueRow.waitTime}</dd>
                  </div>
                )}
              </>
            )}
            {pendingWalkIn && (
              <>
                <div>
                  <dt className="text-[#6C757D]">Patient</dt>
                  <dd className="font-medium text-[#333333]">
                    {`${pendingWalkIn.firstName} ${pendingWalkIn.lastName}`.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Age / Sex</dt>
                  <dd className="text-[#333333]">{pendingWalkIn.age || "—"} / {pendingWalkIn.sex || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Phone</dt>
                  <dd className="text-[#333333]">{pendingWalkIn.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Email</dt>
                  <dd className="text-[#333333]">{pendingWalkIn.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6C757D]">Registered at</dt>
                  <dd className="text-[#333333]">{pendingWalkIn.registeredAt || "—"}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[#e9ecef] px-5 py-4">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download (.txt)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5M9 14a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2m-6 8h10a2 2 0 002 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2z" />
            </svg>
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-[#dee2e6] px-4 py-2 text-sm font-medium text-[#6C757D] hover:bg-[#f8f9fa]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
