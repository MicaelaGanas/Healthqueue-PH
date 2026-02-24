import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireStaff = requireRoles(["admin", "nurse", "receptionist"]);

/** DELETE /api/booked/ref?referenceNo=APT-xxx — removes the booked entry from the queue (queue_rows by ticket). */
export async function DELETE(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const url = new URL(request.url);
  const referenceNo = url.searchParams.get("referenceNo");
  if (!referenceNo) {
    return NextResponse.json({ error: "Missing referenceNo" }, { status: 400 });
  }
  const { error } = await supabase
    .from("queue_items")
    .delete()
    .eq("ticket", referenceNo);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
