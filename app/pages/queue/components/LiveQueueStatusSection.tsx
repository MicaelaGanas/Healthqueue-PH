"use client";

import { useMemo, useState } from "react";

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

type DepartmentConfig = {
  name: string;
  code: string;
  baseWaiting: number;
  avgMinutesPerPatient: number;
};

const departments: DepartmentConfig[] = [
  { name: "General Consultation", code: "GC", baseWaiting: 24, avgMinutesPerPatient: 7 },
  { name: "Emergency Room", code: "ER", baseWaiting: 8, avgMinutesPerPatient: 5 },
  { name: "Laboratory", code: "LB", baseWaiting: 15, avgMinutesPerPatient: 6 },
  { name: "Pharmacy", code: "PH", baseWaiting: 32, avgMinutesPerPatient: 3 },
  { name: "X-Ray / Imaging", code: "XR", baseWaiting: 6, avgMinutesPerPatient: 10 },
  { name: "Pediatrics", code: "PD", baseWaiting: 12, avgMinutesPerPatient: 9 },
  { name: "OB-GYN", code: "OB", baseWaiting: 9, avgMinutesPerPatient: 11 },
  { name: "Dental", code: "DN", baseWaiting: 5, avgMinutesPerPatient: 8 },
];

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDateSeed(dateIso: string) {
  return dateIso.split("-").reduce((acc, part) => acc + Number(part), 0);
}

function formatReadableDate(dateIso: string) {
  const parsed = new Date(`${dateIso}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function minuteLabel(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${mins} min`;
  }
  return `${minutes} min`;
}

export function LiveQueueStatusSection() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoDate);

  const estimates = useMemo(() => {
    const selected = new Date(`${selectedDate}T00:00:00`);
    const dayOfWeek = selected.getDay(); // 0 Sun, 6 Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateSeed = getDateSeed(selectedDate);

    return departments.map((dept, index) => {
      const variance = ((dateSeed + index * 11) % 7) - 3;
      const weekendShift = isWeekend ? -4 : 2;
      const waiting = Math.max(1, dept.baseWaiting + variance + weekendShift);
      const waitMinutes = Math.max(5, waiting * dept.avgMinutesPerPatient);
      const nowServingNumber = Math.max(1, 100 + ((dateSeed + index * 17) % 140));

      return {
        name: dept.name,
        waiting,
        estWait: minuteLabel(waitMinutes),
        nowServing: `${dept.code}-${String(nowServingNumber).padStart(3, "0")}`,
      };
    });
  }, [selectedDate]);

  return (
    <section className="mt-10" aria-labelledby="live-queue-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="live-queue-heading" className="text-lg font-bold text-[#333333]">
            Live Queue Status
          </h2>
          <p className="mt-1 text-sm text-[#6C757D]">
            Estimated wait times by department for {formatReadableDate(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="wait-date" className="text-sm font-medium text-[#333333]">
            Date
          </label>
          <input
            id="wait-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-[#6C757D] hover:bg-[#e9ecef]"
          aria-label="Search or filter departments"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {estimates.map((dept) => (
          <article
            key={dept.name}
            className="rounded-xl border border-[#e9ecef] bg-white p-4 shadow-sm"
          >
            <h3 className="font-semibold text-[#333333]">{dept.name}</h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-[#6C757D]">
              <UsersIcon className="h-4 w-4 shrink-0" />
              <span>Waiting</span>
              <span className="font-semibold text-[#333333]">{dept.waiting}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#6C757D]">
              <ClockIcon className="h-4 w-4 shrink-0" />
              <span>Est. Wait</span>
              <span className="text-[#333333]">{dept.estWait}</span>
            </div>
            <p className="mt-3 text-sm">
              <span className="text-[#6C757D]">Now Serving</span>{" "}
              <span className="font-medium text-[#007bff] underline">{dept.nowServing}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
