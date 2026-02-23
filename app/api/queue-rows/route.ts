import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbQueueRow } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";

function toAppRow(r: DbQueueRow) {
  return {
    ticket: r.ticket,
    patientName: r.patient_name,
    department: r.department,
    priority: r.priority,
    status: r.status,
    waitTime: r.wait_time ?? "",
    source: r.source,
    addedAt: r.added_at ?? undefined,
    appointmentTime: r.appointment_time ?? undefined,
    assignedDoctor: r.assigned_doctor ?? undefined,
    appointmentDate: r.appointment_date ?? undefined,
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

/** True if row is for today: appointment date (booked) or added date (walk-in) in Asia/Manila. Only today's appointments show. */
function isRowForToday(r: DbQueueRow): boolean {
  const today = getTodayDateStr();
  const aptRaw = (r.appointment_date ?? "").toString().trim();
  if (aptRaw) {
    const parsed = new Date(aptRaw);
    if (!Number.isNaN(parsed.getTime())) {
      const aptDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(parsed)
        .replace(/\//g, "-");
      if (aptDateStr === today) return true;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(aptRaw.slice(0, 10)) && aptRaw.slice(0, 10) === today) return true;
  }
  const addedAt = (r.added_at ?? "").toString();
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
  let q = supabase.from("queue_rows").select("*").order("added_at", { ascending: true });
  if (NURSE_LIKE_ROLES.includes(staff.role as "nurse" | "receptionist") && staff.department?.trim()) {
    q = q.ilike("department", staff.department.trim());
  }
  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  let rows = (data ?? []) as DbQueueRow[];
  if (NURSE_LIKE_ROLES.includes(staff.role as "nurse" | "receptionist")) {
    rows = rows.filter(isRowForToday);
  }
  return NextResponse.json(rows.map(toAppRow));
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
  const dbRows = rows.map((r: Record<string, unknown>) => ({
    ticket: r.ticket,
    patient_name: r.patientName,
    department: r.department,
    priority: r.priority,
    status: r.status,
    wait_time: r.waitTime ?? "",
    source: r.source,
    added_at: r.addedAt ?? null,
    appointment_time: r.appointmentTime ?? null,
    assigned_doctor: r.assignedDoctor ?? null,
    appointment_date: r.appointmentDate ?? null,
  }));
  const { error } = await supabase.from("queue_rows").upsert(dbRows, {
    onConflict: "ticket",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
