import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbQueueRow } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";

/** Map queue_rows (source=booked) to the same shape as legacy booked_queue API. */
function queueRowToBookedEntry(r: DbQueueRow) {
  return {
    referenceNo: r.ticket,
    patientName: r.patient_name,
    department: r.department,
    appointmentTime: r.appointment_time ?? "",
    addedAt: r.added_at ?? "",
    preferredDoctor: r.assigned_doctor ?? undefined,
    appointmentDate: r.appointment_date ?? undefined,
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
    .from("queue_rows")
    .select("*")
    .eq("source", "booked")
    .order("added_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(queueRowToBookedEntry));
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
  const queueRow = {
    ticket: body.referenceNo,
    patient_name: body.patientName,
    department: body.department,
    priority: "normal",
    status: "scheduled",
    wait_time: "",
    source: "booked",
    added_at: body.addedAt,
    appointment_time: body.appointmentTime,
    assigned_doctor: body.preferredDoctor ?? null,
    appointment_date: body.appointmentDate ?? null,
  };
  const { error } = await supabase.from("queue_rows").upsert(queueRow, {
    onConflict: "ticket",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
