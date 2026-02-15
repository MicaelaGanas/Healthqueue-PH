import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../supabase/server";

export type StaffRole = "admin" | "nurse" | "doctor" | "receptionist";

export type Staff = {
  id: string;
  email: string;
  role: StaffRole;
  name: string;
  employeeId: string;
};

/**
 * Get current staff from request (Authorization: Bearer <token>).
 * Returns staff from admin_users (matched by auth user email) or null if invalid/missing.
 */
export async function getStaffFromRequest(request: Request): Promise<Staff | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabaseAuth = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  if (error || !user?.email) return null;

  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: staff } = await supabase
    .from("admin_users")
    .select("id, name, email, role, status, employee_id")
    .eq("email", user.email)
    .maybeSingle();

  if (!staff || staff.status !== "active") return null;
  return {
    id: staff.id,
    email: staff.email,
    role: staff.role as StaffRole,
    name: staff.name,
    employeeId: staff.employee_id,
  };
}

/** Require at least one of the given roles. Returns NextResponse with 401/403 if not allowed. */
export function requireRoles(allowedRoles: StaffRole[]) {
  return async (request: Request): Promise<{ staff: Staff } | Response> => {
    const staff = await getStaffFromRequest(request);
    if (!staff) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!allowedRoles.includes(staff.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return { staff };
  };
}
