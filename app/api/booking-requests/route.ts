import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbBookingRequest } from "../../lib/supabase/types";
import { getStaffFromRequest } from "../../lib/api/auth";
import {
  compareYmd,
  generateTimeSlots24,
  getWeekStartYYYYMMDD,
  normalizeSlotIntervalMinutes,
  toYYYYMMDDLocal,
} from "../../lib/departmentBooking";

function generateReferenceNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `APT-${date}-${rand}`;
}

type BookingRequestRow = DbBookingRequest & {
  departments?: { name: string } | null;
  preferred_doctor?: { first_name: string; last_name: string } | null;
};

function toAppRequest(r: BookingRequestRow) {
  const departmentName = r.departments?.name ?? undefined;
  const preferredDoctorName =
    r.preferred_doctor?.first_name && r.preferred_doctor?.last_name
      ? `${r.preferred_doctor.first_name} ${r.preferred_doctor.last_name}`
      : undefined;
  return {
    id: r.id,
    referenceNo: r.reference_no,
    patientUserId: r.patient_user_id,
    bookingType: r.booking_type,
    patientFirstName: r.patient_first_name ?? undefined,
    patientLastName: r.patient_last_name ?? undefined,
    contactPhone: r.contact_phone ?? undefined,
    contactEmail: r.contact_email ?? undefined,
    beneficiaryFirstName: r.beneficiary_first_name ?? undefined,
    beneficiaryLastName: r.beneficiary_last_name ?? undefined,
    beneficiaryDateOfBirth: r.beneficiary_date_of_birth ?? undefined,
    beneficiaryGender: r.beneficiary_gender ?? undefined,
    relationship: r.relationship ?? undefined,
    department: departmentName,
    departmentId: r.department_id,
    preferredDoctor: preferredDoctorName ?? undefined,
    preferredDoctorId: r.preferred_doctor_id ?? undefined,
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
  const selectWithJoins = "*, departments(name), preferred_doctor:staff_users!booking_requests_preferred_doctor_id_fkey(first_name, last_name)";
  if (staffAuth) {
    let q = supabase.from("booking_requests").select(selectWithJoins).order("created_at", { ascending: false });
    if (statusFilter) q = q.eq("status", statusFilter);
    if (["nurse", "receptionist"].includes(staffAuth.role) && staffAuth.departmentId) {
      q = q.eq("department_id", staffAuth.departmentId);
    }
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(((data ?? []) as unknown as BookingRequestRow[]).map(toAppRequest));
  }

  const { data, error } = await supabase
    .from("booking_requests")
    .select(selectWithJoins)
    .eq("patient_user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let list = (data ?? []) as unknown as BookingRequestRow[];
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
  const departmentName = (body.department ?? "").trim() || "General Medicine";
  const requestedDate = (body.requestedDate ?? "").trim();
  const requestedTime = (body.requestedTime ?? "").trim();
  if (!requestedDate || !requestedTime) {
    return NextResponse.json({ error: "Requested date and time are required" }, { status: 400 });
  }

  const { data: dept } = await supabase
    .from("departments")
    .select("id, default_slot_interval_minutes")
    .eq("name", departmentName)
    .eq("is_active", true)
    .maybeSingle();
  if (!dept?.id) {
    return NextResponse.json({ error: `Department "${departmentName}" not found` }, { status: 400 });
  }
  const departmentId = dept.id as string;

  const requestedWeekStart = getWeekStartYYYYMMDD(requestedDate);
  const currentWeekStart = getWeekStartYYYYMMDD(toYYYYMMDDLocal(new Date()));
  const { data: weekSetup } = await supabase
    .from("department_booking_weeks")
    .select("slot_interval_minutes, is_open")
    .eq("department_id", departmentId)
    .eq("week_start_date", requestedWeekStart)
    .maybeSingle();

  const isFutureWeek = compareYmd(requestedWeekStart, currentWeekStart) > 0;
  if (isFutureWeek && (!weekSetup || weekSetup.is_open !== true)) {
    return NextResponse.json(
      {
        error:
          "This department is not yet available for the selected week. Please choose another date or contact the clinic.",
      },
      { status: 409 }
    );
  }

  const slotIntervalMinutes = normalizeSlotIntervalMinutes(
    weekSetup?.slot_interval_minutes ?? dept.default_slot_interval_minutes ?? 30
  );
  const validSlots = generateTimeSlots24(slotIntervalMinutes);
  if (!validSlots.includes(requestedTime)) {
    return NextResponse.json(
      {
        error: `Selected time is not valid for this department schedule (${slotIntervalMinutes}-minute interval).`,
      },
      { status: 400 }
    );
  }

  let preferredDoctorId: string | null = null;
  const preferredDoctor = body.preferredDoctor?.trim();
  if (preferredDoctor) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(preferredDoctor)) {
      preferredDoctorId = preferredDoctor;
    } else {
      const clean = preferredDoctor.replace(/^Dr\.\s*/i, "").replace(/\s*-\s*.*$/, "").trim();
      const parts = clean.split(" ");
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ");
      if (firstName) {
        let q = supabase.from("staff_users").select("id").eq("role", "doctor").eq("status", "active").eq("first_name", firstName);
        if (lastName) q = q.eq("last_name", lastName);
        const { data: doc } = await q.maybeSingle();
        preferredDoctorId = (doc?.id as string | undefined) ?? null;
      }
    }
  }

  const referenceNo = generateReferenceNo();
  const row: Record<string, unknown> = {
    reference_no: referenceNo,
    patient_user_id: user.id,
    booking_type: bookingType,
    department_id: departmentId,
    preferred_doctor_id: preferredDoctorId,
    requested_date: requestedDate,
    requested_time: requestedTime,
    notes: body.notes?.trim() || null,
    status: "pending",
  };

  const contactFirst = (body.firstName ?? "").trim();
  const contactLast = (body.lastName ?? "").trim();
  const contactPhone = (body.phone ?? "").trim();
  const contactEmail = (body.email ?? "").trim();

  if (bookingType === "self") {
    if (contactFirst || contactLast) {
      row.patient_first_name = contactFirst || null;
      row.patient_last_name = contactLast || null;
    } else {
      const { data: profile } = await supabase
        .from("patient_users")
        .select("first_name, last_name, number, email")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        row.patient_first_name = (profile.first_name ?? "").trim() || null;
        row.patient_last_name = (profile.last_name ?? "").trim() || null;
      }
    }
    row.contact_phone = contactPhone || null;
    row.contact_email = contactEmail || null;
  }

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
    row.patient_first_name = contactFirst || null;
    row.patient_last_name = contactLast || null;
    row.contact_phone = contactPhone || null;
    row.contact_email = contactEmail || null;
  }

  const { data, error } = await supabase.from("booking_requests").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...toAppRequest(data as DbBookingRequest), referenceNo });
}
