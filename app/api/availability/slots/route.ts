import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { parseTimeTo24 } from "../../../lib/queueBookedStorage";
import {
  addDaysYmd,
  compareYmd,
  generateTimeSlots24,
  getWeekStartYYYYMMDD,
  normalizeSlotIntervalMinutes,
  toYYYYMMDDLocal,
} from "../../../lib/departmentBooking";

type DepartmentRow = {
  id: string;
  default_slot_interval_minutes: number;
};

type DepartmentBookingWeekRow = {
  week_start_date: string;
  slot_interval_minutes: number;
  is_open: boolean;
};

/**
 * GET /api/availability/slots?date=YYYY-MM-DD&department=<name>
 * Returns time slots already booked for the given date (pending + confirmed).
 * Response: { takenTimes: string[], timeSlots24: string[], slotIntervalMinutes: number, isDepartmentReady: boolean }
 * No auth required so patients can see availability.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim();
  const departmentName = searchParams.get("department")?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Query param date (YYYY-MM-DD) is required" }, { status: 400 });
  }
  if (!departmentName) {
    return NextResponse.json({ error: "Query param department is required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: department, error: deptError } = await supabase
    .from("departments")
    .select("id, default_slot_interval_minutes")
    .eq("name", departmentName)
    .eq("is_active", true)
    .maybeSingle();

  if (deptError) {
    return NextResponse.json({ error: deptError.message }, { status: 500 });
  }
  if (!department) {
    return NextResponse.json({ error: `Department \"${departmentName}\" not found` }, { status: 404 });
  }

  const todayYmd = toYYYYMMDDLocal(new Date());
  const currentWeekStart = getWeekStartYYYYMMDD(todayYmd);
  const requestedWeekStart = getWeekStartYYYYMMDD(date);

  const { data: weekSetup, error: weekError } = await supabase
    .from("department_booking_weeks")
    .select("week_start_date, slot_interval_minutes, is_open")
    .eq("department_id", department.id)
    .eq("week_start_date", requestedWeekStart)
    .maybeSingle();

  if (weekError) {
    return NextResponse.json({ error: weekError.message }, { status: 500 });
  }

  const dept = department as DepartmentRow;
  const setup = weekSetup as DepartmentBookingWeekRow | null;
  const isFutureWeek = compareYmd(requestedWeekStart, currentWeekStart) > 0;
  const isDepartmentReady = !isFutureWeek || (Boolean(setup) && setup?.is_open === true);

  if (!isDepartmentReady) {
    return NextResponse.json({
      takenTimes: [],
      timeSlots24: [],
      slotIntervalMinutes: normalizeSlotIntervalMinutes(dept.default_slot_interval_minutes),
      isDepartmentReady: false,
      reason: "This department is not yet open for the selected week.",
      currentWeekStart,
      currentWeekEnd: addDaysYmd(currentWeekStart, 6),
      requestedWeekStart,
    });
  }

  const slotIntervalMinutes = normalizeSlotIntervalMinutes(
    setup?.slot_interval_minutes ?? dept.default_slot_interval_minutes
  );
  const timeSlots24 = generateTimeSlots24(slotIntervalMinutes);

  const takenSet = new Set<string>();

  // booking_requests: pending and confirmed both "take" the slot
  const { data: requests } = await supabase
    .from("booking_requests")
    .select("requested_time")
    .eq("department_id", department.id)
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
    .eq("department_id", department.id)
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

  return NextResponse.json({
    takenTimes: Array.from(takenSet).filter((t) => timeSlots24.includes(t)),
    timeSlots24,
    slotIntervalMinutes,
    isDepartmentReady: true,
    currentWeekStart,
    currentWeekEnd: addDaysYmd(currentWeekStart, 6),
    requestedWeekStart,
  });
}
