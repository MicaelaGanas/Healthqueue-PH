"use client";

import { useMemo, useState } from "react";
import { useDepartments } from "../../../../lib/useDepartments";

export function QueueDisplayContent() {
  const { departments, loading, error } = useDepartments();
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const departmentOptions = useMemo(() => departments.map((d) => d.name), [departments]);

  const openDisplay = (fullscreen: boolean) => {
    if (!selectedDepartment) return;
    const url = `/pages/queue-display?department=${encodeURIComponent(selectedDepartment)}${fullscreen ? "&fullscreen=1&autovoice=1" : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Queue Display Control</h2>
        <p className="mt-1 text-sm text-[#6C757D]">
          Open a patient-facing queue display table for a specific department.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#dee2e6] bg-white p-5 shadow-sm lg:col-span-2">
          <label htmlFor="display-department" className="mb-2 block text-sm font-semibold text-[#333333]">
            Department
          </label>
          <select
            id="display-department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            disabled={loading}
          >
            <option value="">Select department...</option>
            {departmentOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-4 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] px-4 py-3">
            <p className="text-sm font-medium text-[#333333]">Quick guide</p>
            <p className="mt-1 text-sm text-[#6C757D]">
              Select a department first, then choose either normal display mode or fullscreen display mode below.
            </p>
          </div>

        </div>

        <div className="rounded-xl border border-[#dee2e6] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#333333]">Mode Differences</h3>
          <ul className="mt-2 space-y-2 text-sm text-[#6C757D]">
            <li><span className="font-medium text-[#333333]">Display Table:</span> opens normal view; staff can still choose fullscreen/voice inside the page.</li>
            <li><span className="font-medium text-[#333333]">Fullscreen Display:</span> opens in fullscreen mode and auto-enables voice announcements.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-[#dee2e6] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#333333]">Display Table</h3>
          <p className="mt-1 text-sm text-[#6C757D]">
            Best for testing or side monitor use. Opens patient queue view without forcing fullscreen.
          </p>
          <button
            type="button"
            onClick={() => openDisplay(false)}
            disabled={!selectedDepartment}
            className="mt-4 rounded-lg bg-[#007bff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0056b3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Open display table
          </button>
        </article>

        <article className="rounded-xl border border-[#dee2e6] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#333333]">Fullscreen Display</h3>
          <p className="mt-1 text-sm text-[#6C757D]">
            Best for lobby TV. Launches directly to fullscreen and starts voice callouts for queue changes.
          </p>
          <button
            type="button"
            onClick={() => openDisplay(true)}
            disabled={!selectedDepartment}
            className="mt-4 rounded-lg border border-[#007bff] bg-white px-4 py-2.5 text-sm font-medium text-[#007bff] hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Open full screen display
          </button>
        </article>
      </div>
    </section>
  );
}
