"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { QueueSummaryCards } from "./QueueSummaryCards";
import { QueueFilters, type QueueFiltersState } from "./QueueFilters";
import { DEPARTMENTS } from "./QueueFilters";
import { DOCTORS_BY_DEPARTMENT } from "../../../../lib/departments";
import { PatientQueueTable } from "./PatientQueueTable";
import { PatientGuidanceCard, type GuidancePatient } from "./PatientGuidanceCard";
import { AlertsNotifications } from "../dashboard/alerts/AlertsNotifications";
import { useNurseQueue } from "../../context/NurseQueueContext";

const DEFAULT_FILTERS: QueueFiltersState = {
  search: "",
  department: "all",
  status: "all",
};

type QueueManagementContentProps = {
  onAddWalkIn?: () => void;
};

const POLL_INTERVAL_MS = 20000;

export function QueueManagementContent({ onAddWalkIn }: QueueManagementContentProps) {
  const { queueRows, refetchQueue } = useNurseQueue();
  const [staffDepartment, setStaffDepartment] = useState<string | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const [managedDepartment, setManagedDepartment] = useState<string>("");
  const [doctorOnDuty, setDoctorOnDuty] = useState<string>("");
  const [filters, setFilters] = useState<QueueFiltersState>(DEFAULT_FILTERS);
  const [guidancePatient, setGuidancePatient] = useState<GuidancePatient | null>(null);
  const [completionNotification, setCompletionNotification] = useState<{ patientName: string; ticket: string } | null>(null);
  const previousQueueRef = useRef<typeof queueRows>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setStaffLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled || !session?.access_token) {
          setStaffLoading(false);
          return;
        }
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled || !res.ok) {
          setStaffLoading(false);
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (body.department && typeof body.department === "string") {
          setStaffDepartment(body.department.trim());
          setManagedDepartment(body.department.trim());
          setDoctorOnDuty("");
        }
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const doctorsForSpecialty = useMemo(
    () => (managedDepartment ? (DOCTORS_BY_DEPARTMENT[managedDepartment] ?? []) : []),
    [managedDepartment]
  );

  const handleSpecialtyChange = (value: string) => {
    setManagedDepartment(value);
    setDoctorOnDuty("");
  };

  const showSelectors = !staffDepartment;
  const canShowQueue = managedDepartment && (showSelectors ? doctorOnDuty : true);

  // Poll queue so we detect when doctor marks a patient complete
  useEffect(() => {
    if (!canShowQueue) return;
    const id = setInterval(() => refetchQueue(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [canShowQueue, refetchQueue]);

  // When queue updates, detect new completions (in progress → completed) and notify nurse
  useEffect(() => {
    const prev = previousQueueRef.current;
    for (const row of queueRows) {
      if ((row.status || "").toLowerCase() !== "completed") continue;
      const was = prev.find((r) => r.ticket === row.ticket);
      if (was && (was.status || "").toLowerCase() === "in progress") {
        setCompletionNotification({ patientName: row.patientName, ticket: row.ticket });
        break;
      }
    }
    previousQueueRef.current = queueRows;
  }, [queueRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Queue Management</h2>
          <p className="mt-0.5 text-sm text-[#6C757D]">
            Booked patients are already in the queue after confirmation. Use Registration to add walk-ins. Queue is sorted by priority (urgent then normal), then appointment/add time.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddWalkIn}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#28a745] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#218838]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add walk-in
        </button>
      </div>

      {staffLoading ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-6 text-center text-[#6C757D]">
          Loading your assignment…
        </div>
      ) : staffDepartment ? (
        <div className="rounded-lg border-2 border-[#007bff]/30 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#333333]">
            Your department: <span className="text-[#007bff]">{staffDepartment}</span>
          </p>
          <p className="mt-1 text-xs text-[#6C757D]">
            You only see the queue for your assigned department. Contact an administrator to change your department.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-[#007bff]/30 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div>
              <label htmlFor="managed-dept" className="mb-2 block text-sm font-semibold text-[#333333]">
                Which specialty are you managing?
              </label>
              <select
                id="managed-dept"
                value={managedDepartment}
                onChange={(e) => handleSpecialtyChange(e.target.value)}
                className="w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
              >
                <option value="">Select specialty...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="doctor-on-duty" className="mb-2 block text-sm font-semibold text-[#333333]">
                Doctor on duty
              </label>
              <select
                id="doctor-on-duty"
                value={doctorOnDuty}
                onChange={(e) => setDoctorOnDuty(e.target.value)}
                disabled={!managedDepartment}
                className="w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff] disabled:bg-[#f8f9fa] disabled:text-[#6C757D]"
              >
                <option value="">
                  {managedDepartment
                    ? doctorsForSpecialty.length
                      ? "Select doctor on duty..."
                      : "No doctors listed for this specialty"
                    : "Select specialty first"}
                </option>
                {doctorsForSpecialty.map((doc) => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6C757D]">
            The queue and wait times below are for this specialty. Set the doctor on duty so patients and staff know who is seeing this queue.
          </p>
          {managedDepartment && doctorOnDuty && (
            <p className="mt-1.5 text-sm font-medium text-[#333333]">
              Managing: <span className="text-[#007bff]">{managedDepartment}</span> — <span className="text-[#007bff]">{doctorOnDuty}</span>
            </p>
          )}
        </div>
      )}

      {!canShowQueue ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          {!managedDepartment
            ? "Select a specialty above to view and manage its queue."
            : "Select a doctor on duty above to view and manage this queue. The queue will show only that doctor's patients."}
        </div>
      ) : (
        <>
          {completionNotification && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
            >
              <p className="text-sm font-medium">
                Consultation complete for <span className="font-semibold">{completionNotification.patientName}</span> ({completionNotification.ticket}). Call in the next patient.
              </p>
              <button
                type="button"
                onClick={() => setCompletionNotification(null)}
                className="rounded border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <QueueSummaryCards managedDepartment={managedDepartment} doctorOnDuty={doctorOnDuty} />

          <QueueFilters
            filters={filters}
            onFiltersChange={setFilters}
            managedDepartment={managedDepartment}
            doctorOnDuty={doctorOnDuty}
          />

          <PatientQueueTable
            filters={filters}
            managedDepartment={managedDepartment}
            doctorOnDuty={doctorOnDuty}
            onSelectForGuidance={(r) => setGuidancePatient({ patientName: r.patientName, ticket: r.ticket })}
            selectedForGuidanceTicket={guidancePatient?.ticket ?? null}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <PatientGuidanceCard selectedPatient={guidancePatient} />
            <AlertsNotifications />
          </div>
        </>
      )}
    </div>
  );
}
