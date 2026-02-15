import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbBookedEntry } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";

function toAppEntry(r: DbBookedEntry) {
  return {
    referenceNo: r.reference_no,
    patientName: r.patient_name,
    department: r.department,
    appointmentTime: r.appointment_time,
    addedAt: r.added_at,
    preferredDoctor: r.preferred_doctor ?? undefined,
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
    .from("booked_queue")
    .select("*")
    .order("added_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(toAppEntry));
}

/** POST: create/upsert booking. Public (no auth) so the booking form can submit. */
export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  const entry = {
    reference_no: body.referenceNo,
    patient_name: body.patientName,
    department: body.department,
    appointment_time: body.appointmentTime,
    added_at: body.addedAt,
    preferred_doctor: body.preferredDoctor ?? null,
    appointment_date: body.appointmentDate ?? null,
  };
  const { error } = await supabase.from("booked_queue").upsert(entry, {
    onConflict: "reference_no",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
