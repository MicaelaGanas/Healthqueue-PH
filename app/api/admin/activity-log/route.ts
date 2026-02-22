import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

function toAppEntry(r: {
  id: string;
  staff_name: string;
  staff_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: unknown;
  created_at: string;
}) {
  return {
    id: r.id,
    staffName: r.staff_name,
    staffEmail: r.staff_email,
    action: r.action,
    entityType: r.entity_type ?? null,
    entityId: r.entity_id ?? null,
    details: r.details ?? {},
    createdAt: r.created_at,
  };
}

/** GET: list staff activity log entries. Query: date=YYYY-MM-DD (single day) or dateFrom&dateTo (range). Default: today. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date")?.trim();
  const dateFrom = searchParams.get("dateFrom")?.trim();
  const dateTo = searchParams.get("dateTo")?.trim();

  let start: string;
  let end: string;

  if (dateFrom && dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    start = `${dateFrom}T00:00:00.000Z`;
    const endDate = new Date(`${dateTo}T23:59:59.999Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    end = endDate.toISOString();
  } else {
    const d = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : new Date().toISOString().slice(0, 10);
    start = `${d}T00:00:00.000Z`;
    const endDate = new Date(start);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    end = endDate.toISOString();
  }

  const { data, error } = await supabase
    .from("staff_activity_log")
    .select("id, staff_name, staff_email, action, entity_type, entity_id, details, created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(toAppEntry));
}
