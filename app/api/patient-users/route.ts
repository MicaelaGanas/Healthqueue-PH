import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbPatientUser } from "../../lib/supabase/types";

/**
 * POST /api/patient-users
 * Creates a patient_users row for the currently signed-up user.
 * Requires: Authorization: Bearer <access_token> (Supabase session after signUp).
 * Body: { first_name, last_name, date_of_birth, gender, number, address }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
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
  if (userError || !user?.id || !user?.email) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
  const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";
  const date_of_birth = typeof body.date_of_birth === "string" ? body.date_of_birth.trim() : "";
  const gender = typeof body.gender === "string" ? body.gender.trim() : "";
  const number = typeof body.number === "string" ? body.number.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (!first_name || !last_name || !date_of_birth || !gender || !number || !address) {
    return NextResponse.json(
      { error: "first_name, last_name, date_of_birth, gender, number, and address are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const created_at = new Date().toISOString();
  const row: DbPatientUser = {
    id: user.id,
    email: user.email,
    first_name,
    last_name,
    date_of_birth,
    gender,
    number,
    address,
    created_at,
  };

  const { error } = await supabase.from("patient_users").insert(row);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Profile already exists for this account" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: user.id });
}
