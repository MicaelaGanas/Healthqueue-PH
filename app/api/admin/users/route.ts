import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbAdminUser, DbStaffUser } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

type DbAdminUserWithDept = DbAdminUser & { departments?: { name: string } | null };
type DbStaffUserWithDept = DbStaffUser & { departments?: { name: string } | null };

function toAppUser(r: DbAdminUserWithDept | DbStaffUserWithDept) {
  const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Staff";
  return {
    id: r.id,
    name,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? "",
    email: r.email,
    role: r.role,
    status: r.status,
    employeeId: r.employee_id,
    department: r.departments?.name ?? null,
    departmentId: r.department_id ?? null,
    createdAt: r.created_at,
  };
}

const requireAdmin = requireRoles(["admin"]);

function splitName(input: unknown): { firstName: string; lastName: string } | null {
  if (typeof input !== "string") return null;
  const s = input.trim().replace(/\s+/g, " ");
  if (!s) return null;
  const parts = s.split(" ");
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

async function resolveDepartmentId(
  supabase: ReturnType<typeof getSupabaseServer>,
  opts: { departmentId?: unknown; department?: unknown }
): Promise<string | null> {
  if (!supabase) return null;
  if (typeof opts.departmentId === "string" && opts.departmentId.trim()) return opts.departmentId.trim();
  if (typeof opts.department !== "string" || !opts.department.trim()) return null;
  const { data } = await supabase
    .from("departments")
    .select("id")
    .eq("name", opts.department.trim())
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const [adminRes, staffRes] = await Promise.all([
    supabase
      .from("admin_users")
      .select("id, first_name, last_name, email, role, status, employee_id, department_id, created_at, departments(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("staff_users")
      .select("id, first_name, last_name, email, role, status, employee_id, department_id, created_at, departments(name)")
      .order("created_at", { ascending: false }),
  ]);
  if (adminRes.error) return NextResponse.json({ error: adminRes.error.message }, { status: 500 });
  if (staffRes.error) return NextResponse.json({ error: staffRes.error.message }, { status: 500 });
  const adminRows = (adminRes.data ?? []) as unknown as DbAdminUserWithDept[];
  const staffRows = (staffRes.data ?? []) as unknown as DbStaffUserWithDept[];
  const combined = [...adminRows, ...staffRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json(combined.map(toAppUser));
}

async function generateNextEmployeeId(supabase: ReturnType<typeof getSupabaseServer>): Promise<string> {
  if (!supabase) throw new Error("Database not configured");
  const [adminRes, staffRes] = await Promise.all([
    supabase.from("admin_users").select("employee_id"),
    supabase.from("staff_users").select("employee_id"),
  ]);
  if (adminRes.error) throw new Error(`Failed to fetch admin employee IDs: ${adminRes.error.message}`);
  if (staffRes.error) throw new Error(`Failed to fetch staff employee IDs: ${staffRes.error.message}`);
  const existingNumbers: number[] = [];
  const empIdPattern = /^emp\s*-\s*(\d+)$/i;
  for (const row of [...(adminRes.data ?? []), ...(staffRes.data ?? [])]) {
    const match = (row as { employee_id?: string }).employee_id?.match(empIdPattern);
    if (match) existingNumbers.push(parseInt(match[1], 10));
  }
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `EMP - ${nextNumber.toString().padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { name, firstName, lastName, email, role, employeeId, password, status, department, departmentId } = body;

  // Validate required fields (employeeId is now optional and will be auto-generated)
  const parsed = splitName(typeof name === "string" ? name : `${firstName ?? ""} ${lastName ?? ""}`);
  const fn = typeof firstName === "string" && firstName.trim() ? firstName.trim() : parsed?.firstName ?? "";
  const ln = typeof lastName === "string" && lastName.trim() ? lastName.trim() : parsed?.lastName ?? "";
  if (!fn || !email || !role || !password) {
    return NextResponse.json(
      { error: "firstName/lastName (or name), email, role, and password are required" },
      { status: 400 }
    );
  }
  const roleNorm = String(role).trim().toLowerCase();
  const isAdmin = roleNorm === "admin";
  const staffRoles = ["nurse", "doctor", "receptionist", "laboratory"];
  if (isAdmin === false && !staffRoles.includes(roleNorm)) {
    return NextResponse.json(
      { error: `Role must be admin or one of: ${staffRoles.join(", ")}` },
      { status: 400 }
    );
  }

  const emailNorm = email.trim().toLowerCase();
  const [existingAdmin, existingStaff] = await Promise.all([
    supabase.from("admin_users").select("id, email").ilike("email", emailNorm).maybeSingle(),
    supabase.from("staff_users").select("id, email").ilike("email", emailNorm).maybeSingle(),
  ]);
  if (existingAdmin.data || existingStaff.data) {
    return NextResponse.json(
      { error: "User with this email already exists in the system" },
      { status: 409 }
    );
  }

  let finalEmployeeId: string;
  if (employeeId && employeeId.trim()) {
    finalEmployeeId = employeeId.trim();
    const [adminCheck, staffCheck] = await Promise.all([
      supabase.from("admin_users").select("employee_id").eq("employee_id", finalEmployeeId).maybeSingle(),
      supabase.from("staff_users").select("employee_id").eq("employee_id", finalEmployeeId).maybeSingle(),
    ]);
    if (adminCheck.error || staffCheck.error) {
      return NextResponse.json(
        { error: `Failed to check employee ID: ${adminCheck.error?.message ?? staffCheck.error?.message}` },
        { status: 500 }
      );
    }
    if (adminCheck.data || staffCheck.data) {
      return NextResponse.json(
        { error: `Employee ID "${finalEmployeeId}" already exists` },
        { status: 409 }
      );
    }
  } else {
    // Generate next available employee ID
    try {
      finalEmployeeId = await generateNextEmployeeId(supabase);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to generate employee ID" },
        { status: 500 }
      );
    }
  }

  // Create Supabase Auth user first
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Auth not configured" },
      { status: 503 }
    );
  }

  // Use Admin API to create user (requires service role key)
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Create the auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: password,
    email_confirm: true, // Auto-confirm email so they can login immediately
  });

  let authUserId: string | undefined;

  if (authError) {
    // Check if user already exists (error code or message)
    const errorMsg = authError.message?.toLowerCase() || "";
    const isDuplicate = errorMsg.includes("already registered") ||
                       errorMsg.includes("already exists") ||
                       errorMsg.includes("user already") ||
                       authError.status === 422; // 422 often indicates duplicate
    
    if (isDuplicate) {
      // Auth user already exists, but we've verified admin_users doesn't exist
      // So we can proceed to create the admin_users record
      // The existing auth user can be used for login
      console.log(`Auth user already exists for ${email.trim()}, proceeding to create admin_users record`);
    } else {
      // Other auth errors should be returned
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 400 }
      );
    }
  } else if (authData?.user) {
    authUserId = authData.user.id;
  }

  const deptId = await resolveDepartmentId(supabase, { departmentId, department });
  const table = isAdmin ? "admin_users" : "staff_users";
  const insertPayload = {
    first_name: fn,
    last_name: ln,
    email: email.trim(),
    role: role,
    status: status ?? "active",
    employee_id: finalEmployeeId,
    department_id: deptId,
  };

  const { data, error } = await supabase
    .from(table)
    .insert(insertPayload)
    .select("id, first_name, last_name, email, role, status, employee_id, department_id, created_at, departments(name)")
    .single();

  if (error) {
    if (authUserId && authData?.user && !authError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }
    if (error.code === "23505") {
      const isEmployeeIdError = error.message?.includes("employee_id");
      return NextResponse.json(
        { error: isEmployeeIdError ? "Employee ID already exists" : "User with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAppUser(data as unknown as DbAdminUserWithDept));
}
