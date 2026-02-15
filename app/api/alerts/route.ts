import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbAlert } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";

function toAppAlert(r: DbAlert) {
  return {
    id: r.id,
    type: r.type,
    icon: r.icon ?? "",
    detail: r.detail,
    time: r.time ?? "",
    unread: r.unread,
  };
}

const requireStaff = requireRoles(["admin", "nurse", "receptionist"]);

export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(toAppAlert));
}
