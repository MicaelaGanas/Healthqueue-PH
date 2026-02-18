"use client";

import type { LabItemSync, LabStatus } from "../../../../lib/labSyncStorage";

type LabSpecimenTableProps = {
  items: LabItemSync[];
  onUpdateStatus: (sampleId: string, status: LabStatus) => void;
  /** Nurse: collect / send to processing. Lab/Doctor: mark ready / release. */
  mode: "nurse" | "lab";
};

function statusClass(status: LabStatus): string {
  if (status === "Released") return "bg-green-100 text-green-800";
  if (status === "Ready for Review") return "bg-blue-100 text-blue-800";
  if (status === "Processing") return "bg-amber-100 text-amber-800";
  if (status === "Collected") return "bg-cyan-100 text-cyan-800";
  return "bg-gray-100 text-gray-700";
}

export function LabSpecimenTable({ items, onUpdateStatus, mode }: LabSpecimenTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
        No specimens match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#dee2e6] bg-white shadow-sm">
      <table className="min-w-full divide-y divide-[#dee2e6]">
        <thead className="bg-[#f8f9fa]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Sample</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Patient</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Test</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Requested By</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#6C757D]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dee2e6] bg-white">
          {items.map((item) => (
            <tr key={item.sampleId} className="hover:bg-[#f8f9fa]">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#333333]">
                {item.sampleId}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333]">{item.patientName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333]">{item.testName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333]">{item.requestedBy}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-[#333333]">
                {item.priority}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                {mode === "nurse" && item.status === "Requested" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.sampleId, "Collected")}
                    className="rounded bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2a4a7a]"
                  >
                    Mark collected
                  </button>
                )}
                {mode === "nurse" && item.status === "Collected" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.sampleId, "Processing")}
                    className="rounded bg-[#007bff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0069d9]"
                  >
                    Send to processing
                  </button>
                )}
                {mode === "lab" && item.status === "Processing" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.sampleId, "Ready for Review")}
                    className="rounded bg-[#007bff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0069d9]"
                  >
                    Mark ready
                  </button>
                )}
                {mode === "lab" && item.status === "Ready for Review" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.sampleId, "Released")}
                    className="rounded bg-[#28a745] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#218838]"
                  >
                    Release result
                  </button>
                )}
                {((mode === "nurse" && item.status !== "Requested" && item.status !== "Collected") ||
                  (mode === "lab" && item.status !== "Processing" && item.status !== "Ready for Review")) && (
                  <span className="text-xs text-[#6C757D]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
