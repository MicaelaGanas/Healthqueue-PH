import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";

/**
 * GET /api/doctors
 * Public: returns active doctors from admin_users (for booking "Preferred doctor").
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

  let q = supabase
    .from("admin_users")
    .select("id, name, department")
    .eq("role", "doctor")
    .eq("status", "active")
    .order("name");

  if (department) {
    q = q.eq("department", department);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []).map((r: { id: string; name: string; department: string | null }) => {
    const dept = r.department ?? "";
    const displayLabel = dept ? `Dr. ${r.name} - ${dept}` : `Dr. ${r.name}`;
    return {
      id: r.id,
      name: r.name,
      department: r.department ?? null,
      displayLabel,
    };
  });

  return NextResponse.json(list);
}
