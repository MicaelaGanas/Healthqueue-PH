"use client";

import { useState } from "react";

/** 15 time slots in 3-column grid (per design) */
const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM",
];

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

type Props = {
  value?: string;
  onChange?: (time: string) => void;
};

export function SelectTimeCard({ value = "", onChange }: Props) {
  const [internal, setInternal] = useState("");
  const selected = onChange && value !== undefined ? value : internal;
  const setSelected = (t: string) => {
    if (onChange) onChange(t);
    else setInternal(t);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">Select Time</h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => setSelected(time)}
            className={`rounded-lg border py-3 text-sm font-medium transition-colors ${
              selected === time
                ? "border-[#007bff] bg-[#007bff] text-white"
                : "border-[#dee2e6] bg-[#f8f9fa] text-[#333333] hover:border-[#adb5bd]"
            }`}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}
