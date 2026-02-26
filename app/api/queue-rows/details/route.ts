import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

type QueueItemWithPatient = {
  ticket: string;
  walk_in_first_name: string | null;
  walk_in_last_name: string | null;
  walk_in_age_years: number | null;
  walk_in_sex: string | null;
  patient_users?: { first_name: string; last_name: string; date_of_birth: string; gender: string }[] | { first_name: string; last_name: string; date_of_birth: string; gender: string } | null;
  booking_requests?: {
    booking_type: "self" | "dependent";
    beneficiary_first_name: string | null;
    beneficiary_last_name: string | null;
    patient_first_name: string | null;
    patient_last_name: string | null;
    beneficiary_date_of_birth: string | null;
    beneficiary_gender: string | null;
  }[] | {
    booking_type: "self" | "dependent";
    beneficiary_first_name: string | null;
    beneficiary_last_name: string | null;
    patient_first_name: string | null;
    patient_last_name: string | null;
    beneficiary_date_of_birth: string | null;
    beneficiary_gender: string | null;
  } | null;
};

function normalizePatient(row: QueueItemWithPatient) {
  const patient = row.patient_users;
  if (Array.isArray(patient)) return patient[0] ?? null;
  return patient ?? null;
}

function normalizeBooking(row: QueueItemWithPatient) {
  const booking = row.booking_requests;
  if (Array.isArray(booking)) return booking[0] ?? null;
  return booking ?? null;
}

function parseDob(dob: string): Date | null {
  const clean = dob.trim();
  if (!clean) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const date = new Date(clean + "T12:00:00");
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeAgeYears(dob?: string | null): number | null {
  if (!dob) return null;
  const date = parseDob(dob);
  if (!date) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age < 0 ? null : age;
}

function resolvePatientName(row: QueueItemWithPatient): string {
  const patient = normalizePatient(row);
  const booking = normalizeBooking(row);
  const beneficiaryName = [booking?.beneficiary_first_name, booking?.beneficiary_last_name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .trim();
  if (booking?.booking_type === "dependent" && beneficiaryName) {
    return beneficiaryName;
  }
  const selfSnapshotName = [booking?.patient_first_name, booking?.patient_last_name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .trim();
  if (selfSnapshotName) {
    return selfSnapshotName;
  }
  if (patient?.first_name && patient?.last_name) {
    return `${patient.first_name} ${patient.last_name}`;
  }
  if (row.walk_in_first_name && row.walk_in_last_name) {
    return `${row.walk_in_first_name} ${row.walk_in_last_name}`;
  }
  return row.walk_in_first_name || patient?.first_name || "Unknown";
}

export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const ticket = searchParams.get("ticket");
  if (!ticket?.trim()) {
    return NextResponse.json({ error: "Missing ticket" }, { status: 400 });
  }

  const { data: queueItem, error } = await supabase
    .from("queue_items")
    .select("ticket, walk_in_first_name, walk_in_last_name, walk_in_age_years, walk_in_sex, patient_users(first_name, last_name, date_of_birth, gender), booking_requests(booking_type, beneficiary_first_name, beneficiary_last_name, patient_first_name, patient_last_name, beneficiary_date_of_birth, beneficiary_gender)")
    .eq("ticket", ticket.trim())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!queueItem) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const row = queueItem as QueueItemWithPatient;
  const patientName = resolvePatientName(row);
  const patient = normalizePatient(row);
  const booking = normalizeBooking(row);
  const useBeneficiary = booking?.booking_type === "dependent";
  const age = useBeneficiary
    ? computeAgeYears(booking?.beneficiary_date_of_birth ?? null)
    : patient?.date_of_birth
      ? computeAgeYears(patient.date_of_birth)
      : row.walk_in_age_years ?? null;
  const gender = useBeneficiary
    ? booking?.beneficiary_gender ?? null
    : patient?.gender ?? row.walk_in_sex ?? null;

  const { data: vitals, error: vitalsError } = await supabase
    .from("vital_signs")
    .select("systolic, diastolic, heart_rate, temperature, weight, height, recorded_at, recorded_by")
    .eq("ticket", ticket.trim())
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (vitalsError) {
    return NextResponse.json({ error: vitalsError.message }, { status: 500 });
  }

  return NextResponse.json({
    ticket: row.ticket,
    patientName,
    age,
    gender,
    vitals: vitals
      ? {
          systolic: vitals.systolic ?? null,
          diastolic: vitals.diastolic ?? null,
          heartRate: vitals.heart_rate ?? null,
          temperature: vitals.temperature ?? null,
          weight: vitals.weight ?? null,
          height: vitals.height ?? null,
          recordedAt: vitals.recorded_at ?? null,
          recordedBy: vitals.recorded_by ?? null,
        }
      : null,
  });
}
