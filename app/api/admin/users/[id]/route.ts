import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import { requireRoles } from "../../../../lib/api/auth";
import { recordStaffActivity } from "../../../../lib/activityLog";

const requireAdmin = requireRoles(["admin"]);

// DELETE is intentionally not supported. User records are sensitive; use
// status (Deactivate/Activate) instead. Hard delete is not recommended for
// audit and compliance.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const body = await request.json();
  const update: Record<string, unknown> = {};

  const splitName = (s: string): { firstName: string; lastName: string } => {
    const clean = s.trim().replace(/\s+/g, " ");
    const parts = clean.split(" ");
    return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
  };

  if (body.firstName !== undefined) update.first_name = String(body.firstName).trim();
  if (body.lastName !== undefined) update.last_name = String(body.lastName).trim();
  if (body.name !== undefined && (update.first_name === undefined || update.last_name === undefined)) {
    const parsed = splitName(String(body.name));
    if (update.first_name === undefined) update.first_name = parsed.firstName;
    if (update.last_name === undefined) update.last_name = parsed.lastName;
  }
  if (body.email !== undefined) update.email = body.email;
  if (body.role !== undefined) update.role = body.role;
  if (body.status !== undefined) update.status = body.status;

  // department can be provided as departmentId (uuid) or department (name)
  if (body.departmentId !== undefined) {
    update.department_id = body.departmentId && String(body.departmentId).trim() ? String(body.departmentId).trim() : null;
  } else if (body.department !== undefined) {
    const deptName = body.department && String(body.department).trim() ? String(body.department).trim() : null;
    if (!deptName) {
      update.department_id = null;
    } else {
      const { data: dept, error: deptErr } = await supabase
        .from("departments")
        .select("id")
        .eq("name", deptName)
        .maybeSingle();
      if (deptErr) return NextResponse.json({ error: deptErr.message }, { status: 500 });
      update.department_id = (dept?.id as string | undefined) ?? null;
    }
  }
  // employeeId is intentionally ignored - it cannot be changed after creation
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }
  const { data: adminMatch } = await supabase.from("admin_users").select("id").eq("id", id).maybeSingle();
  const table = adminMatch ? "admin_users" : "staff_users";
  const { error } = await supabase.from(table).update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordStaffActivity(supabase, auth.staff, {
    action: body.status !== undefined ? "admin_user_status_changed" : "admin_user_updated",
    entityType: table === "admin_users" ? "admin_user" : "staff_user",
    entityId: id,
    details: {
      updatedFields: Object.keys(update),
      newStatus: body.status ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
