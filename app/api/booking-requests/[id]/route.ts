import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbBookingRequest } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

/** PATCH: confirm or reject a booking request (staff only). On confirm, only update status; patient appears in Booked queue (confirmed) until nurse confirms arrival (add-to-queue). */
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

  return NextResponse.json({ ok: true, status });
}
