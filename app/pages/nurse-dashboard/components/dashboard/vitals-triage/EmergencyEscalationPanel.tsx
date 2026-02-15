"use client";

import { useState, useRef, useEffect } from "react";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { QueueRow } from "../../../context/NurseQueueContext";

const REASONS = ["Select reason", "Cardiac arrest", "Severe respiratory distress", "Unresponsive", "Major trauma", "Other"];

function matchPatient(q: string, r: QueueRow) {
  const lower = q.toLowerCase().trim();
  if (!lower) return true;
  return (
    r.patientName.toLowerCase().includes(lower) ||
    r.ticket.toLowerCase().includes(lower) ||
    r.department.toLowerCase().includes(lower)
  );
}

export function UrgentEscalationPanel() {
  const { queueRows, setPatientPriority } = useNurseQueue();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const selectedPatient = queueRows.find((r) => r.ticket === selectedTicket);
  const filteredRows = queueRows.filter((r) => matchPatient(searchQuery, r));
  const showSearchResults = searchFocused;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPatient = (r: QueueRow) => {
    setSelectedTicket(r.ticket);
    setSearchQuery("");
    setSearchFocused(false);
  };

  const handleFlagUrgent = () => {
    if (!selectedTicket) return;
    setPatientPriority(selectedTicket, "urgent");
    setReason("");
    setNotes("");
    setSelectedTicket("");
    setSearchQuery("");
  };

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-lg font-bold text-[#333333]">Urgent Escalation</h2>
      </div>
      <p className="mb-4 text-sm font-semibold text-red-700">
        Use this panel ONLY for life-threatening emergencies. This will immediately notify on-duty doctors and administrators, and auto-upgrade the patient to highest priority.
      </p>

      <div className="mb-4" ref={searchRef}>
        <label className="block text-sm font-medium text-[#333333]">Select patient to escalate</label>
        <div className="relative mt-1">
          <input
            type="text"
            value={selectedPatient ? `${selectedPatient.patientName} (${selectedPatient.ticket})` : searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTicket("");
            }}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search by name, ticket, or department..."
            className="w-full rounded-lg border border-red-200 bg-white py-2 pl-10 pr-3 text-[#333333] placeholder:text-[#6C757D] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6C757D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {showSearchResults && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-red-200 bg-white py-1 shadow-lg">
              {filteredRows.length === 0 ? (
                <li className="px-4 py-3 text-sm text-[#6C757D]">No patients match.</li>
              ) : (
                filteredRows.map((r) => (
                  <li
                    key={r.ticket}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPatient(r)}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectPatient(r)}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-red-100 focus:bg-red-100 focus:outline-none"
                  >
                    <span className="font-medium text-[#333333]">{r.patientName}</span>
                    <span className="text-[#6C757D]"> — {r.ticket} · {r.department}</span>
                    {r.priority === "urgent" && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">Urgent</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <p className="mb-4 text-sm text-[#333333]">
        {selectedPatient ? (
          <>Patient: <span className="font-semibold">{selectedPatient.patientName} ({selectedPatient.ticket})</span></>
        ) : (
          <>Select a patient above to mark as urgent.</>
        )}
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
        disabled={!selectedPatient}
        onClick={handleFlagUrgent}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Flag as Urgent
      </button>
      <p className="mt-4 text-xs text-[#6C757D]">
        Notifications will be sent to: Dr. Santos (ER), Dr. Reyes (IM), Admin Office
      </p>
    </div>
  );
}
