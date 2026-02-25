import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbVitalSign } from "../../lib/supabase/types";
import { getStaffFromRequest } from "../../lib/api/auth";

const requireStaff = async (request: Request) => {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return staff;
};

function toAppVital(r: DbVitalSign) {
  return {
    id: r.id,
    ticket: r.ticket,
    patientName: r.patient_name,
    department: r.department,
    systolic: r.systolic ?? undefined,
    diastolic: r.diastolic ?? undefined,
    heartRate: r.heart_rate ?? undefined,
    temperature: r.temperature ?? undefined,
    weight: r.weight ?? undefined,
    height: r.height ?? undefined,
    severity: r.severity ?? undefined,
    recordedAt: r.recorded_at,
    recordedBy: r.recorded_by ?? undefined,
  };
}

/** GET: list recorded vitals (for nurse/staff). Optional ?ticket= to filter by ticket. */
export async function GET(request: Request) {
  const staff = await requireStaff(request);
  if (staff instanceof Response) return staff;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const ticket = searchParams.get("ticket");

  let q = supabase
    .from("vital_signs")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (ticket) q = q.eq("ticket", ticket);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map((r: DbVitalSign) => toAppVital(r)));
}

/** POST: record vitals for a patient. */
export async function POST(request: Request) {
  const staff = await requireStaff(request);
  if (staff instanceof Response) return staff;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const ticket = body.ticket ?? body.referenceNo;
  const patientName = body.patientName ?? "";
  const department = body.department ?? "";
  if (!ticket || typeof patientName !== "string" || typeof department !== "string") {
    return NextResponse.json(
      { error: "Missing ticket, patientName, or department" },
      { status: 400 }
    );
  }

  const parseNum = (v: unknown): number | null =>
    v === null || v === undefined || v === "" ? null : Number(v);
  const parseDecimal = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const row = {
    ticket: String(ticket).trim(),
    patient_name: String(patientName).trim() || "Unknown",
    department: String(department).trim() || "General",
    systolic: parseNum(body.systolic),
    diastolic: parseNum(body.diastolic),
    heart_rate: parseNum(body.heartRate),
    temperature: parseDecimal(body.temperature),
    weight: parseDecimal(body.weight),
    height: parseDecimal(body.height),
    severity: body.severity && String(body.severity).trim() ? String(body.severity).trim() : null,
    recorded_by: staff.name ?? null,
  };

  const { data: inserted, error } = await supabase.from("vital_signs").insert(row).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(toAppVital(inserted as DbVitalSign));
}
