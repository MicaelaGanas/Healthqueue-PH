import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

function buildConsultationTimestampUpdate(
  previousStatus: string | null,
  nextStatus: string,
  existingStartedAt: string | null
): {
  consultation_started_at?: string | null;
  consultation_completed_at?: string | null;
} {
  const prev = (previousStatus ?? "").trim().toLowerCase();
  const next = (nextStatus ?? "").trim().toLowerCase();
  const nowIso = new Date().toISOString();

  if (next === "in_consultation") {
    if (prev !== "in_consultation") {
      return {
        consultation_started_at: nowIso,
        consultation_completed_at: null,
      };
    }
    return {};
  }

  if (next === "completed") {
    if (prev !== "completed") {
      return {
        consultation_started_at: existingStartedAt ?? nowIso,
        consultation_completed_at: nowIso,
      };
    }
    return {};
  }

  return {};
}

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
  const status = rawStatus === "no show" ? "no_show" : rawStatus === "in progress" ? "in_consultation" : rawStatus.trim();
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
