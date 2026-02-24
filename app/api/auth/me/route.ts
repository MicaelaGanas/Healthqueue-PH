import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../../lib/supabase/server";

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <access_token> (Supabase session access_token).
 * Returns: { email, role, name, employeeId } from admin_users (matched by email), or 401/403.
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
  const [adminRes, staffRes] = await Promise.all([
    supabase.from("admin_users").select("id, first_name, last_name, email, role, status, employee_id, department_id").ilike("email", emailNorm).maybeSingle(),
    supabase.from("staff_users").select("id, first_name, last_name, email, role, status, employee_id, department_id").ilike("email", emailNorm).maybeSingle(),
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

  return NextResponse.json({
    email: staff.email,
    role: staff.role,
    name,
    employeeId: staff.employee_id,
    id: staff.id,
    department,
    departmentId: staff.department_id ?? null,
  });
}
