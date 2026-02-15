"use client";

import { useState, useEffect } from "react";
import { getQueueRowsFromStorage } from "../../../../lib/queueSyncStorage";
import { getBookedQueueFromStorage } from "../../../../lib/queueBookedStorage";

const today = () => new Date().toISOString().slice(0, 10);

export function ReportsContent() {
  const [queueRows, setQueueRows] = useState<ReturnType<typeof getQueueRowsFromStorage>>([]);
  const [booked, setBooked] = useState<ReturnType<typeof getBookedQueueFromStorage>>([]);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [exported, setExported] = useState(false);

  useEffect(() => {
    setQueueRows(getQueueRowsFromStorage());
    setBooked(getBookedQueueFromStorage());
  }, []);

  const inRange = (iso?: string) => {
    if (!iso) return false;
    const d = iso.slice(0, 10);
    return d >= dateFrom && d <= dateTo;
  };

  const completedInRange = queueRows.filter((r) => r.status === "Completed" && inRange(r.addedAt));
  const waiting = queueRows.filter((r) => r.status !== "Completed" && r.status !== "In Consultation");
  const inConsultation = queueRows.filter((r) => r.status === "In Consultation");
  const bookedInRange = booked.filter((b) => inRange(b.addedAt) || (b.appointmentDate && inRange(b.appointmentDate)));

  const handleExport = () => {
    const lines = [
      "HealthQueue PH - Report",
      `Date range: ${dateFrom} to ${dateTo}`,
      "",
      "Queue summary",
      `  Total in queue (all time): ${queueRows.length}`,
      `  Waiting: ${waiting.length}`,
      `  In consultation: ${inConsultation.length}`,
      `  Completed in range: ${completedInRange.length}`,
      "",
      "Bookings in range",
      `  Count: ${bookedInRange.length}`,
      "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `healthqueue-report-${dateFrom}-${dateTo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-[#333333]">Date range</h3>
        <div className="mt-3 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-[#6C757D]">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 rounded border border-[#dee2e6] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6C757D]">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 rounded border border-[#dee2e6] px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-[#6C757D]">Queue total</p>
          <p className="mt-1 text-2xl font-bold text-[#333333]">{queueRows.length}</p>
        </div>
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-[#6C757D]">Waiting</p>
          <p className="mt-1 text-2xl font-bold text-[#333333]">{waiting.length}</p>
        </div>
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-[#6C757D]">Completed (in range)</p>
          <p className="mt-1 text-2xl font-bold text-[#333333]">{completedInRange.length}</p>
        </div>
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-[#6C757D]">Bookings (in range)</p>
          <p className="mt-1 text-2xl font-bold text-[#333333]">{bookedInRange.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a]"
        >
          Export report (.txt)
        </button>
        {exported && <span className="text-sm text-green-600">Report downloaded.</span>}
      </div>
    </div>
  );
}
