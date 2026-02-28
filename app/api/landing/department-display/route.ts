import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import {
  estimateWaitMinutesFromPosition,
  formatEstimatedWaitFromMinutes,
  getRollingAverageConsultationMinutes,
} from "../../../lib/queue/eta";

const NOW_SERVING_STATUSES = new Set(["in consultation", "in_consultation", "in progress", "called"]);
const WAITING_STATUSES = new Set(["waiting", "scheduled", "called"]);
const HIDDEN_STATUSES = new Set(["completed", "no show", "no_show"]);

type QueueDisplayRow = {
  ticket: string;
  status: string;
  wait_time: string | null;
  added_at: string | null;
  appointment_at: string | null;
  departments?: { name: string } | null;
  staff_users?: { first_name: string; last_name: string } | null;
};

function sortRows(a: QueueDisplayRow, b: QueueDisplayRow) {
  const aTime = a.appointment_at ?? a.added_at ?? "";
  const bTime = b.appointment_at ?? b.added_at ?? "";
  return aTime.localeCompare(bTime);
}

function normalizeStatus(value: string | null | undefined): string {
  const status = (value ?? "").trim().toLowerCase();
  if (status === "in_consultation") return "in consultation";
  if (status === "no_show") return "no show";
  return status;
}

function pickDate(dateParam: string | null): string {
  const trimmed = dateParam?.trim().slice(0, 10) ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const department = (searchParams.get("department") ?? "").trim();
  if (!department) {
    return NextResponse.json({ error: "department is required" }, { status: 400 });
  }
  const date = pickDate(searchParams.get("date"));

  const { data, error } = await supabase
    .from("queue_items")
    .select("ticket, status, wait_time, added_at, appointment_at, departments(name), staff_users!queue_items_assigned_doctor_id_fkey(first_name, last_name)");

  if (error) {
    console.error("landing department-display error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as unknown as QueueDisplayRow[])
    .filter((row) => (row.departments?.name ?? "").trim() === department)
    .filter((row) => {
      const appointmentDate = row.appointment_at ? new Date(row.appointment_at).toISOString().slice(0, 10) : "";
      const addedDate = row.added_at ? new Date(row.added_at).toISOString().slice(0, 10) : "";
      return appointmentDate === date || addedDate === date;
    })
    .filter((row) => !HIDDEN_STATUSES.has(normalizeStatus(row.status)))
    .sort(sortRows);

  const nowServing = rows.find((row) => NOW_SERVING_STATUSES.has(normalizeStatus(row.status))) ?? null;
  const waitingRows = rows.filter((row) => WAITING_STATUSES.has(normalizeStatus(row.status)));
  const nextUp = waitingRows.find((row) => row.ticket !== nowServing?.ticket) ?? null;
  const waitingCount = waitingRows.length;

  const doctorOnDuty = nowServing?.staff_users
    ? `${nowServing.staff_users.first_name} ${nowServing.staff_users.last_name}`.trim()
    : nextUp?.staff_users
      ? `${nextUp.staff_users.first_name} ${nextUp.staff_users.last_name}`.trim()
      : null;

  const { data: departmentRow } = await supabase
    .from("departments")
    .select("id")
    .eq("name", department)
    .maybeSingle();

  const avgMinutes = await getRollingAverageConsultationMinutes(
    supabase,
    (departmentRow as { id?: string | null } | null)?.id ?? null,
    null
  );

  const offsetFromNowServing = nowServing ? 1 : 0;

  const upcoming = waitingRows
    .filter((row) => row.ticket !== nextUp?.ticket)
    .slice(0, 10)
    .map((row, index) => ({
      ticket: row.ticket,
      status: normalizeStatus(row.status),
      estimatedWait:
        row.wait_time?.trim() ||
        formatEstimatedWaitFromMinutes(
          estimateWaitMinutesFromPosition(offsetFromNowServing + index + 1, avgMinutes)
        ),
    }));

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    date,
    department,
    waitingCount,
    doctorOnDuty,
    nowServing: nowServing
      ? { ticket: nowServing.ticket, status: normalizeStatus(nowServing.status) }
      : null,
    nextUp: nextUp
      ? {
          ticket: nextUp.ticket,
          status: normalizeStatus(nextUp.status),
          estimatedWait:
            nextUp.wait_time?.trim() ||
            formatEstimatedWaitFromMinutes(
              estimateWaitMinutesFromPosition(offsetFromNowServing, avgMinutes)
            ),
        }
      : null,
    upcoming,
  });
}