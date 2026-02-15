import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbQueueRow } from "../../lib/supabase/types";

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

export async function GET() {
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
    .order("added_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(toAppRow));
}

export async function PUT(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  const rows = Array.isArray(body) ? body : body.rows ?? [];
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
