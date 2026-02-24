"use client";

import { useState } from "react";

export type GuidancePatient = {
  patientName: string;
  ticket: string;
};

function PaperPlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

type PatientGuidanceCardProps = {
  selectedPatient?: GuidancePatient | null;
};

export function PatientGuidanceCard({ selectedPatient = null }: PatientGuidanceCardProps) {
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [vibration, setVibration] = useState(true);
  const [voice, setVoice] = useState(false);
  const [display, setDisplay] = useState(true);

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <PaperPlaneIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">Patient Guidance & Status Update</h2>
      </div>
      {!selectedPatient ? (
        <p className="text-sm text-[#6C757D]">
          Select a patient from the queue above to send guidance.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#333333]">
            <span><span className="text-[#6C757D]">Patient:</span> <span className="font-medium">{selectedPatient.patientName}</span></span>
            <span><span className="text-[#6C757D]">Ticket:</span> <span className="font-medium">{selectedPatient.ticket}</span></span>
          </div>
          <div className="mb-4">
        <label className="block text-sm font-medium text-[#333333]">Next Location / Step</label>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        >
          <option value="">Select destination</option>
          <option value="lab">Lab</option>
          <option value="xray">X-Ray</option>
          <option value="consult">Consultation Room</option>
          <option value="pharmacy">Pharmacy</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#333333]">Custom Message (Optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Please bring your lab results."
          rows={2}
          className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
        />
      </div>
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-[#333333]">Notification Methods</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[#333333]">
            <input type="checkbox" checked={vibration} onChange={() => setVibration(!vibration)} className="rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]" />
            <span>Vibration / Alert</span>
            <svg className="h-4 w-4 text-[#6C757D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#333333]">
            <input type="checkbox" checked={voice} onChange={() => setVoice(!voice)} className="rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]" />
            <span>Voice Instruction</span>
            <svg className="h-4 w-4 text-[#6C757D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#333333]">
            <input type="checkbox" checked={display} onChange={() => setDisplay(!display)} className="rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]" />
            <span>Display Board Update</span>
            <svg className="h-4 w-4 text-[#6C757D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </label>
        </div>
      </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#007bff] py-3 font-medium text-white hover:bg-[#0069d9]"
          >
            <PaperPlaneIcon className="h-5 w-5" />
            Send Guidance to Patient
          </button>
        </>
      )}
    </div>
  );
}
