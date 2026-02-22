import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import { requireRoles } from "../../../../lib/api/auth";

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
  if (body.name !== undefined) update.name = body.name;
  if (body.email !== undefined) update.email = body.email;
  if (body.role !== undefined) update.role = body.role;
  if (body.status !== undefined) update.status = body.status;
  if (body.department !== undefined) update.department = body.department && String(body.department).trim() ? String(body.department).trim() : null;
  // employeeId is intentionally ignored - it cannot be changed after creation
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }
  const { error } = await supabase
    .from("admin_users")
    .update(update)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
