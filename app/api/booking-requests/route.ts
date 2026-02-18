import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbBookingRequest } from "../../lib/supabase/types";
import { getStaffFromRequest } from "../../lib/api/auth";

function generateReferenceNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `APT-${date}-${rand}`;
}

function toAppRequest(r: DbBookingRequest) {
  return {
    id: r.id,
    referenceNo: r.reference_no,
    patientUserId: r.patient_user_id,
    bookingType: r.booking_type,
    beneficiaryFirstName: r.beneficiary_first_name ?? undefined,
    beneficiaryLastName: r.beneficiary_last_name ?? undefined,
    beneficiaryDateOfBirth: r.beneficiary_date_of_birth ?? undefined,
    beneficiaryGender: r.beneficiary_gender ?? undefined,
    relationship: r.relationship ?? undefined,
    department: r.department,
    preferredDoctor: r.preferred_doctor ?? undefined,
    requestedDate: r.requested_date,
    requestedTime: r.requested_time,
    notes: r.notes ?? undefined,
    status: r.status,
    confirmedAt: r.confirmed_at ?? undefined,
    confirmedBy: r.confirmed_by ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** GET: list booking requests. Patient auth = own requests; staff auth = all (optional ?status=pending). */
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

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const staffAuth = await getStaffFromRequest(request);
  if (staffAuth) {
    let q = supabase.from("booking_requests").select("*").order("created_at", { ascending: false });
    if (statusFilter) q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map((r: DbBookingRequest) => toAppRequest(r)));
  }

  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("patient_user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let list = (data ?? []) as DbBookingRequest[];
  if (statusFilter) list = list.filter((r) => r.status === statusFilter);
  return NextResponse.json(list.map(toAppRequest));
}

/** POST: create a booking request (patient only). */
export async function POST(request: Request) {
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

  const patient = await supabase.from("patient_users").select("id").eq("id", user.id).maybeSingle();
  if (!patient?.data) {
    return NextResponse.json({ error: "Patient profile not found" }, { status: 403 });
  }

  const body = await request.json();
  const bookingType = body.bookingType === "dependent" ? "dependent" : "self";
  const department = (body.department ?? "").trim() || "General Medicine";
  const requestedDate = (body.requestedDate ?? "").trim();
  const requestedTime = (body.requestedTime ?? "").trim();
  if (!requestedDate || !requestedTime) {
    return NextResponse.json({ error: "Requested date and time are required" }, { status: 400 });
  }

  const referenceNo = generateReferenceNo();
  const row: Record<string, unknown> = {
    reference_no: referenceNo,
    patient_user_id: user.id,
    booking_type: bookingType,
    department,
    preferred_doctor: body.preferredDoctor?.trim() || null,
    requested_date: requestedDate,
    requested_time: requestedTime,
    notes: body.notes?.trim() || null,
    status: "pending",
  };

  if (bookingType === "dependent") {
    const bFirst = (body.beneficiaryFirstName ?? "").trim();
    const bLast = (body.beneficiaryLastName ?? "").trim();
    const bDob = (body.beneficiaryDateOfBirth ?? "").trim();
    const bGender = (body.beneficiaryGender ?? "").trim();
    const rel = ["child", "parent", "spouse", "other"].includes(body.relationship) ? body.relationship : null;
    if (!bFirst || !bLast || !bDob || !bGender) {
      return NextResponse.json({ error: "Beneficiary first name, last name, date of birth, and gender are required for dependent booking" }, { status: 400 });
    }
    row.beneficiary_first_name = bFirst;
    row.beneficiary_last_name = bLast;
    row.beneficiary_date_of_birth = bDob;
    row.beneficiary_gender = bGender;
    row.relationship = rel;
  } else {
    row.beneficiary_first_name = null;
    row.beneficiary_last_name = null;
    row.beneficiary_date_of_birth = null;
    row.beneficiary_gender = null;
    row.relationship = null;
  }

  const { data, error } = await supabase.from("booking_requests").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...toAppRequest(data as DbBookingRequest), referenceNo });
}
