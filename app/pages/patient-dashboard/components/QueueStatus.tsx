"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import Link from "next/link";
import { QueueStatusQRCode } from "../../../components/QueueStatusQRCode";
import type { AppointmentForQueue } from "../page";

type QueueStatusData = {
  queueNumber: string;
  department: string;
  status: string;
  waitTime: string;
  appointmentDate: string | null;
  appointmentTime: string | null;
};

type QueueStatusProps = {
  selectedAppointment?: AppointmentForQueue | null;
  onClearSelection?: () => void;
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
    confirmed: "Confirmed — check in when you arrive",
    awaiting_triage: "Triage & vitals — please proceed to triage",
    waiting: "Waiting",
    scheduled: "Scheduled",
    called: "Called",
    "in progress": "In progress",
    completed: "Completed",
    almost: "Almost your turn",
    proceed: "Proceed",
  };
  return labels[status] ?? status;
}

// Flowchart-aligned steps: from appointment confirmation through to done
const QUEUE_FLOW_STEPS = [
  { id: "confirmed", title: "Appointment confirmed", description: "Office confirmed via email/SMS" },
  { id: "checkin", title: "Check-in", description: "You showed up; office is waiting" },
  { id: "triage", title: "Triage & vitals", description: "Vital signs and initial check" },
  { id: "in-queue", title: "In queue", description: "Added to queue; waiting to be called" },
  { id: "called", title: "Called", description: "Nurse called you — proceed to doctor" },
  { id: "with-doctor", title: "With doctor", description: "Consultation in progress" },
  { id: "done", title: "Done", description: "Visit complete" },
] as const;

type StepStatus = "completed" | "current" | "pending";

function getCurrentStepIndex(status: string): number {
  const s = String(status).toLowerCase().trim();
  if (s === "completed" || s === "done") return QUEUE_FLOW_STEPS.length - 1; // Done
  if (s === "in progress" || s === "in_consultation" || s === "proceed") return 5; // With doctor
  if (s === "called" || s === "almost") return 4; // Called
  if (s === "waiting" || s === "scheduled") return 3; // In queue (vitals already done)
  if (s === "awaiting_triage") return 2; // In queue but vitals not recorded yet — triage current
  if (s === "confirmed") return 0; // Appointment confirmed; not in queue yet — check in at desk
  return 1; // Default: check-in
}

function QueueFlowProgress({ currentStepIndex }: { currentStepIndex: number }) {
  const getStatus = (index: number): StepStatus => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "pending";
  };

  const progressPercent =
    QUEUE_FLOW_STEPS.length > 0
      ? (Math.min(currentStepIndex + 1, QUEUE_FLOW_STEPS.length) / QUEUE_FLOW_STEPS.length) * 100
      : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm" aria-label="Queue progress">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#333333]">Your queue progress</h3>
        <span className="text-sm font-medium text-[#333333]">
          Step {Math.min(currentStepIndex + 1, QUEUE_FLOW_STEPS.length)} of {QUEUE_FLOW_STEPS.length}
        </span>
      </div>
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#007bff] transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ul className="divide-y divide-gray-200">
        {QUEUE_FLOW_STEPS.map((step, index) => {
          const status = getStatus(index);
          return (
            <li key={step.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  status === "completed"
                    ? "bg-emerald-500 text-white"
                    : status === "current"
                      ? "bg-[#007bff] text-white"
                      : "bg-gray-300 text-gray-500"
                }`}
              >
                {status === "completed" ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-bold ${
                      status === "completed"
                        ? "text-[#333333]"
                        : status === "current"
                          ? "text-[#007bff]"
                          : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  {status === "current" && (
                    <span className="rounded-full bg-[#007bff] px-2 py-0.5 text-xs font-medium text-white">
                      Current
                    </span>
                  )}
                </div>
                <p
                  className={`mt-0.5 text-sm ${
                    status === "completed" ? "text-[#333333]" : status === "current" ? "text-[#007bff]" : "text-gray-500"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const POLL_INTERVAL_MS = 5_000; // Refetch every 5s so progress stays in sync with Supabase

export function QueueStatus({ selectedAppointment = null, onClearSelection }: QueueStatusProps) {
  const [data, setData] = useState<QueueStatusData | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initial fetch + refetch helper (used by polling and realtime)
  const refetchQueueStatus = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      if (selectedAppointment) {
        try {
          const res = await fetch(
            `/api/queue/status/${encodeURIComponent(selectedAppointment.referenceNo)}`,
            { cache: "no-store" }
          );
          const json = await res.json().catch(() => null);
          if (!res.ok || !json) {
            setData(null);
            if (!silent) setError("");
            return;
          }
          setData({
            queueNumber: json.queueNumber ?? selectedAppointment.referenceNo,
            department: json.assignedDepartment ?? selectedAppointment.department,
            status: json.status ?? "waiting",
            waitTime: json.estimatedWaitTime ?? "",
            appointmentDate: selectedAppointment.requestedDate,
            appointmentTime: selectedAppointment.requestedTime,
          });
          setError("");
        } catch {
          if (!silent) {
            setError("Failed to load queue status for this appointment.");
            setData(null);
          }
        } finally {
          if (!silent) setLoading(false);
        }
        return;
      }

      const supabase = createSupabaseBrowser();
      if (!supabase) {
        if (!silent) {
          setError("Unable to load session.");
          setLoading(false);
        }
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!silent) {
          setError("Please sign in to view your queue status.");
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/queue/status/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          setData(null);
          if (!silent) setError("");
          return;
        }
        const json = await res.json();
        setData(json ?? null);
        setError("");
      } catch {
        if (!silent) {
          setError("Failed to load queue status.");
          setData(null);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedAppointment]
  );

  // Initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    refetchQueueStatus(false);
  }, [refetchQueueStatus]);

  // Reactive: poll frequently, refetch when tab visible, and subscribe to Supabase Realtime
  useEffect(() => {
    if (!data?.queueNumber) return;

    const ticket = data.queueNumber;
    const supabase = createSupabaseBrowser();

    const refetch = () => refetchQueueStatus(true);

    // First refetch soon so updates appear quickly
    const earlyRefetchId = setTimeout(refetch, 2_000);

    const pollId = setInterval(refetch, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);

    let channel: { unsubscribe: () => void } | null = null;
    if (supabase) {
      channel = supabase
        .channel(`queue_item:${ticket}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "queue_items",
            filter: `ticket=eq.${ticket}`,
          },
          () => refetch()
        )
        .subscribe();
    }

    return () => {
      clearTimeout(earlyRefetchId);
      clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisible);
      channel?.unsubscribe();
    };
  }, [data?.queueNumber, refetchQueueStatus]);

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
          {selectedAppointment && onClearSelection ? (
            <>
              <h3 className="text-lg font-semibold text-[#333333]">
                No queue entry for Ref: {selectedAppointment.referenceNo}
              </h3>
              <p className="mt-2 text-gray-600">
                This appointment may not be in the queue yet. You can check back later or view your default queue status.
              </p>
              <button
                type="button"
                onClick={onClearSelection}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
              >
                Show my default queue
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-8 space-y-6">
      {selectedAppointment && onClearSelection && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Queue status for <span className="font-semibold text-[#333333]">Ref: {selectedAppointment.referenceNo}</span>
          </p>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-sm font-medium text-[#007bff] hover:text-[#0069d9]"
          >
            Show my default queue
          </button>
        </div>
      )}
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
          <div className="text-right flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-[#333333]">
                {statusLabel(data.status)}
              </span>
              <button
                type="button"
                onClick={() => refetchQueueStatus(true)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                title="Refresh status"
              >
                Refresh
              </button>
            </div>
            {data.waitTime && (
              <p className="text-lg font-semibold text-[#007bff]">Estimate: {data.waitTime}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2 border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-[#333333]">Queue status QR code</p>
          <p className="text-xs text-gray-500">Save as PNG to show at the clinic if you have no internet</p>
          <QueueStatusQRCode referenceNo={data.queueNumber} size={160} showDownload />
        </div>
      </div>
      {String(data.status).toLowerCase() === "confirmed" ? (
        <p className="text-sm font-medium text-[#007bff]">
          Your appointment is confirmed. Please check in at the desk when you arrive. Your queue status will update once you’re checked in.
        </p>
      ) : String(data.status).toLowerCase() === "awaiting_triage" ? (
        <p className="text-sm font-medium text-[#007bff]">
          You’re checked in. Please proceed to triage for your vital signs. Your queue position will update once vitals are recorded.
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          Please wait until your number is called. Check the appointments tab for your booking details.
        </p>
      )}

      {/* Flowchart-aligned navigation: current steps and progress */}
      <QueueFlowProgress currentStepIndex={getCurrentStepIndex(data.status)} />
    </div>
  );
}
