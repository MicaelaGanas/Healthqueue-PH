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

  // In queue: return live status (if status is waiting/scheduled and no vitals yet, patient is awaiting_triage)
  if (row) {
    type Row = { ticket: string; status: string; wait_time: string | null; departments?: { name: string } | null };
    const r = row as unknown as Row;
    const raw = (r.status || "").toLowerCase().trim();

    // Patient in queue but not yet checked for triage/vitals
    if (raw === "waiting" || raw === "scheduled") {
      const { data: vitalsRow } = await supabase
        .from("vital_signs")
        .select("ticket")
        .eq("ticket", r.ticket)
        .limit(1)
        .maybeSingle();
      if (!vitalsRow) {
        return NextResponse.json({
          queueNumber: r.ticket,
          assignedDepartment: r.departments?.name ?? "—",
          estimatedWaitTime: r.wait_time ?? "—",
          status: "awaiting_triage",
        });
      }
    }

    const statusMap: Record<string, string> = {
      waiting: "waiting",
      scheduled: "waiting",
      called: "almost",
      "in progress": "almost",
      in_consultation: "proceed",
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

  // Not in queue yet: if it's a confirmed booking, return "confirmed" so patient sees appointment and "check in when you arrive"
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("reference_no, department_id, departments(name)")
    .eq("reference_no", decoded)
    .eq("status", "confirmed")
    .maybeSingle();

  if (booking) {
    const b = booking as { reference_no: string; departments?: { name: string } | null };
    return NextResponse.json({
      queueNumber: b.reference_no,
      assignedDepartment: b.departments?.name ?? "—",
      estimatedWaitTime: "",
      status: "confirmed",
    });
  }

  return NextResponse.json(null);
}
