"use client";

import { useState } from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];
  const startDay = first.getDay();
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export function AppointmentsCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // 0-indexed: February = 1
  const [selected, setSelected] = useState(15);

  const days = getDaysInMonth(year, month);
  const monthName = MONTHS[month];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-[#333333]">Calendar</h3>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-[#333333]">{monthName} {year}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
            aria-label="Previous month"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
            aria-label="Next month"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {DAYS.map((d) => (
          <div key={d} className="py-1 font-medium text-[#6C757D]">
            {d}
          </div>
        ))}
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => d !== null && setSelected(d)}
            className={`rounded py-2 text-sm font-medium ${
              d === null
                ? "invisible"
                : selected === d
                  ? "bg-teal-500 text-white hover:bg-teal-600"
                  : "text-[#333333] hover:bg-[#e9ecef]"
            }`}
          >
            {d ?? ""}
          </button>
        ))}
      </div>
    </div>
  );
}
