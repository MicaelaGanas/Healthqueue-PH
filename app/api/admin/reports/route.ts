import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbQueueRow, DbBookedEntry } from "../../../lib/supabase/types";
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

  // Fetch queue_rows and booked_queue in parallel
  const [queueRowsResult, bookedQueueResult] = await Promise.all([
    supabase
      .from("queue_rows")
      .select("*")
      .order("added_at", { ascending: true }),
    supabase
      .from("booked_queue")
      .select("*")
      .order("added_at", { ascending: true }),
  ]);

  if (queueRowsResult.error) {
    return NextResponse.json(
      { error: `Failed to fetch queue rows: ${queueRowsResult.error.message}` },
      { status: 500 }
    );
  }

  if (bookedQueueResult.error) {
    return NextResponse.json(
      { error: `Failed to fetch booked queue: ${bookedQueueResult.error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    queueRows: (queueRowsResult.data ?? []).map(toAppRow),
    bookedQueue: (bookedQueueResult.data ?? []).map(toAppEntry),
  });
}
