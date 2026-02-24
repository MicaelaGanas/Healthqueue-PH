import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";

/** Format ISO timestamp to YYYY-MM-DD in local time (avoids UTC date shift for UTC+x timezones). */
function toLocalDateStr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** GET /api/queue/status/[number] – public queue status by ticket or reference number */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const number = (await params).number;
  if (!number) {
    return NextResponse.json({ error: "Missing queue number" }, { status: 400 });
  }
  const decoded = decodeURIComponent(number).trim();

  const { data: row, error } = await supabase
    .from("queue_items")
    .select(`
      ticket, status, wait_time, priority, source, appointment_at, added_at,
      walk_in_first_name, walk_in_last_name, walk_in_age_years, walk_in_sex, walk_in_phone, walk_in_email,
      departments(name),
      patient_users(first_name, last_name, email, number),
      staff_users(first_name, last_name)
    `)
    .eq("ticket", decoded)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // In queue: return live status (if status is waiting/scheduled and no vitals yet, patient is awaiting_triage)
  if (row) {
    type Row = {
      ticket: string;
      status: string;
      wait_time: string | null;
      priority: string;
      source: string;
      appointment_at: string | null;
      added_at: string | null;
      walk_in_first_name: string | null;
      walk_in_last_name: string | null;
      walk_in_age_years: number | null;
      walk_in_sex: string | null;
      walk_in_phone: string | null;
      walk_in_email: string | null;
      departments?: { name: string } | null;
      patient_users?: { first_name: string; last_name: string; email: string | null; number: string | null } | null;
      staff_users?: { first_name: string; last_name: string } | null;
    };
    const r = row as unknown as Row;
    const raw = (r.status || "").toLowerCase().trim();

    // Patient in queue but not yet checked for triage/vitals
    if (raw === "waiting" || raw === "scheduled") {
      const { data: vitalsRow, error: vitalsError } = await supabase
        .from("vital_signs")
        .select("ticket")
        .eq("ticket", r.ticket)
        .limit(1)
        .maybeSingle();
      if (vitalsError) {
        return NextResponse.json({ error: vitalsError.message }, { status: 500 });
      }
      if (!vitalsRow) {
        const patientName =
          r.patient_users?.first_name && r.patient_users?.last_name
            ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
            : r.walk_in_first_name && r.walk_in_last_name
              ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
              : r.walk_in_first_name || r.patient_users?.first_name || null;
        const assignedDoctor =
          r.staff_users?.first_name && r.staff_users?.last_name
            ? `${r.staff_users.first_name} ${r.staff_users.last_name}`
            : null;
        return NextResponse.json({
          queueNumber: r.ticket,
          assignedDepartment: r.departments?.name ?? "—",
          estimatedWaitTime: r.wait_time ?? "—",
          status: "awaiting_triage",
          patientName,
          age: r.walk_in_age_years ?? null,
          sex: r.walk_in_sex ?? null,
          phone: r.walk_in_phone ?? r.patient_users?.number ?? null,
          email: r.walk_in_email ?? r.patient_users?.email ?? null,
          priority: r.priority,
          source: r.source === "walk_in" ? "walk-in" : r.source,
          appointmentDate: toLocalDateStr(r.appointment_at),
          appointmentTime: r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null,
          assignedDoctor,
          addedAt: r.added_at ?? null,
        });
      }
    }

    const statusMap: Record<string, string> = {
      waiting: "waiting",
      scheduled: "waiting",
      called: "almost",
      "in progress": "almost",
      in_consultation: "proceed",
      completed: "completed",
      cancelled: "completed",
      no_show: "completed",
    };
    const patientName =
      r.patient_users?.first_name && r.patient_users?.last_name
        ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
        : r.walk_in_first_name && r.walk_in_last_name
          ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
          : r.walk_in_first_name || r.patient_users?.first_name || null;
    const assignedDoctor =
      r.staff_users?.first_name && r.staff_users?.last_name
        ? `${r.staff_users.first_name} ${r.staff_users.last_name}`
        : null;
    return NextResponse.json({
      queueNumber: r.ticket,
      assignedDepartment: r.departments?.name ?? "—",
      estimatedWaitTime: r.wait_time ?? "—",
      status: statusMap[raw] ?? "waiting",
      patientName,
      age: r.walk_in_age_years ?? null,
      sex: r.walk_in_sex ?? null,
      phone: r.walk_in_phone ?? r.patient_users?.number ?? null,
      email: r.walk_in_email ?? r.patient_users?.email ?? null,
      priority: r.priority,
      source: r.source === "walk_in" ? "walk-in" : r.source,
      appointmentDate: toLocalDateStr(r.appointment_at),
      appointmentTime: r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null,
      assignedDoctor,
      addedAt: r.added_at ?? null,
    });
  }

  // Not in queue yet: if it's a confirmed booking, return "confirmed" so patient sees appointment and "check in when you arrive"
  const { data: booking } = await supabase
    .from("booking_requests")
    .select(`
      reference_no, requested_date, requested_time, department_id,
      departments(name),
      patient_users(first_name, last_name, email, number)
    `)
    .eq("reference_no", decoded)
    .eq("status", "confirmed")
    .maybeSingle();

  if (booking) {
    const b = booking as unknown as {
      reference_no: string;
      requested_date: string | null;
      requested_time: string | null;
      departments?: { name: string } | { name: string }[] | null;
      patient_users?: { first_name: string; last_name: string; email: string | null; number: string | null } | null;
    };
    const dept = b.departments;
    const departmentName = Array.isArray(dept) ? dept[0]?.name : dept?.name;
    const patientName =
      b.patient_users?.first_name && b.patient_users?.last_name
        ? `${b.patient_users.first_name} ${b.patient_users.last_name}`
        : null;
    return NextResponse.json({
      queueNumber: b.reference_no,
      assignedDepartment: departmentName ?? "—",
      estimatedWaitTime: "",
      status: "confirmed",
      patientName,
      phone: b.patient_users?.number ?? null,
      email: b.patient_users?.email ?? null,
      appointmentDate: b.requested_date ?? null,
      appointmentTime: b.requested_time ?? null,
      source: "booked",
    });
  }

  return NextResponse.json(null);
}
