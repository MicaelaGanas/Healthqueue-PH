export const DEFAULT_SLOT_INTERVAL_MINUTES = 30;

export const BOOKING_DAY_WINDOWS_24: Array<{ start: string; end: string }> = [
  { start: "08:00", end: "11:30" },
  { start: "13:00", end: "17:00" },
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizeSlotIntervalMinutes(input: number | null | undefined): number {
  const raw = Number(input);
  if (!Number.isFinite(raw)) return DEFAULT_SLOT_INTERVAL_MINUTES;
  const clamped = Math.max(5, Math.min(60, Math.round(raw)));
  const snappedToFive = Math.round(clamped / 5) * 5;
  return snappedToFive;
}

/**
 * Generate appointment slots for a day using the configured interval.
 * Keeps existing clinic windows (morning + afternoon up to 5:00 PM) while supporting non-30-minute intervals.
 */
export function generateTimeSlots24(intervalMinutes: number): string[] {
  const interval = normalizeSlotIntervalMinutes(intervalMinutes);
  const slots: string[] = [];

  for (const window of BOOKING_DAY_WINDOWS_24) {
    const start = toMinutes(window.start);
    const end = toMinutes(window.end);
    for (let minute = start; minute <= end; minute += interval) {
      slots.push(toHHMM(minute));
    }
  }

  return slots;
}

export function toYYYYMMDDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYYYYMMDDLocal(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Monday-based week start in YYYY-MM-DD. */
export function getWeekStartYYYYMMDD(input: Date | string): string {
  const date = typeof input === "string" ? parseYYYYMMDDLocal(input) : new Date(input);
  if (!date || Number.isNaN(date.getTime())) return "";
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return toYYYYMMDDLocal(d);
}

export function compareYmd(a: string, b: string): number {
  return a.localeCompare(b);
}

export function addDaysYmd(dateYmd: string, days: number): string {
  const d = parseYYYYMMDDLocal(dateYmd);
  if (!d) return dateYmd;
  d.setDate(d.getDate() + days);
  return toYYYYMMDDLocal(d);
}
