import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import type { DbBookingRequest } from "../../../../lib/supabase/types";
import { requireRoles } from "../../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

/** POST: add a confirmed booking to the live queue (patient showed up). Staff only. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(_request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: reqRow, error: fetchError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !reqRow) {
    return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
  }
  const req = reqRow as DbBookingRequest;
  if (req.status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed bookings can be added to the queue" },
      { status: 400 }
    );
  }

  // Always link patient_user_id (account holder)
  const patientUserId = req.patient_user_id;
  // For dependent/beneficiary, do NOT use walk_in fields. Only use for true walk-ins.
  // For queue_items, keep walk_in_first_name/last_name null for both self and dependent bookings.
  const walkInFirstName = null;
  const walkInLastName = null;
  const appointmentAt =
    req.requested_date && req.requested_time
      ? new Date(`${req.requested_date}T${req.requested_time}`).toISOString()
      : req.requested_date
        ? new Date(`${req.requested_date}T00:00:00`).toISOString()
        : null;

  const queueItem = {
    ticket: req.reference_no,
    source: "booked" as const,
    priority: "normal" as const,
    status: "waiting",
    wait_time: "",
    department_id: req.department_id,
    patient_user_id: patientUserId,
    walk_in_first_name: walkInFirstName,
    walk_in_last_name: walkInLastName,
    walk_in_age_years: null,
    walk_in_sex: null,
    walk_in_phone: null,
    walk_in_email: null,
    booking_request_id: req.id,
    assigned_doctor_id: req.preferred_doctor_id,
    appointment_at: appointmentAt,
    added_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from("queue_items").upsert(queueItem, {
    onConflict: "ticket",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ticket: req.reference_no });
}
