import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

function getTodayStart(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function getYesterdayStart(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export type AdminOverviewStats = {
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

/** GET: overview stats for admin dashboard. No new DB tables required. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const todayStart = getTodayStart();
  const yesterdayStart = getYesterdayStart();

  const [
    queueRowsRes,
    pendingBookingsRes,
    pendingWalkInsRes,
    staffRes,
    bookingRequestsRes,
  ] = await Promise.all([
    supabase.from("queue_rows").select("department, priority, status, added_at, patient_name"),
    supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("pending_walk_ins").select("id", { count: "exact", head: true }),
    supabase.from("admin_users").select("id, name, email, role, status").order("name"),
    supabase.from("booking_requests").select("status, confirmed_at"),
  ]);

  const queueRows = (queueRowsRes.error ? [] : (queueRowsRes.data ?? [])) as {
    department: string | null;
    priority: string | null;
    status: string | null;
    added_at: string | null;
    patient_name: string | null;
  }[];
  const pendingBookingsCount = pendingBookingsRes.error ? 0 : (pendingBookingsRes.count ?? 0);
  const pendingWalkInsCount = pendingWalkInsRes.error ? 0 : (pendingWalkInsRes.count ?? 0);
  const staff = staffRes.error ? [] : ((staffRes.data ?? []) as { id: string; name: string; email: string; role: string; status: string }[]);
  const staffCount = staff.length;
  const activeStaffCount = staff.filter((s) => s.status === "active").length;
  const bookingRequests = (bookingRequestsRes.error ? [] : (bookingRequestsRes.data ?? [])) as { status: string; confirmed_at: string | null }[];

  const queueByDepartment: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  let urgent = 0;
  let normal = 0;
  let addedTodayCount = 0;
  let addedYesterdayCount = 0;
  const patientsTodaySet = new Set<string>();

  for (const r of queueRows) {
    const dept = (r.department ?? "").trim() || "General Medicine";
    queueByDepartment[dept] = (queueByDepartment[dept] ?? 0) + 1;
    const status = (r.status ?? "waiting").trim();
    statusBreakdown[status] = (statusBreakdown[status] ?? 0) + 1;
    if (r.priority === "urgent") urgent++;
    else normal++;
    const addedAt = r.added_at ? new Date(r.added_at).toISOString() : "";
    if (addedAt >= todayStart) {
      addedTodayCount++;
      const name = (r.patient_name ?? "").trim();
      if (name) patientsTodaySet.add(name);
    } else if (addedAt >= yesterdayStart && addedAt < todayStart) {
      addedYesterdayCount++;
    }
  }

  const bookingStatusSummary = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 };
  let confirmedTodayCount = 0;
  const todayStartSlice = todayStart.slice(0, 10);
  for (const b of bookingRequests) {
    if (b.status in bookingStatusSummary) (bookingStatusSummary as Record<string, number>)[b.status]++;
    if (b.status === "confirmed" && b.confirmed_at && b.confirmed_at.slice(0, 10) === todayStartSlice) {
      confirmedTodayCount++;
    }
  }

  const body: AdminOverviewStats = {
    queueCount: queueRows.length,
    pendingBookingsCount,
    pendingWalkInsCount,
    staffCount,
    activeStaffCount,
    staff,
    queueByDepartment,
    priorityBreakdown: { urgent, normal },
    statusBreakdown,
    addedTodayCount,
    addedYesterdayCount,
    bookingStatusSummary,
    confirmedTodayCount,
    uniquePatientsToday: patientsTodaySet.size,
  };
  return NextResponse.json(body);
}
