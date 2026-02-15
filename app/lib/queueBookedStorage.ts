/**
 * Booked appointments. Public book flow writes here; nurse dashboard reads and merges into queue.
 * Uses localStorage until backend is connected; then replace with API (see lib/api).
 */

import { normalizeToYYYYMMDD } from "./schedule";

export const BOOKED_QUEUE_STORAGE_KEY = "healthqueue_booked_queue";

export type BookedQueueEntry = {
  referenceNo: string;
  patientName: string;
  department: string;
  /** 24h time e.g. "09:00" or "13:30" for queue sort */
  appointmentTime: string;
  addedAt: string;
  /** Preferred/assigned doctor (e.g. "Dr. Ana Reyes - OB-GYN") for queue filtering per doctor */
  preferredDoctor?: string;
  /** Appointment date e.g. "2026-02-04" or "2/4/2026" for filtering in Manage bookings */
  appointmentDate?: string;
};

export function getBookedQueueFromStorage(): BookedQueueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKED_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendBookedToStorage(entry: BookedQueueEntry): void {
  const list = getBookedQueueFromStorage();
  if (list.some((e) => e.referenceNo === entry.referenceNo)) return;
  const normalized: BookedQueueEntry = {
    ...entry,
    appointmentDate: entry.appointmentDate ? normalizeToYYYYMMDD(entry.appointmentDate) ?? entry.appointmentDate : undefined,
  };
  list.push(normalized);
  try {
    localStorage.setItem(BOOKED_QUEUE_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function removeBookedFromStorage(referenceNo: string): void {
  const list = getBookedQueueFromStorage().filter((e) => e.referenceNo !== referenceNo);
  try {
    localStorage.setItem(BOOKED_QUEUE_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** Parse time from book flow (e.g. "9:00 AM", "1:30 PM") to 24h "HH:mm" */
export function parseTimeTo24(timeStr: string): string {
  if (!timeStr || typeof timeStr !== "string") return "09:00";
  const t = timeStr.trim();
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(t)) return t.length === 4 ? "0" + t : t;
  return "09:00";
}

export function generateReferenceNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `APT-${date}-${rand}`;
}
