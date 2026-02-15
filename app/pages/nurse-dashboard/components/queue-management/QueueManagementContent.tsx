"use client";

import { QueueSummaryCards } from "./QueueSummaryCards";
import { QueueFilters } from "./QueueFilters";
import { PatientQueueTable } from "./PatientQueueTable";
import { PatientGuidanceCard } from "./PatientGuidanceCard";
import { AlertsNotifications } from "../dashboard/alerts/AlertsNotifications";

export function QueueManagementContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Queue Management</h2>
          <p className="mt-0.5 text-sm text-[#6C757D]">
            Manage patient queues across all departments
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007bff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0069d9]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add to Queue
        </button>
      </div>

      <QueueSummaryCards />

      <QueueFilters />

      <PatientQueueTable />

      <div className="grid gap-6 lg:grid-cols-2">
        <PatientGuidanceCard />
        <AlertsNotifications />
      </div>
    </div>
  );
}
