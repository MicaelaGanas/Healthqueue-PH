"use client";

import { DEPARTMENTS } from "../../../../lib/departments";

export type QueueFiltersState = {
  search: string;
  department: string;
  status: string;
};

type QueueFiltersProps = {
  filters: QueueFiltersState;
  onFiltersChange: (f: QueueFiltersState) => void;
  /** When set, department is fixed to this (managing one specialty); hide department dropdown. */
  managedDepartment?: string;
  /** When set, show who is on duty for this queue. */
  doctorOnDuty?: string;
};

export { DEPARTMENTS };

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "scheduled", label: "Scheduled" },
  { value: "waiting", label: "Waiting" },
  { value: "called", label: "Called" },
  { value: "in progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "no show", label: "No Show" },
];

export function QueueFilters({ filters, onFiltersChange, managedDepartment, doctorOnDuty }: QueueFiltersProps) {
  const { search, status } = filters;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search by name or ticket number..."
          className="w-full rounded-lg border border-[#dee2e6] py-2.5 pl-10 pr-3 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {!managedDepartment && (
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#6C757D]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            <select
              value={filters.department}
              onChange={(e) => onFiltersChange({ ...filters, department: e.target.value })}
              className="rounded-lg border border-[#dee2e6] bg-white py-2.5 pl-9 pr-8 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
        {managedDepartment && (
          <span className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2.5 text-sm text-[#333333]">
            Specialty: <strong>{managedDepartment}</strong>
            {doctorOnDuty && (
              <span className="ml-1 border-l border-[#dee2e6] pl-2">Doctor on duty: <strong>{doctorOnDuty}</strong></span>
            )}
          </span>
        )}
        <select
          value={status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="rounded-lg border border-[#dee2e6] bg-white py-2.5 pl-3 pr-8 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
