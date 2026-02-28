import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import { requireRoles } from "../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

function toAppPending(r: {
  id: string;
  first_name: string;
  last_name: string;
  age: string;
  sex: string;
  phone: string | null;
  email: string | null;
  symptoms: unknown;
  other_symptoms: string | null;
  registered_at: string;
  created_at: string | null;
}) {
  const symptoms = Array.isArray(r.symptoms) ? r.symptoms : [];
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    age: r.age,
    sex: r.sex,
    phone: r.phone ?? "",
    email: r.email ?? "",
    symptoms: symptoms as string[],
    otherSymptoms: r.other_symptoms ?? "",
    registeredAt: r.registered_at,
    createdAt: r.created_at ?? null,
  };
}

/** GET: list all pending walk-ins (staff only). */
export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("pending_walk_ins")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(toAppPending));
}

/** POST: register a new pending walk-in (staff only). */
export async function POST(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const body = await request.json();
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const age = (body.age ?? "").trim();
  const sex = (body.sex ?? "").trim();
  if (!firstName || !lastName || !age || !sex) {
    return NextResponse.json(
      { error: "First name, last name, age, and sex are required" },
      { status: 400 }
    );
  }
  const symptoms = Array.isArray(body.symptoms) ? body.symptoms : [];
  const row = {
    first_name: firstName,
    last_name: lastName,
    age,
    sex,
    phone: (body.phone ?? "").trim() || null,
    email: (body.email ?? "").trim() || null,
    symptoms,
    other_symptoms: (body.otherSymptoms ?? "").trim() || null,
    registered_at: body.registeredAt ?? new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) + " " + new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
  };
  const { data, error } = await supabase
    .from("pending_walk_ins")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(toAppPending(data));
}
