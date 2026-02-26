/**
 * Shared date handling for queue, walk-in, booking, and reschedule.
 * All appointment dates use YYYY-MM-DD for storage and comparison.
 */

/** Today in YYYY-MM-DD. */
export function getTodayYYYYMMDD(): string {
  return toYYYYMMDD(new Date());
}

/** Format YYYY-MM-DD for display (e.g. "Wed, Feb 12, 2026" or "Today, Feb 12"). */
export function formatDateDisplay(dateStr: string, options?: { useTodayLabel?: boolean }): string {
  if (!dateStr || !dateStr.trim()) return "—";
  const d = parseAppointmentDate(dateStr);
  if (!d) return dateStr;
  const today = getTodayYYYYMMDD();
  const ymd = toYYYYMMDD(d);
  if (options?.useTodayLabel && ymd === today) {
    return "Today, " + d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }
  return d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** Parse date string (YYYY-MM-DD or M/D/YYYY, etc.) to Date. */
export function parseAppointmentDate(s: string): Date | null {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(t + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date to YYYY-MM-DD. */
export function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next N days (including today) as { value: YYYY-MM-DD, label: string }. */
export function getDateOptions(days = 7): { value: string; label: string }[] {
  const today = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ymd = toYYYYMMDD(d);
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
    options.push({ value: ymd, label });
  }
  return options;
}

/** Normalize any date string from forms to YYYY-MM-DD. */
export function normalizeToYYYYMMDD(s: string | undefined): string | undefined {
  if (!s || typeof s !== "string") return undefined;
  const d = parseAppointmentDate(s.trim());
  return d ? toYYYYMMDD(d) : undefined;
}
