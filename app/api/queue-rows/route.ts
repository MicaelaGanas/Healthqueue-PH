import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbQueueItem } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";

type QueueItemWithJoins = DbQueueItem & {
  departments?: { name: string } | null;
  patient_users?: { first_name: string; last_name: string } | null;
  admin_users?: { first_name: string; last_name: string } | null;
};

function toAppRow(r: QueueItemWithJoins) {
  const patientName =
    r.patient_users?.first_name && r.patient_users?.last_name
      ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
      : r.walk_in_first_name && r.walk_in_last_name
        ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
        : r.walk_in_first_name || r.patient_users?.first_name || "Unknown";
  const department = r.departments?.name ?? "General Medicine";
  const assignedDoctor =
    r.admin_users?.first_name && r.admin_users?.last_name
      ? `${r.admin_users.first_name} ${r.admin_users.last_name}`
      : null;
  const appointmentDate = r.appointment_at ? new Date(r.appointment_at).toISOString().slice(0, 10) : null;
  const appointmentTime = r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null;
  return {
    ticket: r.ticket,
    patientName,
    department,
    priority: r.priority,
    status: r.status,
    waitTime: r.wait_time ?? "",
    source: r.source === "walk_in" ? "walk-in" : r.source,
    addedAt: r.added_at ?? undefined,
    appointmentTime: appointmentTime ?? undefined,
    assignedDoctor: assignedDoctor ?? undefined,
    appointmentDate: appointmentDate ?? undefined,
  };
}

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

const NURSE_LIKE_ROLES = ["nurse", "receptionist"] as const;

/** Today YYYY-MM-DD in Asia/Manila (for queue date filtering). */
function getTodayDateStr(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/\//g, "-");
}

/** Format an ISO date in Asia/Manila as YYYY-MM-DD (so "today" matches nurse's day). */
function toManilaDateStr(iso: string | null | undefined): string | null {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/\//g, "-");
}

/** True if row is for today: appointment date (booked) or added date (walk-in) in Asia/Manila. */
function isRowForToday(r: QueueItemWithJoins): boolean {
  const today = getTodayDateStr();
  if (r.appointment_at) {
    const aptDateStr = toManilaDateStr(r.appointment_at);
    if (aptDateStr === today) return true;
  }
  const addedAt = r.added_at ?? "";
  if (addedAt) {
    const addedDate = toManilaDateStr(addedAt);
    if (addedDate === today) return true;
  }
  return false;
}

export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const { staff } = auth;
  let q = supabase
    .from("queue_items")
    .select("*, departments(name), patient_users(first_name, last_name), admin_users!queue_items_assigned_doctor_id_fkey(first_name, last_name)")
    .order("added_at", { ascending: true });
  if (NURSE_LIKE_ROLES.includes(staff.role as "nurse" | "receptionist") && staff.departmentId) {
    q = q.eq("department_id", staff.departmentId);
  }
  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  let rows = (data ?? []) as unknown as QueueItemWithJoins[];
  if (NURSE_LIKE_ROLES.includes(staff.role as "nurse" | "receptionist")) {
    rows = rows.filter(isRowForToday);
  }
  return NextResponse.json(rows.map(toAppRow));
}

async function resolveDepartmentId(supabase: ReturnType<typeof getSupabaseServer>, deptName: string | null | undefined): Promise<string | null> {
  if (!deptName || !supabase) return null;
  const { data } = await supabase.from("departments").select("id").eq("name", deptName.trim()).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

async function resolveDoctorId(supabase: ReturnType<typeof getSupabaseServer>, doctorName: string | null | undefined): Promise<string | null> {
  if (!doctorName || !supabase) return null;
  const clean = doctorName.trim().replace(/^Dr\.\s*/i, "").replace(/\s*-\s*.*$/, "").trim();
  if (!clean) return null;
  const parts = clean.split(" ");
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  if (!firstName) return null;
  let q = supabase.from("admin_users").select("id").eq("role", "doctor").eq("status", "active").eq("first_name", firstName);
  if (lastName) q = q.eq("last_name", lastName);
  const { data } = await q.maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function splitPatientName(name: string): { firstName: string; lastName: string } {
  const clean = name.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export async function PUT(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  let rows = Array.isArray(body) ? body : body.rows ?? [];
  const { staff } = auth;
  if (NURSE_LIKE_ROLES.includes(staff.role as "nurse" | "receptionist") && staff.department?.trim()) {
    const dept = staff.department.trim();
    rows = rows.filter((r: Record<string, unknown>) => (r.department as string) === dept);
  }

  const dbRows = await Promise.all(
    rows.map(async (r: Record<string, unknown>) => {
      const source = r.source === "walk-in" ? "walk_in" : (r.source === "booked" ? "booked" : "walk_in");
      const priority = r.priority === "urgent" ? "urgent" : "normal";
      const deptId = await resolveDepartmentId(supabase, r.department as string | null | undefined);
      if (!deptId) {
        throw new Error(`Department "${r.department}" not found`);
      }
      const doctorId = await resolveDoctorId(supabase, r.assignedDoctor as string | null | undefined);
      const patientName = String(r.patientName ?? "").trim();
      const { firstName, lastName } = splitPatientName(patientName);
      const appointmentAt =
        r.appointmentDate && r.appointmentTime
          ? new Date(`${r.appointmentDate}T${r.appointmentTime}`).toISOString()
          : r.appointmentDate
            ? new Date(`${r.appointmentDate}T00:00:00`).toISOString()
            : null;

      return {
        ticket: String(r.ticket).trim(),
        source,
        priority,
        status: String(r.status ?? "waiting").trim(),
        wait_time: String(r.waitTime ?? "").trim(),
        department_id: deptId,
        patient_user_id: null,
        walk_in_first_name: firstName,
        walk_in_last_name: lastName,
        walk_in_age_years: null,
        walk_in_sex: null,
        walk_in_phone: null,
        walk_in_email: null,
        booking_request_id: null,
        assigned_doctor_id: doctorId,
        appointment_at: appointmentAt,
        added_at: r.addedAt ? new Date(r.addedAt as string).toISOString() : new Date().toISOString(),
      };
    })
  );

  const { error } = await supabase.from("queue_items").upsert(dbRows, {
    onConflict: "ticket",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
