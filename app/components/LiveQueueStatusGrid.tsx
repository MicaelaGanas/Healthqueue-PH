"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export type LiveQueueDept = {
  name: string;
  waiting: number;
  waitTime: string;
  status: "Normal" | "Busy";
  nowServing: string | null;
};

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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatReadableDate(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

type LiveQueueStatusGridProps = {
  /** "page" = full heading for check queue page; "landing" = compact for landing */
  variant?: "page" | "landing";
  /** Section id for anchor (e.g. live-queue) */
  sectionId?: string;
};

export function LiveQueueStatusGrid({ variant = "page", sectionId = "live-queue" }: LiveQueueStatusGridProps) {
  const today = getTodayIso();
  const [departments, setDepartments] = useState<LiveQueueDept[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/landing/live-queue?date=${encodeURIComponent(today)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load queue status");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.departments)) setDepartments(data.departments);
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load queue status");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [today]);

  const isLanding = variant === "landing";

  return (
    <section id={sectionId} className={isLanding ? "" : "mt-10"} aria-labelledby="live-queue-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="live-queue-heading"
            className={isLanding ? "text-2xl font-bold text-[#333333] sm:text-3xl" : "text-lg font-bold text-[#333333]"}
            style={{ fontFamily: "var(--font-rosario), sans-serif" }}
          >
            Live Queue Status
          </h2>
          <p className="mt-1 text-sm text-[#6C757D]">
            Estimated wait times by department as of {formatReadableDate(today)}
          </p>
        </div>
      </div>

      {loading && (
        <div className="mt-6 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#007bff] border-t-transparent" aria-hidden />
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-[#e9ecef] bg-white p-6 text-center text-[#6C757D]">
          <p>{error}</p>
          <p className="mt-1 text-sm">Queue data will appear when the database is connected.</p>
        </div>
      )}

      {!loading && !error && departments.length > 0 && (
        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <article
              key={dept.name}
              className="rounded-xl border border-[#e9ecef] bg-white p-4 shadow-sm"
            >
              <h3 className="font-semibold text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>{dept.name}</h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-[#6C757D]">
                <UsersIcon className="h-4 w-4 shrink-0" />
                <span>Waiting</span>
                <span className="font-semibold text-[#333333]">{dept.waiting}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#6C757D]">
                <ClockIcon className="h-4 w-4 shrink-0" />
                <span>Est. Wait</span>
                <span className="text-[#333333]">{dept.waitTime}</span>
              </div>
              <p className="mt-3 text-sm">
                <span className="text-[#6C757D]">Now Serving</span>{" "}
                {dept.nowServing ? (
                  <Link
                    href={`/pages/queue/result?q=${encodeURIComponent(dept.nowServing)}`}
                    className="font-medium text-[#007bff] underline hover:text-[#0056b3]"
                  >
                    {dept.nowServing}
                  </Link>
                ) : (
                  <span className="font-medium text-[#333333]">—</span>
                )}
              </p>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && departments.length === 0 && (
        <div className="mt-6 rounded-xl border border-[#e9ecef] bg-white p-6 text-center text-[#6C757D]">
          <p>No department queue data for this date.</p>
          <p className="mt-1 text-sm">Departments are configured in Admin; queue data appears when staff add patients.</p>
        </div>
      )}
    </section>
  );
}
