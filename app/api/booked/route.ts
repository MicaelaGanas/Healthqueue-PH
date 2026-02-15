import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbBookedEntry } from "../../lib/supabase/types";

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

export async function GET() {
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
