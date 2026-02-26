import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import {
  estimateWaitMinutesFromPosition,
  formatEstimatedWaitFromMinutes,
  getRollingAverageConsultationMinutes,
} from "../../../lib/queue/eta";

/** Statuses that mean "patient is currently being seen". DB stores in_consultation; UI may use "in progress". */
const NOW_SERVING_STATUSES = ["in consultation", "in_consultation", "in progress", "called"];

/** GET: public live queue summary by department. No auth. Query ?date=YYYY-MM-DD for a specific day. */
export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date")?.trim().slice(0, 10);
  const effectiveDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : new Date().toISOString().slice(0, 10);

  const [deptRes, queueRes] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("queue_items")
      .select("ticket, status, wait_time, added_at, appointment_at, departments(name)"),
  ]);

  if (deptRes.error) {
    console.error("landing live-queue departments error:", deptRes.error);
    return NextResponse.json({ error: deptRes.error.message }, { status: 500 });
  }
  if (queueRes.error) {
    console.error("landing live-queue queue_rows error:", queueRes.error);
    return NextResponse.json({ error: queueRes.error.message }, { status: 500 });
  }

  const departments = (deptRes.data ?? []) as { id: string; name: string; sort_order: number }[];
  type Row = {
    ticket: string;
    status: string;
    wait_time: string | null;
    added_at: string | null;
    appointment_at: string | null;
    departments?: { name: string } | null;
  };
  const allRows = (queueRes.data ?? []) as unknown as Row[];

  const rows = allRows.filter((r) => {
    const apt = r.appointment_at ? new Date(r.appointment_at).toISOString().slice(0, 10) : "";
    const added = r.added_at ? new Date(r.added_at).toISOString().slice(0, 10) : "";
    return apt === effectiveDate || added === effectiveDate;
  });

  const byDept: Record<string, { waiting: number; nowServing: string | null }> = {};
  for (const d of departments) {
    byDept[d.name] = { waiting: 0, nowServing: null };
  }

  const avgMinutesByDepartmentName = new Map<string, number>();
  await Promise.all(
    departments.map(async (dept) => {
      const avg = await getRollingAverageConsultationMinutes(supabase, dept.id);
      avgMinutesByDepartmentName.set(dept.name, avg);
    })
  );

  for (const r of rows) {
    const status = (r.status ?? "").trim().toLowerCase();
    const dept = (r.departments?.name ?? "").trim() || "General";
    if (!byDept[dept]) byDept[dept] = { waiting: 0, nowServing: null };

    if (status === "completed") continue;

    const isInConsultation = NOW_SERVING_STATUSES.includes(status);
    if (!isInConsultation) {
      byDept[dept].waiting += 1;
    }
    if (!byDept[dept].nowServing && isInConsultation && r.ticket) {
      byDept[dept].nowServing = r.ticket;
    }
  }

  const result = departments.map((d) => {
    const stats = byDept[d.name] ?? { waiting: 0, nowServing: null };
    const waiting = stats.waiting;
    let waitTime = "—";
    if (waiting > 0) {
      const avgMinutes = avgMinutesByDepartmentName.get(d.name) ?? 10;
      const est = estimateWaitMinutesFromPosition(waiting, avgMinutes);
      waitTime = formatEstimatedWaitFromMinutes(est);
    }
    const status: "Normal" | "Busy" = waiting > 10 ? "Busy" : "Normal";
    return {
      name: d.name,
      waiting,
      waitTime,
      status,
      nowServing: stats.nowServing ?? null,
    };
  });

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    date: effectiveDate,
    departments: result,
  });
}
