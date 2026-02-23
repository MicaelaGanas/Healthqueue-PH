import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

/** POST: record today's stats for ML. Body: { date, completedCount, bookedCount, waitingMax, urgentCount, inConsultationMax, staffActions, topDeptName, topDeptCount }. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const dateStr = typeof b.date === "string" ? b.date.trim().slice(0, 10) : null;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Missing or invalid date (YYYY-MM-DD)" }, { status: 400 });
  }

  const row = {
    date: dateStr,
    completed_count: typeof b.completedCount === "number" ? b.completedCount : 0,
    booked_count: typeof b.bookedCount === "number" ? b.bookedCount : 0,
    waiting_max: typeof b.waitingMax === "number" ? b.waitingMax : 0,
    urgent_count: typeof b.urgentCount === "number" ? b.urgentCount : 0,
    in_consultation_max: typeof b.inConsultationMax === "number" ? b.inConsultationMax : 0,
    staff_actions: typeof b.staffActions === "number" ? b.staffActions : 0,
    top_dept_name: typeof b.topDeptName === "string" ? b.topDeptName.slice(0, 100) : null,
    top_dept_count: typeof b.topDeptCount === "number" ? b.topDeptCount : 0,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("daily_insights_snapshots").upsert(row, {
    onConflict: "date",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("insights-snapshot upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, date: dateStr });
}
