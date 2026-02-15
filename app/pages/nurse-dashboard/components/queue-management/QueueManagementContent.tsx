"use client";

import { useState, useMemo } from "react";
import { QueueSummaryCards } from "./QueueSummaryCards";
import { QueueFilters, type QueueFiltersState } from "./QueueFilters";
import { DEPARTMENTS } from "./QueueFilters";
import { DOCTORS_BY_DEPARTMENT } from "../../../../lib/departments";
import { PatientQueueTable } from "./PatientQueueTable";
import { OpenSlotsPanel } from "./OpenSlotsPanel";
import { PatientGuidanceCard } from "./PatientGuidanceCard";
import { AlertsNotifications } from "../dashboard/alerts/AlertsNotifications";

const DEFAULT_FILTERS: QueueFiltersState = {
  search: "",
  department: "all",
  status: "all",
};

type QueueManagementContentProps = {
  onAddWalkIn?: () => void;
};

export function QueueManagementContent({ onAddWalkIn }: QueueManagementContentProps) {
  const [managedDepartment, setManagedDepartment] = useState<string>("");
  const [doctorOnDuty, setDoctorOnDuty] = useState<string>("");
  const [filters, setFilters] = useState<QueueFiltersState>(DEFAULT_FILTERS);

  const doctorsForSpecialty = useMemo(
    () => (managedDepartment ? (DOCTORS_BY_DEPARTMENT[managedDepartment] ?? []) : []),
    [managedDepartment]
  );

  const handleSpecialtyChange = (value: string) => {
    setManagedDepartment(value);
    setDoctorOnDuty("");
  };

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

      {!managedDepartment ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          Select a specialty above to view and manage its queue.
        </div>
      ) : !doctorOnDuty ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          Select a doctor on duty above to view and manage this queue. The queue will show only that doctor&apos;s patients.
        </div>
      ) : (
        <>
          <QueueSummaryCards managedDepartment={managedDepartment} doctorOnDuty={doctorOnDuty} />

          <QueueFilters
            filters={filters}
            onFiltersChange={setFilters}
            managedDepartment={managedDepartment}
            doctorOnDuty={doctorOnDuty}
          />

          <OpenSlotsPanel managedDepartment={managedDepartment} doctorOnDuty={doctorOnDuty} />

          <PatientQueueTable filters={filters} managedDepartment={managedDepartment} doctorOnDuty={doctorOnDuty} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PatientGuidanceCard />
            <AlertsNotifications />
          </div>
        </>
      )}
    </div>
  );
}
