"use client";

import { useState, useEffect } from "react";
import { getQueueRowsFromStorage } from "../../../../lib/queueSyncStorage";
import { getBookedQueueFromStorage } from "../../../../lib/queueBookedStorage";

type RecordType = "consultation" | "booking";

type RecordRow = {
  type: RecordType;
  date: string;
  patientName: string;
  department: string;
  extra: string;
  id: string;
};

export function RecordsContent() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [filter, setFilter] = useState<"all" | "consultation" | "booking">("all");

  useEffect(() => {
    const queue = getQueueRowsFromStorage();
    const booked = getBookedQueueFromStorage();

    const consultationRows: RecordRow[] = queue
      .filter((r) => r.status === "Completed")
      .map((r) => ({
        type: "consultation" as const,
        date: r.addedAt ?? "",
        patientName: r.patientName,
        department: r.department,
        extra: r.assignedDoctor ?? r.ticket,
        id: `q-${r.ticket}`,
      }));

    const bookingRows: RecordRow[] = booked.map((b) => ({
      type: "booking" as const,
      date: b.appointmentDate ?? b.addedAt?.slice(0, 10) ?? "",
      patientName: b.patientName,
      department: b.department,
      extra: b.preferredDoctor ?? b.referenceNo,
      id: `b-${b.referenceNo}`,
    }));

    const combined = [...consultationRows, ...bookingRows].sort(
      (a, b) => (b.date || "").localeCompare(a.date || "")
    );
    setRecords(combined);
  }, []);

  const filtered =
    filter === "all" ? records : records.filter((r) => r.type === (filter === "consultation" ? "consultation" : "booking"));

  return (
    <div className="rounded-lg border border-[#dee2e6] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dee2e6] px-4 py-3 sm:px-6">
        <h3 className="text-base font-semibold text-[#333333]">Records</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 text-sm ${filter === "all" ? "bg-[#1e3a5f] text-white" : "bg-[#e9ecef] text-[#333333] hover:bg-[#dee2e6]"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("consultation")}
            className={`rounded px-3 py-1.5 text-sm ${filter === "consultation" ? "bg-[#1e3a5f] text-white" : "bg-[#e9ecef] text-[#333333] hover:bg-[#dee2e6]"}`}
          >
            Consultations
          </button>
          <button
            type="button"
            onClick={() => setFilter("booking")}
            className={`rounded px-3 py-1.5 text-sm ${filter === "booking" ? "bg-[#1e3a5f] text-white" : "bg-[#e9ecef] text-[#333333] hover:bg-[#dee2e6]"}`}
          >
            Bookings
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#dee2e6]">
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Department</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Doctor / Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dee2e6] bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6C757D] sm:px-6">
                  No records found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#f8f9fa]">
                  <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-[#333333] sm:px-6">{r.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.date || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.patientName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.department}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.extra || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
