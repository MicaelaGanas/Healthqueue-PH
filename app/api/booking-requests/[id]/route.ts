import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbBookingRequest } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

/** PATCH: confirm or reject a booking request (staff only). On confirm, add to queue_rows (source=booked). */
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

  const update: Record<string, unknown> = {
    status,
    confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    confirmed_by: status !== "pending" ? auth.staff.id : null,
    rejection_reason: status === "rejected" ? (body.rejectionReason ?? "").trim() || null : null,
  };

  const { error: updateError } = await supabase
    .from("booking_requests")
    .update(update)
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const actionName = status === "confirmed" ? "booking_confirmed" : status === "rejected" ? "booking_rejected" : "booking_cancelled";
  await supabase.from("staff_activity_log").insert({
    staff_id: auth.staff.id,
    staff_name: auth.staff.name ?? "Staff",
    staff_email: auth.staff.email ?? "",
    action: actionName,
    entity_type: "booking_request",
    entity_id: req.reference_no ?? id,
    details: { referenceNo: req.reference_no, status },
  });

  if (status === "confirmed") {
    let patientName: string;
    if (req.booking_type === "dependent" && req.beneficiary_first_name && req.beneficiary_last_name) {
      patientName = `${req.beneficiary_first_name} ${req.beneficiary_last_name}`.trim();
    } else if (req.patient_first_name != null || req.patient_last_name != null) {
      patientName = [req.patient_first_name ?? "", req.patient_last_name ?? ""].map((s) => String(s).trim()).filter(Boolean).join(" ") || "Patient";
    } else {
      const { data: patient } = await supabase
        .from("patient_users")
        .select("first_name, last_name")
        .eq("id", req.patient_user_id)
        .maybeSingle();
      patientName = patient
        ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Patient"
        : "Patient";
    }

    const preferred = (req.preferred_doctor ?? "").trim();
    const noPreference = !preferred || preferred === "—" || preferred.toLowerCase() === "no preference";
    let assignedDoctor: string | null = preferred && !noPreference ? preferred : null;
    if (noPreference && req.department) {
      const { data: doctors } = await supabase
        .from("admin_users")
        .select("name, department")
        .eq("role", "doctor")
        .eq("status", "active")
        .eq("department", req.department)
        .order("name", { ascending: true })
        .limit(1);
      const doc = doctors?.[0] as { name: string; department: string | null } | undefined;
      if (doc) {
        const dept = (doc.department ?? "").trim();
        assignedDoctor = dept ? `Dr. ${doc.name} - ${dept}` : `Dr. ${doc.name}`;
      }
    }

    const addedAt = new Date().toISOString();
    const queueRow = {
      ticket: req.reference_no,
      patient_name: patientName,
      department: req.department,
      priority: "normal",
      status: "scheduled",
      wait_time: "",
      source: "booked",
      added_at: addedAt,
      appointment_time: req.requested_time,
      assigned_doctor: assignedDoctor,
      appointment_date: req.requested_date ?? null,
    };
    const { error: insertQueueError } = await supabase.from("queue_rows").upsert(queueRow, {
      onConflict: "ticket",
    });
    if (insertQueueError) {
      return NextResponse.json({ error: "Confirmed but failed to add to queue: " + insertQueueError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, status });
}
