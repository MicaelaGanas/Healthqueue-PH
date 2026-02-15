"use client";

import { useState } from "react";

const REASONS = ["Select reason", "Cardiac arrest", "Severe respiratory distress", "Unresponsive", "Major trauma", "Other"];

export function EmergencyEscalationPanel() {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-lg font-bold text-[#333333]">Emergency Escalation</h2>
      </div>
      <p className="mb-4 text-sm font-semibold text-red-700">
        Use this panel ONLY for life-threatening emergencies. This will immediately notify on-duty doctors and administrators, and auto-upgrade the patient to highest priority.
      </p>
      <p className="mb-4 text-sm text-[#333333]">
        Patient: <span className="font-semibold">Maria Santos (TRG-001)</span>
      </p>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#333333]">Reason for Escalation *</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-[#333333] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {REASONS.map((r) => (
            <option key={r} value={r === "Select reason" ? "" : r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#333333]">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the situation briefly..."
          rows={3}
          className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-[#333333] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-medium text-white hover:bg-red-700"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Flag as Emergency
      </button>
      <p className="mt-4 text-xs text-[#6C757D]">
        Notifications will be sent to: Dr. Santos (ER), Dr. Reyes (IM), Admin Office
      </p>
    </div>
  );
}
