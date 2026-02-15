import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";

/** PATCH body: { ticket: string, status: string } */
export async function PATCH(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  const ticket = body?.ticket;
  const status = body?.status;
  if (!ticket || typeof status !== "string") {
    return NextResponse.json(
      { error: "Missing ticket or status" },
      { status: 400 }
    );
  }
  const { error } = await supabase
    .from("queue_rows")
    .update({ status })
    .eq("ticket", ticket);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
