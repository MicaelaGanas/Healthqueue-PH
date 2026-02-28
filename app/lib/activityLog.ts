import type { SupabaseClient } from "@supabase/supabase-js";
import type { Staff } from "./api/auth";

type ActivityPayload = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

export async function recordStaffActivity(
  supabase: SupabaseClient,
  staff: Staff,
  payload: ActivityPayload
): Promise<void> {
  const row = {
    staff_id: staff.role === "admin" ? staff.id : null,
    staff_staff_id: staff.role === "admin" ? null : staff.id,
    staff_name: staff.name ?? "Staff",
    staff_email: staff.email ?? "",
    action: payload.action,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    details: payload.details ?? {},
  };

  const { error } = await supabase.from("staff_activity_log").insert(row);
  if (error) {
    console.error("staff activity log insert error:", error);
  }
}
