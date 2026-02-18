"use client";

import React, { useState, useEffect } from "react";

const NO_PREFERENCE = "No preference";

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

type DoctorOption = {
  id: string;
  name: string;
  department: string | null;
  displayLabel: string;
};

type Props = {
  department: string;
  value?: string;
  onChange?: (doctor: string) => void;
};

export function PreferDoctorCard({ department, value = "", onChange }: Props) {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!department || department === "—") {
      setDoctors([]);
      return;
    }
    setLoading(true);
    fetch(`/api/doctors?department=${encodeURIComponent(department)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? data : []))
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [department]);

  const selected = value && value !== NO_PREFERENCE ? value : "";
  const setSelected = (d: string) => {
    onChange?.(d === NO_PREFERENCE ? "" : d);
    setOpen(false);
  };

  // When department or doctors list changes, clear preferred doctor if selection is not in the new list
  useEffect(() => {
    if (!selected) return;
    if (doctors.length === 0) {
      onChange?.("");
      return;
    }
    const labels = doctors.map((d) => d.displayLabel);
    if (!labels.includes(selected)) onChange?.("");
  }, [department, doctors, selected]);

  const options = [NO_PREFERENCE, ...doctors.map((d) => d.displayLabel)];
  const displayText = selected
    ? selected
    : loading
      ? "Loading…"
      : !department || department === "—"
        ? "Select a department first"
        : doctors.length === 0
          ? "No preference (no doctors in this department yet)"
          : "Choose a doctor (optional)";

  return (
    <div>
      <div className="flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">Preferred doctor (optional)</h2>
      </div>
      <p className="mt-1 text-sm text-[#6C757D]">
        Doctors shown are from the system for the selected department.
      </p>
      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => department && department !== "—" && !loading && setOpen(!open)}
          disabled={!department || department === "—" || loading}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-[#333333] ${
            department && department !== "—" && !loading
              ? "border-[#dee2e6] bg-white hover:border-[#adb5bd]"
              : "cursor-not-allowed border-[#dee2e6] bg-[#f8f9fa] text-[#6C757D]"
          }`}
        >
          <span className={selected ? "" : "text-[#6C757D]"}>{displayText}</span>
          <svg
            className={`h-5 w-5 shrink-0 text-[#6C757D] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && department && department !== "—" && (
          <>
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#e9ecef] bg-white py-1 shadow-lg">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelected(opt)}
                  className="w-full px-4 py-2 text-left text-sm text-[#333333] hover:bg-[#f8f9fa]"
                >
                  {opt}
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
