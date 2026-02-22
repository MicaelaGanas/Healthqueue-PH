import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import { requireRoles } from "../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

/** POST: record a staff action (e.g. walk_in_added, pending_cancelled, patient_removed_from_queue). */
export async function POST(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const body = await request.json();
  const action = (body.action ?? "").trim();
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }
  const entityType = (body.entityType ?? "").trim() || null;
  const entityId = (body.entityId ?? "").trim() || null;
  const details = body.details != null && typeof body.details === "object" ? body.details : {};

  const row = {
    staff_id: auth.staff.id,
    staff_name: auth.staff.name ?? "Staff",
    staff_email: auth.staff.email ?? "",
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  };
  const { error } = await supabase.from("staff_activity_log").insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
