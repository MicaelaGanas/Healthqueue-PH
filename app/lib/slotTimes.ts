/**
 * Shared slot schedule for queue management and walk-in registration.
 * 30-minute slots from 08:00 to 18:00 (24h "HH:mm").
 */
export const SLOT_TIMES_24: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 17; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
  }
  out.push("18:00");
  return out;
})();

/** Format 24h "HH:mm" to 12h "9:00 AM" for display. */
export function formatSlotDisplay(t24: string): string {
  if (!t24 || !t24.includes(":")) return t24;
  const [h, m] = t24.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Get default slot: next 30-min from now, or 09:00 if in the past. */
export function getDefaultSlotNow(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const nextM = m < 30 ? 30 : 0;
  const nextH = m < 30 ? h : h + 1;
  if (nextH >= 18) return "17:30";
  return `${String(nextH).padStart(2, "0")}:${nextM === 0 ? "00" : "30"}`;
}
