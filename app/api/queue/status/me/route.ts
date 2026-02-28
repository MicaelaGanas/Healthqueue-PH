import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import {
  ACTIVE_QUEUE_DB_STATUSES,
  estimateWaitMinutesFromPosition,
  formatEstimatedWaitFromMinutes,
  getRollingAverageConsultationMinutes,
  getWaitingAheadForTicket,
  type QueueEtaRow,
} from "../../../../lib/queue/eta";

const ETA_ACTIVE_STATUSES = new Set(ACTIVE_QUEUE_DB_STATUSES);

/** Format ISO timestamp to YYYY-MM-DD in local time (avoids UTC date shift for UTC+x timezones). */
function toLocalDateStr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today as YYYY-MM-DD in local time (for filtering bookings). */
function getTodayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * GET /api/queue/status/me
 * Returns the logged-in patient's active queue entry (if any).
 * Uses confirmed booking_requests to find reference_no, then queue_rows by ticket.
 * Auth: Bearer token (patient).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabaseAuth = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user?.id) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const today = getTodayLocal();

  const { data: bookings } = await supabase
    .from("booking_requests")
    .select("reference_no, requested_date, department_id, departments(name)")
    .eq("patient_user_id", user.id)
    .eq("status", "confirmed")
    .gte("requested_date", today)
    .order("requested_date", { ascending: true })
    .limit(1);

  const firstBooking = bookings?.[0] as { reference_no: string; requested_date?: string; departments?: { name: string } | null } | undefined;
  const ref = firstBooking?.reference_no;
  if (!ref) {
    return NextResponse.json(null);
  }

  const { data: row, error } = await supabase
    .from("queue_items")
    .select("ticket, status, wait_time, appointment_at, added_at, department_id, assigned_doctor_id, departments(name)")
    .eq("ticket", ref)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // In queue: return live status (if waiting/scheduled and no vitals yet, patient is awaiting_triage). Use same statusMap as /api/queue/status/[number] for consistent API.
  if (row) {
    type Row = {
      ticket: string;
      status: string;
      wait_time: string | null;
      appointment_at: string | null;
      department_id: string | null;
      assigned_doctor_id: string | null;
      departments?: { name: string } | null;
    };
    const r = row as unknown as Row;
    const appointmentDate = toLocalDateStr(r.appointment_at);
    const appointmentTime = r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null;
    const raw = (r.status || "").toLowerCase().trim();
    let estimatedWaitTime = r.wait_time ?? "";

    if (ETA_ACTIVE_STATUSES.has(raw) && r.department_id) {
      const { data: sameDepartmentRows, error: sameDepartmentRowsError } = await supabase
        .from("queue_items")
        .select("ticket, status, appointment_at, added_at")
        .eq("department_id", r.department_id)
        .in("status", [...ACTIVE_QUEUE_DB_STATUSES]);

      if (!sameDepartmentRowsError && Array.isArray(sameDepartmentRows)) {
        const queueRows = sameDepartmentRows as QueueEtaRow[];
        const waitingAhead = getWaitingAheadForTicket(queueRows, r.ticket);
        if (waitingAhead != null) {
          const avgMinutes = await getRollingAverageConsultationMinutes(
            supabase,
            r.department_id,
            r.assigned_doctor_id
          );
          const estimatedMinutes = estimateWaitMinutesFromPosition(waitingAhead, avgMinutes);
          estimatedWaitTime = formatEstimatedWaitFromMinutes(estimatedMinutes);
        }
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

    let status: string;
    if (raw === "waiting" || raw === "scheduled") {
      const { data: vitalsRow, error: vitalsError } = await supabase
        .from("vital_signs")
        .select("ticket")
        .eq("ticket", r.ticket)
        .limit(1)
        .maybeSingle();
      if (vitalsError) {
        return NextResponse.json({ error: vitalsError.message }, { status: 500 });
      }
      if (!vitalsRow) {
        status = "awaiting_triage";
      } else {
        status = statusMap[raw] ?? "waiting";
      }
    } else {
      status = statusMap[raw] ?? "waiting";
    }

    return NextResponse.json({
      queueNumber: r.ticket,
      department: r.departments?.name ?? "—",
      status,
      waitTime: estimatedWaitTime,
      appointmentDate,
      appointmentTime,
    });
  }

  // Confirmed booking but not in queue yet (patient should check in at desk)
  const appointmentDate = firstBooking.requested_date ?? null;
  const departmentName = firstBooking.departments?.name ?? "—";
  return NextResponse.json({
    queueNumber: ref,
    department: departmentName,
    status: "confirmed",
    waitTime: "",
    appointmentDate,
    appointmentTime: null,
  });
}
