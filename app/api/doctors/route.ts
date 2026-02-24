import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";

/**
 * GET /api/doctors
 * Public: returns active doctors from staff_users (for booking "Preferred doctor").
 * Query: ?department=OB-GYN to filter by department.
 * Returns: [{ id, name, department, displayLabel }] where displayLabel is "Dr. Name - Department".
 */
export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department")?.trim() || null;

  let departmentId: string | null = null;
  if (department) {
    const { data: dept, error: deptErr } = await supabase
      .from("departments")
      .select("id")
      .eq("name", department)
      .maybeSingle();
    if (deptErr) return NextResponse.json({ error: deptErr.message }, { status: 500 });
    departmentId = (dept?.id as string | undefined) ?? null;
    if (!departmentId) return NextResponse.json([]);
  }

  let q = supabase
    .from("staff_users")
    .select("id, first_name, last_name, department_id, departments(name)")
    .eq("role", "doctor")
    .eq("status", "active")
    .order("first_name");

  if (departmentId) {
    q = q.eq("department_id", departmentId);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type DoctorRow = { id: string; first_name: string; last_name: string; departments?: { name: string } | null };
  const rows = (data ?? []) as unknown as DoctorRow[];
  const list = rows.map((r) => {
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Doctor";
    const dept = r.departments?.name ?? "";
    const displayLabel = dept ? `Dr. ${name} - ${dept}` : `Dr. ${name}`;
    return {
      id: r.id,
      name,
      department: dept || null,
      displayLabel,
    };
  });

  return NextResponse.json(list);
}
