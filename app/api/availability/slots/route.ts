import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { parseTimeTo24 } from "../../../lib/queueBookedStorage";

/**
 * GET /api/availability/slots?date=YYYY-MM-DD
 * Returns time slots already booked for the given date (pending + confirmed).
 * Response: { takenTimes: string[] } in 24h "HH:mm" for use in the time picker.
 * No auth required so patients can see availability.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Query param date (YYYY-MM-DD) is required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const takenSet = new Set<string>();

  // booking_requests: pending and confirmed both "take" the slot
  const { data: requests } = await supabase
    .from("booking_requests")
    .select("requested_time")
    .eq("requested_date", date)
    .in("status", ["pending", "confirmed"]);

  for (const row of requests ?? []) {
    const t = row.requested_time;
    if (t) takenSet.add(parseTimeTo24(String(t)));
  }

  // queue_items (source=booked) for that date
  const { data: queueItems } = await supabase
    .from("queue_items")
    .select("appointment_at")
    .eq("source", "booked");

  for (const row of queueItems ?? []) {
    if (row.appointment_at) {
      const aptDate = new Date(row.appointment_at).toISOString().slice(0, 10);
      if (aptDate === date) {
        const t = new Date(row.appointment_at).toTimeString().slice(0, 5);
        if (t) takenSet.add(parseTimeTo24(t));
      }
    }
  }

  return NextResponse.json({ takenTimes: Array.from(takenSet) });
}
