"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type LiveQueueDepartment = {
  department: string;
  inQueue: number;
  avgWaitMins: number;
  status: "Normal" | "Delayed" | "Critical";
};

type AdminOverviewStats = {
  queueCount: number;
  pendingBookingsCount: number;
  pendingWalkInsCount: number;
  staffCount: number;
  activeStaffCount: number;
  staff: { id: string; name: string; email: string; role: string; status: string }[];
  queueByDepartment: Record<string, number>;
  liveQueueByDepartment: LiveQueueDepartment[];
  priorityBreakdown: { urgent: number; normal: number };
  statusBreakdown: Record<string, number>;
  addedTodayCount: number;
  addedYesterdayCount: number;
  bookingStatusSummary: { pending: number; confirmed: number; rejected: number; cancelled: number };
  confirmedTodayCount: number;
  uniquePatientsToday: number;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  nurse: "Nurse",
  doctor: "Doctor",
  receptionist: "Receptionist",
  laboratory: "Laboratory",
};

type ActivityEntry = {
  id: string;
  staffName: string;
  staffEmail: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  booking_confirmed: "Confirmed booking",
  booking_rejected: "Rejected booking",
  booking_cancelled: "Cancelled booking",
  walk_in_added_to_queue: "Added walk-in to queue",
  pending_walk_in_cancelled: "Cancelled pending walk-in",
};

function formatActivityTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function formatActivityDetails(details: Record<string, unknown>): string {
  if (!details || typeof details !== "object") return "—";
  const parts: string[] = [];
  if (details.patientName) parts.push(String(details.patientName));
  if (details.department) parts.push(String(details.department));
  if (details.ticket) parts.push(`Ticket: ${details.ticket}`);
  if (details.priority) parts.push(String(details.priority));
  return parts.length > 0 ? parts.join(" · ") : "—";
}

const STAT_CARD_COLORS = [
  "bg-blue-500/10 text-blue-600",
  "bg-violet-500/10 text-violet-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-slate-500/10 text-slate-600",
] as const;

function Card({
  label,
  value,
  icon,
  sub,
  colorIndex = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  colorIndex?: number;
}) {
  const color = STAT_CARD_COLORS[colorIndex % STAT_CARD_COLORS.length];
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          {sub != null && sub !== "" && (
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-105`}>
          <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

type AdminOverviewContentProps = {
  onNavigateToTab?: (tab: "users" | "reports" | "records") => void;
};

export function AdminOverviewContent({ onNavigateToTab }: AdminOverviewContentProps) {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [activityDate, setActivityDate] = useState(getTodayDateString);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityStaffFilter, setActivityStaffFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setError("Not configured");
      setLoading(false);
      return;
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        if (!res.ok) {
          setError("Failed to load overview");
          setStats(null);
          return;
        }
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch {
        setError("Failed to load overview");
        setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) return;
      setActivityLoading(true);
      try {
        const res = await fetch(`/api/admin/activity-log?date=${activityDate}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setActivityLog(Array.isArray(data) ? data : []);
        } else {
          setActivityLog([]);
        }
      } catch {
        setActivityLog([]);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activityDate]);

  if (loading || !stats) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-12 shadow-sm">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden />
        <p className="text-sm text-slate-500">Loading overview…</p>
      </div>
    );
  }

  const liveQueue = stats.liveQueueByDepartment ?? [];
  const activityStaffNames = Array.from(new Set(activityLog.map((e) => e.staffName))).sort();
  const filteredActivityLog = activityStaffFilter
    ? activityLog.filter((e) => e.staffName === activityStaffFilter)
    : activityLog;

  return (
    <div className="mt-4 space-y-8 sm:mt-6">
      {/* Summary cards - at top */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card colorIndex={0} label="Total in queue" value={stats.queueCount} sub="Across all departments" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <Card colorIndex={1} label="Pending requests" value={stats.pendingBookingsCount} sub="Awaiting confirmation" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <Card colorIndex={2} label="Pending walk-ins" value={stats.pendingWalkInsCount} sub="Not yet in queue" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>} />
        <Card colorIndex={3} label="Staff" value={`${stats.activeStaffCount} / ${stats.staffCount}`} sub="Active / total" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
      </div>

      {/* Live Queue Monitoring - underneath summary */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-slate-900">Live Queue Monitoring</h2>
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          </div>
          <span className="text-xs text-slate-500">All departments</span>
        </div>
        <div className="p-3">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {liveQueue.map((dept) => (
              <div
                key={dept.department}
                className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{dept.department}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                          dept.status === "Critical" ? "bg-red-500" : dept.status === "Delayed" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        aria-hidden
                      />
                      <span className={`text-xs ${
                        dept.status === "Critical" ? "text-red-700" : dept.status === "Delayed" ? "text-amber-700" : "text-emerald-700"
                      }`}>
                        {dept.status}
                      </span>
                    </div>
                    <a href="/pages/nurse-dashboard" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-600 hover:text-blue-700">
                      View →
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-4 text-right">
                    <div className="w-10">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Queue</p>
                      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{dept.inQueue}</p>
                    </div>
                    <div className="w-10">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Wait</p>
                      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{dept.avgWaitMins}<span className="text-xs font-normal text-slate-500">m</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {liveQueue.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-500">No departments in queue.</p>
          )}
        </div>
      </div>

      {stats.pendingBookingsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm">
          <p className="text-sm font-medium text-amber-900">
            <strong className="tabular-nums">{stats.pendingBookingsCount}</strong> booking request{stats.pendingBookingsCount !== 1 ? "s" : ""} waiting for confirmation.
          </p>
          <a href="/pages/nurse-dashboard" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700">
            Open nurse dashboard →
          </a>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking requests summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Booking requests</h3>
            <p className="mt-0.5 text-sm text-slate-500">Appointment request status and confirmed today.</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">Pending {stats.bookingStatusSummary?.pending ?? 0}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">Confirmed {stats.bookingStatusSummary?.confirmed ?? 0}</span>
              <span className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800">Rejected {stats.bookingStatusSummary?.rejected ?? 0}</span>
              {(stats.bookingStatusSummary?.cancelled ?? 0) > 0 && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">Cancelled {stats.bookingStatusSummary?.cancelled ?? 0}</span>}
            </div>
            <p className="mt-4 text-sm text-slate-600"><span className="font-semibold text-slate-900">Confirmed today:</span> <span className="tabular-nums font-bold">{stats.confirmedTodayCount ?? 0}</span></p>
          </div>
        </div>

        {/* Average Wait Times Today — area chart (reference design) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Average Wait Times Today</h3>
            <p className="mt-0.5 text-sm text-slate-500">Current estimated wait (minutes). Shown across the day until hourly data is available.</p>
          </div>
          <div className="p-6 h-64">
            {(() => {
              const depts = liveQueue.filter((d) => d.inQueue > 0);
              if (depts.length === 0) return <div className="flex h-full items-center justify-center text-sm text-slate-500">No queue data to show. Wait times appear when patients are in queue.</div>;
              const hours = [6, 8, 10, 12, 14, 16, 18];
              const chartData = hours.map((h) => {
                const timeLabel = h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`;
                const point: Record<string, string | number> = { time: timeLabel };
                depts.forEach((d) => { point[d.department] = d.avgWaitMins; });
                return point;
              });
              const colors = ["#0d9488", "#2563eb", "#059669", "#7c3aed", "#dc2626"];
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="time" stroke="#6C757D" fontSize={11} />
                    <YAxis stroke="#6C757D" fontSize={11} domain={[0, 60]} tickCount={5} />
                    <Tooltip formatter={(value, name) => [`${value != null ? value : 0} min`, name]} labelFormatter={(l) => l} />
                    <Legend layout="horizontal" align="right" verticalAlign="top" wrapperStyle={{ paddingBottom: 8 }} iconType="circle" iconSize={8} />
                    {depts.map((d, i) => (
                      <Area key={d.department} type="monotone" dataKey={d.department} name={d.department} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.4} strokeWidth={2} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      </div>

      {onNavigateToTab && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick links</span>
          <div className="flex flex-wrap gap-2">
            <a href="/pages/nurse-dashboard" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Nurse dashboard</a>
            <button type="button" onClick={() => onNavigateToTab("users")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Users</button>
            <button type="button" onClick={() => onNavigateToTab("reports")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Reports</button>
            <button type="button" onClick={() => onNavigateToTab("records")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Records</button>
          </div>
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Staff actions</h3>
              <p className="mt-0.5 text-sm text-slate-500">All actions for the selected date. Filter by staff below.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <select
                value={activityStaffFilter}
                onChange={(e) => setActivityStaffFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All staff</option>
                {activityStaffNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {activityLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden />
              <span className="text-sm text-slate-500">Loading…</span>
            </div>
          ) : filteredActivityLog.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              {activityStaffFilter ? "No actions for this staff on this date." : "No staff actions recorded for this date."}
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Staff</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivityLog.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-600">{formatActivityTime(entry.createdAt)}</td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-slate-800">{entry.staffName}</span>
                      <span className="ml-1 text-slate-500">({entry.staffEmail})</span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                    <td className="max-w-xs truncate px-6 py-3 text-slate-500" title={formatActivityDetails(entry.details)}>
                      {formatActivityDetails(entry.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Staff overview</h3>
          <p className="mt-0.5 text-sm text-slate-500">All user accounts. Manage in Users.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.staff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No staff accounts yet.
                  </td>
                </tr>
              ) : (
                stats.staff.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-3 font-medium text-slate-800">{s.name ?? "—"}</td>
                    <td className="px-6 py-3 text-slate-600">{s.email ?? "—"}</td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {ROLE_LABELS[s.role] ?? s.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          s.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
