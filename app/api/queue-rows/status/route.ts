import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";
import { buildConsultationTimestampUpdate, normalizeQueueStatusForDb } from "../../../lib/queue/status";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

/** PATCH body: { ticket: string, status: string } */
export async function PATCH(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  const ticket = body?.ticket;
  const rawStatus = body?.status;
  if (!ticket || typeof rawStatus !== "string") {
    return NextResponse.json(
      { error: "Missing ticket or status" },
      { status: 400 }
    );
  }
  const status = normalizeQueueStatusForDb(rawStatus);
  const { data: existingRow, error: existingError } = await supabase
    .from("queue_items")
    .select("status, consultation_started_at")
    .eq("ticket", ticket)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existingRow) {
    return NextResponse.json({ error: "Queue ticket not found" }, { status: 404 });
  }

  const timestampUpdate = buildConsultationTimestampUpdate(
    (existingRow as { status?: string | null }).status ?? null,
    status,
    (existingRow as { consultation_started_at?: string | null }).consultation_started_at ?? null
  );

  const { error } = await supabase
    .from("queue_items")
    .update({ status, ...timestampUpdate })
    .eq("ticket", ticket);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
