import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbAdminUser } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

type DbAdminUserWithDept = DbAdminUser & { departments?: { name: string } | null };

function toAppUser(r: DbAdminUserWithDept) {
  const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Staff";
  return {
    id: r.id,
    name,
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
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, first_name, last_name, email, role, status, employee_id, department_id, created_at, departments(name)")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(((data ?? []) as unknown as DbAdminUserWithDept[]).map(toAppUser));
}

async function generateNextEmployeeId(supabase: ReturnType<typeof getSupabaseServer>): Promise<string> {
  if (!supabase) {
    throw new Error("Database not configured");
  }

  // Get all existing employee IDs
  const { data, error } = await supabase
    .from("admin_users")
    .select("employee_id");

  if (error) {
    throw new Error(`Failed to fetch existing employee IDs: ${error.message}`);
  }

  // Extract numbers from existing employee IDs with format "EMP - XXXX" (case-insensitive for compatibility)
  const existingNumbers: number[] = [];
  const empIdPattern = /^emp\s*-\s*(\d+)$/i;

  (data || []).forEach((user) => {
    const match = user.employee_id?.match(empIdPattern);
    if (match) {
      existingNumbers.push(parseInt(match[1], 10));
    }
  });

  // Find the next available number
  let nextNumber = 1;
  if (existingNumbers.length > 0) {
    const maxNumber = Math.max(...existingNumbers);
    nextNumber = maxNumber + 1;
  }

  // Generate employee ID with format "EMP - XXXX"
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

  // Check if admin_users record already exists
  const { data: existingAdminUser } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("email", email.trim())
    .maybeSingle();

  if (existingAdminUser) {
    return NextResponse.json(
      { error: "User with this email already exists in the system" },
      { status: 409 }
    );
  }

  // Auto-generate employee ID if not provided
  let finalEmployeeId: string;
  if (employeeId && employeeId.trim()) {
    finalEmployeeId = employeeId.trim();
    
    // Check if the provided employee ID already exists
    const { data: existing, error: checkError } = await supabase
      .from("admin_users")
      .select("employee_id")
      .eq("employee_id", finalEmployeeId)
      .maybeSingle();
    
    if (checkError) {
      return NextResponse.json(
        { error: `Failed to check employee ID: ${checkError.message}` },
        { status: 500 }
      );
    }
    
    if (existing) {
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

  // Create admin_users record
  const deptId = await resolveDepartmentId(supabase, { departmentId, department });
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      first_name: fn,
      last_name: ln,
      email: email.trim(),
      role: role,
      status: status ?? "active",
      employee_id: finalEmployeeId,
      department_id: deptId,
    })
    .select("id, first_name, last_name, email, role, status, employee_id, department_id, created_at, departments(name)")
    .single();

  if (error) {
    // If admin_users insert fails but auth user was created (not pre-existing), try to clean up
    if (authUserId && authData?.user && !authError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }
    
    // Check if it's a duplicate error (email or employee_id)
    if (error.code === "23505") {
      const isEmployeeIdError = error.message?.includes("employee_id") || error.message?.includes("unique_employee_id");
      return NextResponse.json(
        { error: isEmployeeIdError ? `Employee ID already exists` : "User with this email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAppUser(data as unknown as DbAdminUserWithDept));
}
