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
    .select("reference_no, requested_date, department")
    .eq("patient_user_id", user.id)
    .eq("status", "confirmed")
    .gte("requested_date", today)
    .order("requested_date", { ascending: true })
    .limit(1);

  const ref = bookings?.[0]?.reference_no;
  if (!ref) {
    return NextResponse.json(null);
  }

  const { data: row, error } = await supabase
    .from("queue_rows")
    .select("ticket, patient_name, department, status, wait_time, appointment_time, appointment_date, added_at")
    .eq("ticket", ref)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    queueNumber: row.ticket,
    department: row.department ?? "—",
    status: row.status,
    waitTime: row.wait_time ?? "",
    appointmentDate: row.appointment_date ?? null,
    appointmentTime: row.appointment_time ?? null,
  });
}
