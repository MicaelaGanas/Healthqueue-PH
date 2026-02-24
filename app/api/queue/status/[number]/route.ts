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
  const statusMap: Record<string, "waiting" | "almost" | "proceed"> = {
    waiting: "waiting",
    called: "almost",
    "in progress": "almost",
    completed: "proceed",
  };
  return NextResponse.json({
    queueNumber: r.ticket,
    assignedDepartment: r.departments?.name ?? "—",
    estimatedWaitTime: r.wait_time ?? "—",
    status: statusMap[r.status] ?? "waiting",
  });
}
