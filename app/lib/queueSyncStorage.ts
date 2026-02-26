/**
 * Queue rows: in-memory sync between nurse and doctor dashboards.
 * Uses localStorage for persistence until backend is connected; then replace with API (see lib/api).
 */

export type QueueRowSync = {
  ticket: string;
  patientName: string;
  department: string;
  priority: string;
  status: string;
  waitTime: string;
  source: "booked" | "walk-in";
  addedAt?: string;
  appointmentTime?: string;
  assignedDoctor?: string;
  appointmentDate?: string;
  /** Walk-in only: age in years (queue_items.walk_in_age_years). */
  walkInAgeYears?: number | null;
  /** Walk-in only: gender (queue_items.walk_in_sex). */
  walkInGender?: string | null;
};

const QUEUE_ROWS_STORAGE_KEY = "healthqueue_queue_rows";

export function getQueueRowsFromStorage(): QueueRowSync[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_ROWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setQueueRowsInStorage(rows: QueueRowSync[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_ROWS_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

/** Update a single row's status in storage (for doctor "Start Consult" / "Complete"). */
export function updateQueueRowStatusInStorage(ticket: string, status: string): void {
  const rows = getQueueRowsFromStorage();
  const idx = rows.findIndex((r) => r.ticket === ticket);
  if (idx === -1) return;
  const next = [...rows];
  next[idx] = { ...next[idx], status };
  setQueueRowsInStorage(next);
}
