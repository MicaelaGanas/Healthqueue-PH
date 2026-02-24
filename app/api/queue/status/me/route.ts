import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../../../lib/supabase/server";

/**
 * GET /api/queue/status/me
 * Returns the logged-in patient's active queue entry (if any).
 * Uses confirmed booking_requests to find reference_no, then queue_rows by ticket.
 * Auth: Bearer token (patient).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabaseAuth = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user?.id) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: bookings } = await supabase
    .from("booking_requests")
    .select("reference_no, requested_date, department_id, departments(name)")
    .eq("patient_user_id", user.id)
    .eq("status", "confirmed")
    .gte("requested_date", today)
    .order("requested_date", { ascending: true })
    .limit(1);

  const firstBooking = bookings?.[0] as { reference_no: string; requested_date?: string; departments?: { name: string } | null } | undefined;
  const ref = firstBooking?.reference_no;
  if (!ref) {
    return NextResponse.json(null);
  }

  const { data: row, error } = await supabase
    .from("queue_items")
    .select("ticket, status, wait_time, appointment_at, added_at, departments(name)")
    .eq("ticket", ref)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // In queue: return live status (if waiting/scheduled and no vitals yet, patient is awaiting_triage)
  if (row) {
    type Row = { ticket: string; status: string; wait_time: string | null; appointment_at: string | null; departments?: { name: string } | null };
    const r = row as unknown as Row;
    const appointmentDate = r.appointment_at ? new Date(r.appointment_at).toISOString().slice(0, 10) : null;
    const appointmentTime = r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null;
    const raw = (r.status || "").toLowerCase().trim();

    let status = r.status;
    if (raw === "waiting" || raw === "scheduled") {
      const { data: vitalsRow } = await supabase
        .from("vital_signs")
        .select("ticket")
        .eq("ticket", r.ticket)
        .limit(1)
        .maybeSingle();
      if (!vitalsRow) status = "awaiting_triage";
    }

    return NextResponse.json({
      queueNumber: r.ticket,
      department: r.departments?.name ?? "—",
      status,
      waitTime: r.wait_time ?? "",
      appointmentDate,
      appointmentTime,
    });
  }

  // Confirmed booking but not in queue yet (patient should check in at desk)
  const appointmentDate = firstBooking.requested_date ?? null;
  const departmentName = firstBooking.departments?.name ?? "—";
  return NextResponse.json({
    queueNumber: ref,
    department: departmentName,
    status: "confirmed",
    waitTime: "",
    appointmentDate,
    appointmentTime: null,
  });
}
