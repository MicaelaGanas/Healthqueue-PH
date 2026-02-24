import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";

/** GET /api/queue/status/[number] – public queue status by ticket or reference number */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const number = (await params).number;
  if (!number) {
    return NextResponse.json({ error: "Missing queue number" }, { status: 400 });
  }
  const decoded = decodeURIComponent(number).trim();

  const { data: row, error } = await supabase
    .from("queue_items")
    .select("ticket, status, wait_time, departments(name)")
    .eq("ticket", decoded)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json(null);
  }

  type Row = { ticket: string; status: string; wait_time: string | null; departments?: { name: string } | null };
  const r = row as unknown as Row;
  const raw = (r.status || "").toLowerCase().trim();
  // Map DB values to statuses the patient progress UI expects (so steps update when staff change status in Supabase)
  const statusMap: Record<string, string> = {
    waiting: "waiting",
    scheduled: "waiting",
    called: "almost",
    "in progress": "almost",
    in_consultation: "proceed", // DB stores in_consultation when staff set "With doctor"
    completed: "completed",
    cancelled: "completed",
    no_show: "completed",
  };
  return NextResponse.json({
    queueNumber: r.ticket,
    assignedDepartment: r.departments?.name ?? "—",
    estimatedWaitTime: r.wait_time ?? "—",
    status: statusMap[raw] ?? "waiting",
  });
}
