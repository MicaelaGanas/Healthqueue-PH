import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";
import {
  addDaysYmd,
  compareYmd,
  getWeekStartYYYYMMDD,
  normalizeSlotIntervalMinutes,
  parseYYYYMMDDLocal,
  toYYYYMMDDLocal,
} from "../../../lib/departmentBooking";

type DepartmentRow = {
  id: string;
  name: string;
  default_slot_interval_minutes: number;
};

type DepartmentWeekRow = {
  id: string;
  department_id: string;
  week_start_date: string;
  slot_interval_minutes: number;
  is_open: boolean;
};

const requireAdmin = requireRoles(["admin"]);

function getCurrentWeekStart() {
  return getWeekStartYYYYMMDD(toYYYYMMDDLocal(new Date()));
}

function getWeekRange(weekStart: string) {
  return {
    start: weekStart,
    end: addDaysYmd(weekStart, 6),
  };
}

async function getHasBookingsInWeek(departmentId: string, weekStart: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return false;
  const week = getWeekRange(weekStart);

  const [requestCount, queueCount] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .gte("requested_date", week.start)
      .lte("requested_date", week.end)
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("queue_items")
      .select("id", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .eq("source", "booked")
      .gte("appointment_at", `${week.start}T00:00:00`)
      .lte("appointment_at", `${week.end}T23:59:59`),
  ]);

  return Number(requestCount.count ?? 0) > 0 || Number(queueCount.count ?? 0) > 0;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const currentWeekStart = getCurrentWeekStart();
  const untilWeekStart = addDaysYmd(currentWeekStart, 7 * 11);

  const [{ data: departments, error: deptError }, { data: weekRows, error: weekError }] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, default_slot_interval_minutes")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("department_booking_weeks")
      .select("id, department_id, week_start_date, slot_interval_minutes, is_open")
      .gte("week_start_date", currentWeekStart)
      .lte("week_start_date", untilWeekStart)
      .order("week_start_date", { ascending: true }),
  ]);

  if (deptError) return NextResponse.json({ error: deptError.message }, { status: 500 });
  if (weekError) return NextResponse.json({ error: weekError.message }, { status: 500 });

  const weekRowsList = (weekRows ?? []) as DepartmentWeekRow[];
  const departmentsList = (departments ?? []) as DepartmentRow[];

  const hasCurrentWeekBookingsByDepartment: Record<string, boolean> = {};
  await Promise.all(
    departmentsList.map(async (dept) => {
      hasCurrentWeekBookingsByDepartment[dept.id] = await getHasBookingsInWeek(dept.id, currentWeekStart);
    })
  );

  const byDepartment: Record<string, DepartmentWeekRow[]> = {};
  for (const row of weekRowsList) {
    if (!byDepartment[row.department_id]) byDepartment[row.department_id] = [];
    byDepartment[row.department_id].push(row);
  }

  return NextResponse.json({
    currentWeekStart,
    departments: departmentsList.map((dept) => ({
      id: dept.id,
      name: dept.name,
      defaultSlotIntervalMinutes: normalizeSlotIntervalMinutes(dept.default_slot_interval_minutes),
      hasCurrentWeekBookings: Boolean(hasCurrentWeekBookingsByDepartment[dept.id]),
      weeks: (byDepartment[dept.id] ?? []).map((row) => ({
        id: row.id,
        weekStartDate: row.week_start_date,
        weekEndDate: addDaysYmd(row.week_start_date, 6),
        slotIntervalMinutes: normalizeSlotIntervalMinutes(row.slot_interval_minutes),
        isOpen: row.is_open,
      })),
    })),
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        departmentId?: string;
        weekStartDate?: string;
        slotIntervalMinutes?: number;
        isOpen?: boolean;
      }
    | null;

  const departmentId = (body?.departmentId ?? "").trim();
  const weekStartDate = (body?.weekStartDate ?? "").trim();
  const slotIntervalMinutes = normalizeSlotIntervalMinutes(body?.slotIntervalMinutes);
  const isOpen = Boolean(body?.isOpen);

  if (!departmentId || !weekStartDate || !parseYYYYMMDDLocal(weekStartDate)) {
    return NextResponse.json({ error: "departmentId and weekStartDate are required." }, { status: 400 });
  }

  const normalizedWeekStart = getWeekStartYYYYMMDD(weekStartDate);
  if (normalizedWeekStart !== weekStartDate) {
    return NextResponse.json({ error: "weekStartDate must be a Monday (week start)." }, { status: 400 });
  }

  const currentWeekStart = getCurrentWeekStart();
  if (compareYmd(weekStartDate, currentWeekStart) < 0) {
    return NextResponse.json({ error: "Past weeks cannot be updated." }, { status: 400 });
  }

  const { data: department } = await supabase
    .from("departments")
    .select("id, default_slot_interval_minutes")
    .eq("id", departmentId)
    .eq("is_active", true)
    .maybeSingle();

  if (!department) {
    return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  const { data: existingSetup } = await supabase
    .from("department_booking_weeks")
    .select("id, slot_interval_minutes, is_open")
    .eq("department_id", departmentId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  const isCurrentWeek = compareYmd(weekStartDate, currentWeekStart) === 0;
  if (isCurrentWeek) {
    const hasBookings = await getHasBookingsInWeek(departmentId, weekStartDate);
    if (hasBookings) {
      if (existingSetup && Number(existingSetup.slot_interval_minutes) !== slotIntervalMinutes) {
        return NextResponse.json(
          {
            error:
              "Current-week interval cannot be changed because bookings already exist. Configure next week instead.",
          },
          { status: 409 }
        );
      }
      const defaultInterval = normalizeSlotIntervalMinutes(department.default_slot_interval_minutes);
      if (!existingSetup && slotIntervalMinutes !== defaultInterval) {
        return NextResponse.json(
          {
            error:
              "Current-week interval cannot be changed because bookings already exist. Configure next week instead.",
          },
          { status: 409 }
        );
      }
      if (!isOpen) {
        return NextResponse.json(
          { error: "Current week cannot be closed while bookings exist." },
          { status: 409 }
        );
      }
    }
  }

  const payload = {
    department_id: departmentId,
    week_start_date: weekStartDate,
    slot_interval_minutes: slotIntervalMinutes,
    is_open: isOpen,
    updated_by: auth.staff.id,
    created_by: existingSetup ? undefined : auth.staff.id,
  };

  const { data, error } = await supabase
    .from("department_booking_weeks")
    .upsert(payload, { onConflict: "department_id,week_start_date" })
    .select("id, week_start_date, slot_interval_minutes, is_open")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    weekStartDate: data.week_start_date,
    weekEndDate: addDaysYmd(data.week_start_date, 6),
    slotIntervalMinutes: normalizeSlotIntervalMinutes(data.slot_interval_minutes),
    isOpen: data.is_open,
  });
}
