"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";

type AdminOverviewStats = {
  queueCount: number;
  pendingBookingsCount: number;
  pendingWalkInsCount: number;
  staffCount: number;
  activeStaffCount: number;
  staff: { id: string; name: string; email: string; role: string; status: string }[];
  queueByDepartment: Record<string, number>;
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

function Card({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#6C757D]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#333333]">{value}</p>
          {sub != null && sub !== "" && (
            <p className="mt-0.5 text-xs text-[#6C757D]">{sub}</p>
          )}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa] text-[#007bff]">
          {icon}
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

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-xl border border-[#e9ecef] bg-white p-12 shadow-sm">
        <p className="text-[#6C757D]">Loading overview…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-medium text-amber-800">{error ?? "No data"}</p>
        <p className="mt-1 text-sm text-amber-700">Check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6 sm:mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Patients in queue"
          value={stats.queueCount}
          sub="Currently in the live queue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <Card
          label="Pending booking requests"
          value={stats.pendingBookingsCount}
          sub="Awaiting nurse confirmation"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <Card
          label="Pending walk-ins"
          value={stats.pendingWalkInsCount}
          sub="Registered, not yet in queue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <Card
          label="Staff"
          value={`${stats.activeStaffCount} / ${stats.staffCount}`}
          sub="Active / total accounts"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {stats.pendingBookingsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            <strong>{stats.pendingBookingsCount}</strong> booking request{stats.pendingBookingsCount !== 1 ? "s" : ""} waiting for confirmation.
          </p>
          <a
            href="/pages/nurse-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Open nurse dashboard →
          </a>
        </div>
      )}

      {onNavigateToTab && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm font-medium text-[#6C757D]">Quick links:</span>
          <a href="/pages/nurse-dashboard" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]">
            Nurse dashboard
          </a>
          <button type="button" onClick={() => onNavigateToTab("users")} className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]">
            Users
          </button>
          <button type="button" onClick={() => onNavigateToTab("reports")} className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]">
            Reports
          </button>
          <button type="button" onClick={() => onNavigateToTab("records")} className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]">
            Records
          </button>
          <span className="self-center text-xs text-[#6C757D]">Status: Operational</span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
          <div className="border-b border-[#e9ecef] bg-[#f8f9fa] px-5 py-3">
            <h3 className="text-base font-bold text-[#333333]">Queue & workload</h3>
            <p className="mt-0.5 text-sm text-[#6C757D]">By department, priority, and status.</p>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-[auto_1fr]">
              <dt className="text-sm font-medium text-[#6C757D] min-w-[7rem]">By department</dt>
              <dd className="text-sm text-[#333333]">
                {Object.keys(stats.queueByDepartment ?? {}).length === 0 ? (
                  <span className="text-[#6C757D]">No one in queue</span>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.queueByDepartment ?? {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count]) => {
                        const byDept = stats.queueByDepartment ?? {};
                        const max = Math.max(...Object.values(byDept), 1);
                        return (
                          <div key={dept} className="flex items-center gap-3">
                            <span className="w-36 shrink-0 truncate text-[#333333]">{dept}</span>
                            <div className="min-w-0 flex-1 h-6 rounded bg-[#e9ecef] overflow-hidden">
                              <div className="h-full rounded bg-[#007bff]" style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                            <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-[#333333]">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </dd>

              <dt className="text-sm font-medium text-[#6C757D] pt-1 border-t border-[#e9ecef]">Priority</dt>
              <dd className="text-sm text-[#333333] pt-1 border-t border-[#e9ecef] font-medium tabular-nums">
                Urgent {stats.priorityBreakdown?.urgent ?? 0} · Normal {stats.priorityBreakdown?.normal ?? 0}
              </dd>

              <dt className="text-sm font-medium text-[#6C757D]">Status</dt>
              <dd className="text-sm text-[#333333]">
                {Object.entries(stats.statusBreakdown ?? {}).length === 0 ? (
                  <span className="text-[#6C757D]">—</span>
                ) : (
                  <span className="font-medium">
                    {Object.entries(stats.statusBreakdown ?? {})
                      .map(([s, n]) => `${s}: ${n}`)
                      .join(" · ")}
                  </span>
                )}
              </dd>

              <dt className="text-sm font-medium text-[#6C757D] pt-1 border-t border-[#e9ecef]">Added to queue</dt>
              <dd className="text-sm pt-1 border-t border-[#e9ecef]">
                <span className="font-semibold tabular-nums text-[#333333]">Today {stats.addedTodayCount ?? 0}</span>
                <span className="text-[#6C757D] mx-1.5">·</span>
                <span className="font-semibold tabular-nums text-[#333333]">Yesterday {stats.addedYesterdayCount ?? 0}</span>
                {(stats.uniquePatientsToday ?? 0) > 0 && (
                  <p className="mt-1 text-[#6C757D]">Unique patients today: {stats.uniquePatientsToday}</p>
                )}
              </dd>
            </dl>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
          <div className="border-b border-[#e9ecef] bg-[#f8f9fa] px-5 py-3">
            <h3 className="text-base font-bold text-[#333333]">Bookings</h3>
            <p className="mt-0.5 text-sm text-[#6C757D]">Status summary and confirmed today.</p>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-[auto_1fr]">
              <dt className="text-sm font-medium text-[#6C757D] min-w-[7rem]">Status summary</dt>
              <dd className="text-sm text-[#333333]">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span><span className="text-[#6C757D]">Pending</span> <span className="font-semibold tabular-nums">{stats.bookingStatusSummary?.pending ?? 0}</span></span>
                  <span><span className="text-[#6C757D]">Confirmed</span> <span className="font-semibold tabular-nums">{stats.bookingStatusSummary?.confirmed ?? 0}</span></span>
                  <span><span className="text-[#6C757D]">Rejected</span> <span className="font-semibold tabular-nums">{stats.bookingStatusSummary?.rejected ?? 0}</span></span>
                  {(stats.bookingStatusSummary?.cancelled ?? 0) > 0 && (
                    <span><span className="text-[#6C757D]">Cancelled</span> <span className="font-semibold tabular-nums">{stats.bookingStatusSummary?.cancelled ?? 0}</span></span>
                  )}
                </div>
              </dd>

              <dt className="text-sm font-medium text-[#6C757D] pt-2 border-t border-[#e9ecef]">Confirmed today</dt>
              <dd className="text-2xl font-bold tabular-nums text-[#333333] pt-2 border-t border-[#e9ecef]">
                {stats.confirmedTodayCount ?? 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {activityLog.length > 0 && (
        <div className="rounded-xl border border-[#e9ecef] bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-[#333333]">Activity by staff ({activityDate})</h3>
          <p className="mt-0.5 text-sm text-[#6C757D]">Action count per staff for the selected date.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(
              activityLog.reduce<Record<string, number>>((acc, e) => {
                acc[e.staffName] = (acc[e.staffName] ?? 0) + 1;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .map(([name, count]) => (
                <span key={name} className="rounded-full bg-[#f8f9fa] px-3 py-1.5 text-sm font-medium text-[#333333]">
                  {name}: {count}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm">
        <div className="border-b border-[#e9ecef] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#333333]">Staff actions</h3>
              <p className="mt-0.5 text-sm text-[#6C757D]">Record of actions by staff for the selected date.</p>
            </div>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {activityLoading ? (
            <div className="px-4 py-8 text-center text-sm text-[#6C757D]">Loading…</div>
          ) : activityLog.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#6C757D]">
              No staff actions recorded for this date.
            </div>
          ) : (
            <>
              {activityLog.length > 10 && (
                <div className="border-b border-[#e9ecef] px-4 py-3">
                  <p className="text-xs font-medium text-[#6C757D]">Recent (last 10)</p>
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-[#333333]">Time</th>
                        <th className="px-4 py-2 text-left font-medium text-[#333333]">Staff</th>
                        <th className="px-4 py-2 text-left font-medium text-[#333333]">Action</th>
                        <th className="px-4 py-2 text-left font-medium text-[#333333]">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLog.slice(0, 10).map((entry) => (
                        <tr key={entry.id} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
                          <td className="whitespace-nowrap px-4 py-2 text-[#333333]">{formatActivityTime(entry.createdAt)}</td>
                          <td className="px-4 py-2 font-medium text-[#333333]">{entry.staffName}</td>
                          <td className="px-4 py-2 text-[#333333]">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                          <td className="max-w-xs truncate px-4 py-2 text-[#6C757D]">{formatActivityDetails(entry.details)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <table className="min-w-full text-sm">
              <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#333333]">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-[#333333]">Staff</th>
                  <th className="px-4 py-3 text-left font-medium text-[#333333]">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-[#333333]">Details</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
                    <td className="whitespace-nowrap px-4 py-3 text-[#333333]">{formatActivityTime(entry.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#333333]">{entry.staffName}</span>
                      <span className="ml-1 text-[#6C757D]">({entry.staffEmail})</span>
                    </td>
                    <td className="px-4 py-3 text-[#333333]">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-[#6C757D]" title={formatActivityDetails(entry.details)}>
                      {formatActivityDetails(entry.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm">
        <div className="border-b border-[#e9ecef] px-4 py-3">
          <h3 className="text-base font-bold text-[#333333]">Staff overview</h3>
          <p className="mt-0.5 text-sm text-[#6C757D]">All user accounts. Manage in Users.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[#333333]">Name</th>
                <th className="px-4 py-3 text-left font-medium text-[#333333]">Email</th>
                <th className="px-4 py-3 text-left font-medium text-[#333333]">Role</th>
                <th className="px-4 py-3 text-left font-medium text-[#333333]">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.staff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#6C757D]">
                    No staff accounts yet.
                  </td>
                </tr>
              ) : (
                stats.staff.map((s) => (
                  <tr key={s.id} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3 font-medium text-[#333333]">{s.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#333333]">{s.email ?? "—"}</td>
                    <td className="px-4 py-3 text-[#333333]">{ROLE_LABELS[s.role] ?? s.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-[#e9ecef] text-[#6C757D]"
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
