import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbQueueItem } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";

type QueueItemWithJoins = DbQueueItem & {
  departments?: { name: string } | null;
  patient_users?: { first_name: string; last_name: string } | null;
  staff_users?: { first_name: string; last_name: string } | null;
};

function queueItemToBookedEntry(r: QueueItemWithJoins) {
  const patientName =
    r.patient_users?.first_name && r.patient_users?.last_name
      ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
      : r.walk_in_first_name && r.walk_in_last_name
        ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
        : r.walk_in_first_name || "Unknown";
  const department = r.departments?.name ?? "General Medicine";
  const preferredDoctor =
    r.staff_users?.first_name && r.staff_users?.last_name
      ? `${r.staff_users.first_name} ${r.staff_users.last_name}`
      : null;
  const appointmentDateObj = r.appointment_at ? new Date(r.appointment_at) : null;
  const appointmentDate = appointmentDateObj
    ? `${appointmentDateObj.getFullYear()}-${String(appointmentDateObj.getMonth() + 1).padStart(2, "0")}-${String(appointmentDateObj.getDate()).padStart(2, "0")}`
    : null;
  const appointmentTime = appointmentDateObj ? appointmentDateObj.toTimeString().slice(0, 5) : null;
  return {
    referenceNo: r.ticket,
    patientName,
    department,
    appointmentTime: appointmentTime ?? "",
    addedAt: r.added_at ?? "",
    preferredDoctor: preferredDoctor ?? undefined,
    appointmentDate: appointmentDate ?? undefined,
  };
}

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

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
  const { data, error } = await supabase
    .from("queue_items")
    .select("*, departments(name), patient_users(first_name, last_name), staff_users!queue_items_assigned_doctor_id_fkey(first_name, last_name)")
    .eq("source", "booked")
    .order("added_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(((data ?? []) as unknown as QueueItemWithJoins[]).map(queueItemToBookedEntry));
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
  let q = supabase.from("staff_users").select("id").eq("role", "doctor").eq("status", "active").eq("first_name", firstName);
  if (lastName) q = q.eq("last_name", lastName);
  const { data } = await q.maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function splitPatientName(name: string): { firstName: string; lastName: string } {
  const clean = name.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** POST: create/upsert booked entry into queue (source=booked). Public (no auth) so the booking form can submit. */
export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  const deptId = await resolveDepartmentId(supabase, body.department);
  if (!deptId) {
    return NextResponse.json({ error: `Department "${body.department}" not found` }, { status: 400 });
  }
  const doctorId = await resolveDoctorId(supabase, body.preferredDoctor);
  const { firstName, lastName } = splitPatientName(body.patientName ?? "");
  const appointmentAt =
    body.appointmentDate && body.appointmentTime
      ? new Date(`${body.appointmentDate}T${body.appointmentTime}`).toISOString()
      : body.appointmentDate
        ? new Date(`${body.appointmentDate}T00:00:00`).toISOString()
        : null;

  const queueItem = {
    ticket: body.referenceNo,
    source: "booked" as const,
    priority: "normal" as const,
    status: "scheduled",
    wait_time: "",
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
    added_at: body.addedAt ? new Date(body.addedAt).toISOString() : new Date().toISOString(),
  };
  const { error } = await supabase.from("queue_items").upsert(queueItem, {
    onConflict: "ticket",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
