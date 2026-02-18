"use client";

export type LabFiltersState = {
  search: string;
  status: string;
  priority: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "Requested", label: "Requested" },
  { value: "Collected", label: "Collected" },
  { value: "Processing", label: "Processing" },
  { value: "Ready for Review", label: "Ready for Review" },
  { value: "Released", label: "Released" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priority" },
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
];

type LabFiltersProps = {
  filters: LabFiltersState;
  onFiltersChange: (f: LabFiltersState) => void;
};

export function LabFilters({ filters, onFiltersChange }: LabFiltersProps) {
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
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search by sample ID, patient, or test..."
          className="w-full rounded-lg border border-[#dee2e6] py-2.5 pl-10 pr-3 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
          className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
