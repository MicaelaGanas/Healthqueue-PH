import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { addDaysYmd, compareYmd, getWeekStartYYYYMMDD, toYYYYMMDDLocal } from "../../../lib/departmentBooking";

type DepartmentBookingWeekRow = {
  week_start_date: string;
  is_open: boolean;
  slot_interval_minutes: number;
};

/**
 * GET /api/availability/department-rules?department=<name>
 * Returns booking week availability rules for a department.
 * - Current week is considered available by default.
 * - Future weeks are available only if explicitly opened by admin.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentName = (searchParams.get("department") ?? "").trim();
  if (!departmentName) {
    return NextResponse.json({ error: "Query param department is required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: department, error: deptError } = await supabase
    .from("departments")
    .select("id, name, default_slot_interval_minutes")
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
  const lastWeekStartToFetch = addDaysYmd(currentWeekStart, 7 * 12);

  const { data: weekRows, error: weekError } = await supabase
    .from("department_booking_weeks")
    .select("week_start_date, is_open, slot_interval_minutes")
    .eq("department_id", department.id)
    .gte("week_start_date", currentWeekStart)
    .lte("week_start_date", lastWeekStartToFetch)
    .order("week_start_date", { ascending: true });

  if (weekError) {
    return NextResponse.json({ error: weekError.message }, { status: 500 });
  }

  const openWeekStarts = ((weekRows ?? []) as DepartmentBookingWeekRow[])
    .filter((w) => w.is_open && compareYmd(w.week_start_date, currentWeekStart) >= 0)
    .map((w) => w.week_start_date);

  return NextResponse.json({
    department: department.name,
    defaultSlotIntervalMinutes: department.default_slot_interval_minutes,
    currentWeekStart,
    currentWeekEnd: addDaysYmd(currentWeekStart, 6),
    openWeekStarts,
  });
}
