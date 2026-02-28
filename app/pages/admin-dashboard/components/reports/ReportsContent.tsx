"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getQueueRowsFromStorage } from "../../../../lib/queueSyncStorage";
import { getBookedQueueFromStorage } from "../../../../lib/queueBookedStorage";
import type { QueueRowSync } from "../../../../lib/queueSyncStorage";
import type { BookedQueueEntry } from "../../../../lib/queueBookedStorage";
import { AdminSectionHeader } from "../layout/AdminSectionHeader";

const today = () => new Date().toISOString().slice(0, 10);

type Period = "daily" | "weekly" | "monthly";

function getDateRange(period: Period): { from: string; to: string } {
  const end = new Date();
  const start = new Date();
  if (period === "daily") {
    start.setDate(start.getDate() - 1);
  } else if (period === "weekly") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
  }
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return d >= from && d <= to;
}

/** Parse "22 min" or "5 min" to number; return null if not parseable */
function parseWaitMins(s: string | undefined): number | null {
  if (!s || typeof s !== "string") return null;
  const m = s.trim().match(/^(\d+)\s*min/i);
  return m ? parseInt(m[1], 10) : null;
}

const DEPARTMENT_COLORS = ["#0d9488", "#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#6b7280"];

export function ReportsContent() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [queueRows, setQueueRows] = useState<QueueRowSync[]>([]);
  const [booked, setBooked] = useState<BookedQueueEntry[]>([]);
  const [exported, setExported] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setQueueRows(getQueueRowsFromStorage());
    setBooked(getBookedQueueFromStorage());
  }, []);

  const { from: defaultFrom, to: defaultTo } = useMemo(() => getDateRange("weekly"), []);
  const effectiveFrom = dateFrom || defaultFrom;
  const effectiveTo = dateTo || defaultTo;

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      const r = getDateRange(period);
      setDateFrom(r.from);
      setDateTo(r.to);
    }
  }, [period]);

  const completedInRange = useMemo(
    () =>
      queueRows.filter(
        (r) => r.status === "Completed" && inDateRange(r.addedAt, effectiveFrom, effectiveTo)
      ),
    [queueRows, effectiveFrom, effectiveTo]
  );

  const bookingsInRange = useMemo(
    () =>
      booked.filter(
        (b) =>
          inDateRange(b.addedAt, effectiveFrom, effectiveTo) ||
          (b.appointmentDate && inDateRange(b.appointmentDate, effectiveFrom, effectiveTo))
      ),
    [booked, effectiveFrom, effectiveTo]
  );

  const urgentCount = useMemo(
    () =>
      queueRows.filter(
        (r) =>
          (r.priority || "").toLowerCase().includes("urgent") &&
          inDateRange(r.addedAt, effectiveFrom, effectiveTo)
      ).length,
    [queueRows, effectiveFrom, effectiveTo]
  );

  const waitTimes = useMemo(() => {
    const mins = queueRows
      .map((r) => parseWaitMins(r.waitTime))
      .filter((m): m is number => m !== null);
    return mins;
  }, [queueRows]);
  const avgWaitMins = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : null;

  const previousRange = useMemo(() => {
    const from = new Date(effectiveFrom);
    const to = new Date(effectiveTo);
    const days = Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) || 1;
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - days);
    return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) };
  }, [effectiveFrom, effectiveTo]);

  const previousCompleted = useMemo(
    () =>
      queueRows.filter(
        (r) =>
          r.status === "Completed" &&
          inDateRange(r.addedAt, previousRange.from, previousRange.to)
      ).length,
    [queueRows, previousRange]
  );

  const trendPercent =
    previousCompleted > 0
      ? Math.round(((completedInRange.length - previousCompleted) / previousCompleted) * 100)
      : null;

  const activityByDay = useMemo(() => {
    const from = new Date(effectiveFrom);
    const to = new Date(effectiveTo);
    const dayMap: Record<string, { consultations: number; bookings: number; date: string }> = {};
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, consultations: 0, bookings: 0 };
    }
    completedInRange.forEach((r) => {
      const key = (r.addedAt || "").slice(0, 10);
      if (dayMap[key]) dayMap[key].consultations += 1;
    });
    bookingsInRange.forEach((b) => {
      const key = (b.appointmentDate || b.addedAt?.slice(0, 10) || "")?.slice(0, 10);
      if (key && dayMap[key]) dayMap[key].bookings += 1;
    });
    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [effectiveFrom, effectiveTo, completedInRange, bookingsInRange]);

  const departmentDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedInRange.forEach((r) => {
      const dept = r.department || "Others";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    bookingsInRange.forEach((b) => {
      const dept = b.department || "Others";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [{ name: "No data", value: 1, count: 0 }];
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
    }));
  }, [completedInRange, bookingsInRange]);

  const handleExportTxt = () => {
    const lines = [
      "HealthQueue PH – Reports & Analytics",
      `Date range: ${effectiveFrom} to ${effectiveTo}`,
      "",
      "Summary",
      `  Completed consultations: ${completedInRange.length}`,
      `  Bookings: ${bookingsInRange.length}`,
      `  Urgent cases: ${urgentCount}`,
      `  Avg wait time: ${avgWaitMins != null ? `${avgWaitMins} min` : "—"}`,
      "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `healthqueue-report-${effectiveFrom}-${effectiveTo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <AdminSectionHeader
          title="Reports & Analytics"
          description="Performance tracking and compliance reports"
        />
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
            >
              <span className="text-[#6C757D]">📅</span>
              Date range
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-full z-10 mt-1 flex rounded-lg border border-[#e9ecef] bg-white p-3 shadow-lg">
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded border border-[#dee2e6] px-2 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded border border-[#dee2e6] px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="text-xs text-[#6C757D] hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <span aria-hidden>↓</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Time period */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-sm font-medium text-[#6C757D]">Period:</span>
        {(["daily", "weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPeriod(p);
              const r = getDateRange(p);
              setDateFrom(r.from);
              setDateTo(r.to);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              period === p ? "bg-[#1e3a5f] text-white" : "bg-[#e9ecef] text-[#333333] hover:bg-[#dee2e6]"
            }`}
          >
            {p}
          </button>
        ))}
        <span className="ml-2 text-sm text-[#6C757D]">
          {effectiveFrom} → {effectiveTo}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Patients (completed)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">
            {completedInRange.length}
          </p>
          {trendPercent != null && (
            <p className={`mt-0.5 text-sm ${trendPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trendPercent >= 0 ? "+" : ""}{trendPercent}% from previous period
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Avg wait time</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">
            {avgWaitMins != null ? `${avgWaitMins} min` : "—"}
          </p>
          {avgWaitMins != null && (
            <p className="mt-0.5 text-sm text-[#6C757D]">From queue data</p>
          )}
        </div>
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Urgent cases</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">
            {urgentCount}
          </p>
          <p className="mt-0.5 text-sm text-[#6C757D]">In selected range</p>
        </div>
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Bookings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">
            {bookingsInRange.length}
          </p>
          <p className="mt-0.5 text-sm text-[#6C757D]">In selected range</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e9ecef] bg-white p-4 shadow-sm lg:p-5">
          <h3 className="text-base font-semibold text-[#333333]">Activity over time</h3>
          <p className="mt-0.5 text-xs text-[#6C757D]">Consultations and bookings by day</p>
          <div className="mt-4 h-[280px] w-full">
            {activityByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    stroke="#6C757D"
                    fontSize={11}
                  />
                  <YAxis stroke="#6C757D" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                    formatter={(value, name) => [value ?? 0, name === "consultations" ? "Consultations" : "Bookings"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="consultations"
                    name="consultations"
                    stackId="1"
                    stroke="#0d9488"
                    fill="#0d9488"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="bookings"
                    stackId="1"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6C757D]">
                No activity in this range
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ecef] bg-white p-4 shadow-sm lg:p-5">
          <h3 className="text-base font-semibold text-[#333333]">Patient distribution by department</h3>
          <p className="mt-0.5 text-xs text-[#6C757D]">Share of consultations and bookings</p>
          <div className="mt-4 h-[280px] w-full">
            {departmentDistribution.length > 0 && departmentDistribution[0].name !== "No data" ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {departmentDistribution.map((_, i) => (
                      <Cell key={i} fill={DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, _n, props) => [`${value ?? 0}% · ${(props?.payload as { count?: number })?.count ?? 0} records`, (props?.payload as { name?: string })?.name ?? ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6C757D]">
                No department data in this range
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export txt + feedback */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={handleExportTxt}
          className="rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
        >
          Export report (.txt)
        </button>
        {exported && <span className="text-sm text-green-600">Report downloaded.</span>}
      </div>
    </div>
  );
}
