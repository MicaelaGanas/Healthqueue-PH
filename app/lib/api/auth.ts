import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../supabase/server";

export type StaffRole = "admin" | "nurse" | "doctor" | "receptionist" | "laboratory";

/** Display label for navbar/title by role */
export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administrator",
  nurse: "Nurse",
  doctor: "Doctor",
  receptionist: "Receptionist",
  laboratory: "Laboratory",
};

export type Staff = {
  id: string;
  email: string;
  role: StaffRole;
  name: string;
  employeeId: string;
  /** Staff's assigned department name (nurse/receptionist see only this department's data). */
  department: string | null;
  /** Staff's department id for filtering. */
  departmentId: string | null;
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
    .select("id, first_name, last_name, email, role, status, employee_id, department_id")
    .ilike("email", user.email)
    .maybeSingle();

  if (!staff || staff.status !== "active") return null;
  const name = [staff.first_name, staff.last_name].filter(Boolean).join(" ").trim() || "Staff";
  let departmentName: string | null = null;
  if (staff.department_id) {
    const { data: dept } = await supabase.from("departments").select("name").eq("id", staff.department_id).maybeSingle();
    departmentName = dept?.name ?? null;
  }
  return {
    id: staff.id,
    email: staff.email,
    role: staff.role as StaffRole,
    name,
    employeeId: staff.employee_id,
    department: departmentName,
    departmentId: staff.department_id ?? null,
  };
}

/** Require at least one of the given roles. Returns NextResponse with 401/403 if not allowed. */
export function requireRoles(allowedRoles: StaffRole[]) {
  return async (request: Request): Promise<{ staff: Staff } | Response> => {
    const staff = await getStaffFromRequest(request);
    if (!staff) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Sign in again or ensure your staff account is active and has access.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!allowedRoles.includes(staff.role)) {
      return new Response(
        JSON.stringify({
          error: "Forbidden. Only administrators can perform this action.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return { staff };
  };
}
