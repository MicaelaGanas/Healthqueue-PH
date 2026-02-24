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

const EST_MINS_PER_PATIENT = 5;

/** Parse wait_time string (e.g. "15 min", "1 hr", "30 min") to minutes. */
function parseWaitTimeToMins(waitTime: string | null): number | null {
  if (!waitTime || !waitTime.trim()) return null;
  const s = waitTime.trim().toLowerCase();
  let total = 0;
  const hr = /(\d+)\s*hr/i.exec(s);
  const min = /(\d+)\s*min/i.exec(s);
  if (hr) total += parseInt(hr[1], 10) * 60;
  if (min) total += parseInt(min[1], 10);
  if (hr || min) return total;
  const num = /(\d+)/.exec(s);
  if (num) return parseInt(num[1], 10);
  return null;
}

export type LiveQueueDepartment = {
  department: string;
  inQueue: number;
  avgWaitMins: number;
  status: "Normal" | "Delayed" | "Critical";
};

export type AdminOverviewStats = {
  queueCount: number;
  pendingBookingsCount: number;
  pendingWalkInsCount: number;
  staffCount: number;
  activeStaffCount: number;
  staff: { id: string; name: string; email: string; role: string; status: string }[];
  queueByDepartment: Record<string, number>;
  /** Live queue monitoring: all departments with inQueue, avgWaitMins, status. */
  liveQueueByDepartment: LiveQueueDepartment[];
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
    queueItemsRes,
    pendingBookingsRes,
    pendingWalkInsRes,
    adminStaffRes,
    staffUsersRes,
    bookingRequestsRes,
    departmentsRes,
  ] = await Promise.all([
    supabase.from("queue_items").select("priority, status, added_at, wait_time, departments(name), patient_users(first_name, last_name), walk_in_first_name, walk_in_last_name"),
    supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("pending_walk_ins").select("id", { count: "exact", head: true }),
    supabase.from("admin_users").select("id, first_name, last_name, email, role, status").order("first_name"),
    supabase.from("staff_users").select("id, first_name, last_name, email, role, status").order("first_name"),
    supabase.from("booking_requests").select("status, confirmed_at"),
    supabase.from("departments").select("name").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
  ]);

  type QueueItemRow = {
    priority: string | null;
    status: string | null;
    added_at: string | null;
    wait_time: string | null;
    departments?: { name: string } | null;
    patient_users?: { first_name: string; last_name: string } | null;
    walk_in_first_name: string | null;
    walk_in_last_name: string | null;
  };
  const queueRows = (queueItemsRes.error ? [] : (queueItemsRes.data ?? [])) as unknown as QueueItemRow[];
  const departmentNames = (departmentsRes.error ? [] : (departmentsRes.data ?? []).map((r: { name: string }) => r.name)) as string[];
  const pendingBookingsCount = pendingBookingsRes.error ? 0 : (pendingBookingsRes.count ?? 0);
  const pendingWalkInsCount = pendingWalkInsRes.error ? 0 : (pendingWalkInsRes.count ?? 0);
  const toStaff = (s: { id: string; first_name: string; last_name: string; email: string; role: string; status: string }) => ({
    id: s.id,
    name: [s.first_name, s.last_name].filter(Boolean).join(" ").trim() || "Staff",
    email: s.email,
    role: s.role,
    status: s.status,
  });
  const adminStaff = adminStaffRes.error ? [] : (adminStaffRes.data ?? []).map(toStaff);
  const staffUsers = staffUsersRes.error ? [] : (staffUsersRes.data ?? []).map(toStaff);
  const staff = [...adminStaff, ...staffUsers];
  const staffCount = staff.length;
  const activeStaffCount = staff.filter((s) => s.status === "active").length;
  const bookingRequests = (bookingRequestsRes.error ? [] : (bookingRequestsRes.data ?? [])) as { status: string; confirmed_at: string | null }[];

  const queueByDepartment: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  const deptWaitMins: Record<string, number[]> = {};
  let urgent = 0;
  let normal = 0;
  let addedTodayCount = 0;
  let addedYesterdayCount = 0;
  const patientsTodaySet = new Set<string>();

  for (const r of queueRows) {
    const dept = (r.departments?.name ?? "").trim() || "General Medicine";
    queueByDepartment[dept] = (queueByDepartment[dept] ?? 0) + 1;
    const mins = parseWaitTimeToMins(r.wait_time);
    if (mins != null) {
      if (!deptWaitMins[dept]) deptWaitMins[dept] = [];
      deptWaitMins[dept].push(mins);
    }
    const status = (r.status ?? "waiting").trim();
    statusBreakdown[status] = (statusBreakdown[status] ?? 0) + 1;
    if (r.priority === "urgent") urgent++;
    else normal++;
    const addedAt = r.added_at ? new Date(r.added_at).toISOString() : "";
    if (addedAt >= todayStart) {
      addedTodayCount++;
      const name =
        r.patient_users?.first_name && r.patient_users?.last_name
          ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
          : r.walk_in_first_name && r.walk_in_last_name
            ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
            : r.walk_in_first_name || r.patient_users?.first_name || "";
      if (name.trim()) patientsTodaySet.add(name.trim());
    } else if (addedAt >= yesterdayStart && addedAt < todayStart) {
      addedYesterdayCount++;
    }
  }

  const allDeptNames = Array.from(new Set<string>([...departmentNames, ...Object.keys(queueByDepartment)]));
  const liveQueueByDepartment: { department: string; inQueue: number; avgWaitMins: number; status: "Normal" | "Delayed" | "Critical" }[] = allDeptNames.map((dept) => {
    const inQueue = queueByDepartment[dept] ?? 0;
    const minsList = deptWaitMins[dept];
    let avgWaitMins = inQueue > 0 && minsList && minsList.length > 0
      ? Math.round(minsList.reduce((a, b) => a + b, 0) / minsList.length)
      : inQueue * EST_MINS_PER_PATIENT;
    if (inQueue === 0) avgWaitMins = 0;
    let status: "Normal" | "Delayed" | "Critical" = "Normal";
    if (inQueue > 15 || avgWaitMins > 45) status = "Critical";
    else if (inQueue > 8 || avgWaitMins > 25) status = "Delayed";
    return { department: dept, inQueue, avgWaitMins, status };
  });

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
    liveQueueByDepartment,
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
