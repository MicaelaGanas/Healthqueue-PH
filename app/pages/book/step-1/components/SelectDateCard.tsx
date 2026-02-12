"use client";

import { useState } from "react";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");

type Props = {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
};

export function SelectDateCard({ value, onChange }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [internalDate, setInternalDate] = useState<Date | null>(null);
  const selectedDate = onChange && value !== undefined ? value : internalDate;
  const setSelectedDate = (d: Date | null) => {
    if (onChange) onChange(d);
    else setInternalDate(d);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = MONTHS[month];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const dates: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) dates.push(null);
  for (let d = 1; d <= daysInMonth; d++) dates.push(d);

  // Must book at least 1 day in advance; no past dates or today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    return cellDate < tomorrow;
  };

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const handleSelect = (day: number | null) => {
    if (!day || isDisabled(day)) return;
    setSelectedDate(new Date(year, month, day));
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">Select Date</h2>
      </div>
      <div className="mt-4 rounded-lg border border-[#dee2e6] p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded p-2 text-[#6C757D] hover:bg-[#f8f9fa]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-[#333333]">{monthName} {year}</span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded p-2 text-[#6C757D] hover:bg-[#f8f9fa]"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-sm">
          {DAYS.map((d) => (
            <div key={d} className="py-1 font-medium text-[#6C757D]">
              {d}
            </div>
          ))}
          {dates.map((day, i) => {
            const disabled = !day || isDisabled(day);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={disabled}
                className={`rounded py-2 text-[#333333] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                  disabled ? "" : "hover:bg-[#f8f9fa]"
                } ${isSelected(day) ? "bg-[#7fdbff] text-[#333333] hover:bg-[#6dd5f7]" : ""}`}
              >
                {day ?? ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
