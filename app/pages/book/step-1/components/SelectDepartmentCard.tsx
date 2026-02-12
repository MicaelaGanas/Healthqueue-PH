"use client";

import { useState } from "react";

const DEPARTMENTS = [
  "General Consultation",
  "Emergency Room",
  "Laboratory",
  "Pharmacy",
  "X-Ray / Imaging",
  "Pediatrics",
  "OB-GYN",
  "Dental",
];

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

type Props = {
  value?: string;
  onChange?: (value: string) => void;
};

export function SelectDepartmentCard({ value = "", onChange }: Props) {
  const [internalValue, setInternalValue] = useState("");
  const [open, setOpen] = useState(false);
  const selected = onChange ? value : internalValue;
  const setSelected = onChange || setInternalValue;

  return (
    <div>
      <div className="flex items-center gap-2">
        <BuildingIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">Select Department</h2>
      </div>
      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-lg border border-[#dee2e6] bg-white px-4 py-3 text-left text-[#333333] hover:border-[#adb5bd]"
        >
          <span className={selected ? "" : "text-[#6C757D]"}>{selected || "Choose a department."}</span>
          <svg
            className={`h-5 w-5 text-[#6C757D] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <>
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#e9ecef] bg-white py-1 shadow-lg">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    setSelected(dept);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-[#333333] hover:bg-[#f8f9fa]"
                >
                  {dept}
                </button>
              ))}
            </div>
            <div className="fixed inset-0 z-0" aria-hidden onClick={() => setOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}
