"use client";

import { useState, useEffect } from "react";

/** Doctors with the department(s) they belong to (for filtering). */
const DOCTORS_BY_DEPARTMENT: Record<string, string[]> = {
  "General Consultation": ["Dr. Maria Santos - General Medicine", "Dr. Carlos Gomez - Internal Medicine"],
  "Emergency Room": ["Dr. Maria Santos - General Medicine", "Dr. Carlos Gomez - Internal Medicine"],
  "Laboratory": [],
  "Pharmacy": [],
  "X-Ray / Imaging": [],
  "Pediatrics": ["Dr. Juan Dela Cruz - Pediatrics"],
  "OB-GYN": ["Dr. Ana Reyes - OB-GYN"],
  "Dental": ["Dr. Elena Torres - Dental"],
};

const NO_PREFERENCE = "No preference";

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

type Props = {
  department: string;
  value?: string;
  onChange?: (doctor: string) => void;
};

export function PreferDoctorCard({ department, value = "", onChange }: Props) {
  const [internal, setInternal] = useState("");
  const [open, setOpen] = useState(false);
  const selected = onChange && value !== undefined ? value : internal;
  const setSelected = (d: string) => {
    if (onChange) onChange(d);
    else setInternal(d);
  };

  const options = department
    ? [NO_PREFERENCE, ...(DOCTORS_BY_DEPARTMENT[department] ?? [])]
    : [NO_PREFERENCE];

  // When department changes, clear selection if current doctor is not in the new list
  useEffect(() => {
    if (selected && selected !== NO_PREFERENCE && department) {
      const allowed = DOCTORS_BY_DEPARTMENT[department] ?? [];
      if (!allowed.includes(selected)) setSelected("");
    }
  }, [department, selected]);

  const displayValue = selected || (department ? "Choose a doctor (optional)" : "Select a department first");

  return (
    <div>
      <div className="flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">Prefer Doctor</h2>
      </div>
      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => department && setOpen(!open)}
          disabled={!department}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-[#333333] ${
            department
              ? "border-[#dee2e6] bg-white hover:border-[#adb5bd]"
              : "cursor-not-allowed border-[#dee2e6] bg-[#f8f9fa] text-[#6C757D]"
          }`}
        >
          <span className={selected ? "" : "text-[#6C757D]"}>{displayValue}</span>
          <svg
            className={`h-5 w-5 text-[#6C757D] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && department && (
          <>
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#e9ecef] bg-white py-1 shadow-lg">
              {options.length === 1 ? (
                <div className="px-4 py-2 text-sm text-[#6C757D]">No doctors listed for this department.</div>
              ) : (
                options.map((doctor) => (
                  <button
                    key={doctor}
                    type="button"
                    onClick={() => {
                      setSelected(doctor);
                      setOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#333333] hover:bg-[#f8f9fa]"
                  >
                    {doctor}
                  </button>
                ))
              )}
            </div>
            <div className="fixed inset-0 z-0" aria-hidden onClick={() => setOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}
