import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase/server";
import { ROLE_LABELS, type StaffRole } from "../../lib/api/auth";

/**
 * GET /api/staff-profile
 * Returns current staff profile for modal: id, email, role, name, first_name, last_name, employeeId, department, avatar_url.
 * Uses admin_users or staff_users (same as auth/me). Does not select avatar_url from DB so it works before migration.
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
  if (userError || !user?.email) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const emailNorm = user.email.trim().toLowerCase();
  const selectCols = "id, first_name, last_name, email, role, status, employee_id, department_id, avatar_url";
  const [adminRes, staffRes] = await Promise.all([
    supabase.from("admin_users").select(selectCols).ilike("email", emailNorm).maybeSingle(),
    supabase.from("staff_users").select(selectCols).ilike("email", emailNorm).maybeSingle(),
  ]);
  if (adminRes.error) return NextResponse.json({ error: adminRes.error.message }, { status: 500 });
  if (staffRes.error) return NextResponse.json({ error: staffRes.error.message }, { status: 500 });
  const staff = adminRes.data ?? staffRes.data ?? null;
  if (!staff || staff.status !== "active") {
    return NextResponse.json({ error: "No access; contact an administrator" }, { status: 403 });
  }

  const name = [staff.first_name, staff.last_name].filter(Boolean).join(" ").trim() || "Staff";
  let department: string | null = null;
  if (staff.department_id) {
    const { data: dept } = await supabase.from("departments").select("name").eq("id", staff.department_id).maybeSingle();
    department = dept?.name ?? null;
  }

  const row = staff as Record<string, unknown>;
  return NextResponse.json({
    id: staff.id,
    email: staff.email,
    role: staff.role,
    name,
    first_name: staff.first_name,
    last_name: staff.last_name,
    employeeId: staff.employee_id,
    department,
    departmentId: staff.department_id ?? null,
    avatar_url: row.avatar_url ?? null,
  });
}

/**
 * PATCH /api/staff-profile
 * Body: { avatar_url: string }
 * Updates only avatar_url for the current staff (staff_users or admin_users).
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
  if (userError || !user?.email) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const emailNorm = user.email.trim().toLowerCase();
  const [adminRes, staffRes] = await Promise.all([
    supabase.from("admin_users").select("id").ilike("email", emailNorm).maybeSingle(),
    supabase.from("staff_users").select("id").ilike("email", emailNorm).maybeSingle(),
  ]);
  const adminId = adminRes.data?.id;
  const staffId = staffRes.data?.id;
  const id = staffId ?? adminId;
  if (!id) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  let body: { avatar_url?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const avatar_url = body.avatar_url ?? null;

  const table = staffId ? "staff_users" : "admin_users";
  const { error } = await supabase
    .from(table)
    .update({ avatar_url })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ avatar_url });
}
