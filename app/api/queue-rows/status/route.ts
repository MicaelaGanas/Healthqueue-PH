import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

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
  const status = rawStatus === "no show" ? "no_show" : rawStatus === "in progress" ? "in_consultation" : rawStatus.trim();
  const { error } = await supabase
    .from("queue_items")
    .update({ status })
    .eq("ticket", ticket);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
