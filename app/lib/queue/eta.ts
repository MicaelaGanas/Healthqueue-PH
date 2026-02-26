import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_STATUSES = new Set(["waiting", "scheduled", "called", "in_consultation", "in consultation", "in progress"]);
const COMPLETED_STATUS = "completed";
const DEFAULT_AVG_MINUTES = 10;
const MIN_VALID_DURATION_MINUTES = 1;
const MAX_VALID_DURATION_MINUTES = 180;
const LOOKBACK_DAYS = 30;
const SAMPLE_LIMIT = 200;

export type QueueEtaRow = {
  ticket: string;
  status: string | null;
  appointment_at: string | null;
  added_at: string | null;
};

function normalizeStatus(status: string | null | undefined): string {
  const value = (status ?? "").trim().toLowerCase();
  if (value === "in progress") return "in_consultation";
  if (value === "in consultation") return "in_consultation";
  if (value === "no show") return "no_show";
  return value;
}

function toMinutes(startIso: string | null | undefined, endIso: string | null | undefined): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const mins = Math.round((end - start) / 60_000);
  if (mins < MIN_VALID_DURATION_MINUTES || mins > MAX_VALID_DURATION_MINUTES) return null;
  return mins;
}

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return Math.max(MIN_VALID_DURATION_MINUTES, Math.round(sum / numbers.length));
}

function sortQueueRows(a: QueueEtaRow, b: QueueEtaRow): number {
  const aPrimary = a.appointment_at ?? a.added_at ?? "";
  const bPrimary = b.appointment_at ?? b.added_at ?? "";
  if (aPrimary !== bPrimary) return aPrimary.localeCompare(bPrimary);
  const aAdded = a.added_at ?? "";
  const bAdded = b.added_at ?? "";
  if (aAdded !== bAdded) return aAdded.localeCompare(bAdded);
  return a.ticket.localeCompare(b.ticket);
}

export function formatEstimatedWaitFromMinutes(minutes: number): string {
  if (minutes <= 0) return "Now";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
  }
  return `${minutes} min`;
}

export function estimateWaitMinutesFromPosition(waitingAhead: number, avgConsultationMinutes: number): number {
  if (waitingAhead <= 0) return 0;
  return Math.max(0, Math.round(waitingAhead * avgConsultationMinutes));
}

export function getWaitingAheadForTicket(rows: QueueEtaRow[], ticket: string): number | null {
  const active = rows
    .filter((row) => ACTIVE_STATUSES.has(normalizeStatus(row.status)))
    .sort(sortQueueRows);
  const index = active.findIndex((row) => row.ticket === ticket);
  return index >= 0 ? index : null;
}

export async function getRollingAverageConsultationMinutes(
  supabase: SupabaseClient,
  departmentId: string | null | undefined,
  doctorId?: string | null
): Promise<number> {
  if (!departmentId) return DEFAULT_AVG_MINUTES;

  const sinceIso = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const fetchRows = async (assignedDoctorId: string | null | undefined) => {
    let query = supabase
      .from("queue_items")
      .select("consultation_started_at, consultation_completed_at")
      .eq("department_id", departmentId)
      .eq("status", COMPLETED_STATUS)
      .not("consultation_started_at", "is", null)
      .not("consultation_completed_at", "is", null)
      .gte("consultation_completed_at", sinceIso)
      .order("consultation_completed_at", { ascending: false })
      .limit(SAMPLE_LIMIT);

    if (assignedDoctorId) {
      query = query.eq("assigned_doctor_id", assignedDoctorId);
    }

    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [] as number[];

    return data
      .map((row) =>
        toMinutes(
          (row as { consultation_started_at?: string | null }).consultation_started_at,
          (row as { consultation_completed_at?: string | null }).consultation_completed_at
        )
      )
      .filter((value): value is number => value != null);
  };

  if (doctorId) {
    const doctorDurations = await fetchRows(doctorId);
    const doctorAverage = average(doctorDurations);
    if (doctorAverage != null) return doctorAverage;
  }

  const departmentDurations = await fetchRows(null);
  return average(departmentDurations) ?? DEFAULT_AVG_MINUTES;
}
