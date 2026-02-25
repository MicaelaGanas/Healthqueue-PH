import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase/server";

/**
 * GET /api/profile
 * Returns the patient_users profile for the currently authenticated user, including avatar_url.
 * Requires: Authorization: Bearer <access_token> (Supabase session access_token).
 * Returns: { id, email, first_name, last_name, date_of_birth, gender, number, address, avatar_url } or 401/404.
 */
export async function GET(request: Request) {
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

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: patient, error } = await supabase
    .from("patient_users")
    .select("id, email, first_name, last_name, date_of_birth, gender, number, address, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const row = patient as Record<string, unknown>;
  return NextResponse.json({ ...patient, avatar_url: row.avatar_url ?? null });
}

/**
 * PATCH /api/profile
 * Updates the patient_users profile for the currently authenticated user.
 * Requires: Authorization: Bearer <access_token> (Supabase session access_token).
 * Body: { first_name, last_name, date_of_birth, gender, number, address, avatar_url }
 */
export async function PATCH(request: Request) {
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

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const updateFields = {
    first_name: body.first_name,
    last_name: body.last_name,
    date_of_birth: body.date_of_birth,
    gender: body.gender,
    number: body.number,
    address: body.address,
    avatar_url: body.avatar_url,
  };

  const { data: updated, error } = await supabase
    .from("patient_users")
    .update(updateFields)
    .eq("id", user.id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
  }

  return NextResponse.json(updated);
}
