"use client";

import { useState } from "react";

const ROWS = [
  { time: "09:00 AM", patient: "Maria Santos", doctor: "Dr. Jose Rizal", type: "consultation", status: "confirmed", canConfirm: false },
  { time: "09:30 AM", patient: "Juan Dela Cruz", doctor: "Dr. Maria Clara", type: "follow up", status: "scheduled", canConfirm: true },
  { time: "10:00 AM", patient: "Ana Reyes", doctor: "Dr. Andres Bonifacio", type: "procedure", status: "confirmed", canConfirm: false },
  { time: "10:30 AM", patient: "Pedro Garcia", doctor: "Dr. Emilio Aguinaldo", type: "consultation", status: "completed", canConfirm: false },
  { time: "11:00 AM", patient: "Rosa Martinez", doctor: "Dr. Jose Rizal", type: "follow up", status: "cancelled", canConfirm: false },
];

const TYPE_STYLES: Record<string, string> = {
  consultation: "bg-blue-100 text-blue-800",
  "follow up": "bg-sky-100 text-sky-800",
  procedure: "bg-amber-100 text-amber-800",
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  scheduled: "bg-sky-100 text-sky-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
};

export function TodayAppointmentsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      <h3 className="border-b border-[#e9ecef] px-4 py-3 text-base font-bold text-[#333333]">
        Today&apos;s Appointments
      </h3>
      <div className="flex flex-wrap gap-2 border-b border-[#e9ecef] p-4 sm:gap-3">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-[#dee2e6] py-2 pl-10 pr-3 text-sm text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="max-h-[320px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Time</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Doctor</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Type</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Status</th>
              <th className="px-4 py-3 text-right font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
                <td className="px-4 py-3 font-medium text-[#333333]">{r.time}</td>
                <td className="px-4 py-3 text-[#333333]">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-[#6C757D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {r.patient}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#333333]">{r.doctor}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TYPE_STYLES[r.type] ?? "bg-gray-100 text-gray-700"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="text-[#007bff] hover:underline">
                      View
                    </button>
                    {r.canConfirm && (
                      <button
                        type="button"
                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
