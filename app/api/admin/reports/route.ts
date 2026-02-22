import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbQueueRow } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

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

/** Same shape as legacy booked API: derived from queue_rows where source=booked. */
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

const requireAdmin = requireRoles(["admin"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data: queueRows, error } = await supabase
    .from("queue_rows")
    .select("*")
    .order("added_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch queue rows: ${error.message}` },
      { status: 500 }
    );
  }

  const rows = queueRows ?? [];
  const bookedQueue = rows
    .filter((r) => r.source === "booked")
    .map(queueRowToBookedEntry);

  return NextResponse.json({
    queueRows: rows.map(toAppRow),
    bookedQueue,
  });
}
