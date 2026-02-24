import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbBookingRequest } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

/** PATCH: confirm or reject a booking request (staff only). On confirm, add to queue_items (source=booked). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const status = body.status;
  if (!["confirmed", "rejected", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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
  if (req.status !== "pending") {
    return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
  }

  const staffId = auth.staff.id;
  const { data: inAdmin } = await supabase.from("admin_users").select("id").eq("id", staffId).maybeSingle();
  const isAdminUser = !!inAdmin?.id;
  const update: Record<string, unknown> = {
    status,
    confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    confirmed_by: status !== "pending" && isAdminUser ? staffId : null,
    confirmed_by_staff_id: status !== "pending" && !isAdminUser ? staffId : null,
    rejection_reason: status === "rejected" ? (body.rejectionReason ?? "").trim() || null : null,
  };

  const { error: updateError } = await supabase
    .from("booking_requests")
    .update(update)
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const actionName = status === "confirmed" ? "booking_confirmed" : status === "rejected" ? "booking_rejected" : "booking_cancelled";
  await supabase.from("staff_activity_log").insert({
    staff_id: isAdminUser ? staffId : null,
    staff_staff_id: isAdminUser ? null : staffId,
    staff_name: auth.staff.name ?? "Staff",
    staff_email: auth.staff.email ?? "",
    action: actionName,
    entity_type: "booking_request",
    entity_id: req.reference_no ?? id,
    details: { referenceNo: req.reference_no, status },
  });

  if (status === "confirmed") {
    let patientUserId: string | null = null;
    let walkInFirstName: string | null = null;
    let walkInLastName: string | null = null;

    if (req.booking_type === "self") {
      patientUserId = req.patient_user_id;
    } else if (req.booking_type === "dependent") {
      walkInFirstName = req.beneficiary_first_name ?? null;
      walkInLastName = req.beneficiary_last_name ?? null;
    }

    const appointmentAt =
      req.requested_date && req.requested_time
        ? new Date(`${req.requested_date}T${req.requested_time}`).toISOString()
        : req.requested_date
          ? new Date(`${req.requested_date}T00:00:00`).toISOString()
          : null;

    // assigned_doctor_id omitted so insert works when queue_items.assigned_doctor_id references staff_users (not admin_users)
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
      assigned_doctor_id: null,
      appointment_at: appointmentAt,
      added_at: new Date().toISOString(),
    };
    const { error: insertQueueError } = await supabase.from("queue_items").upsert(queueItem, {
      onConflict: "ticket",
    });
    if (insertQueueError) {
      return NextResponse.json({ error: "Confirmed but failed to add to queue: " + insertQueueError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, status });
}
