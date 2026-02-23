import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";
import { linearRegression } from "simple-statistics";

const requireAdmin = requireRoles(["admin"]);

const MIN_DAYS = 3;
const MAX_DAYS = 90;

/** GET: run simple ML (linear regression) on daily_insights_snapshots; return predictions for tomorrow. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: rows, error } = await supabase
    .from("daily_insights_snapshots")
    .select("date, completed_count, booked_count")
    .order("date", { ascending: true });

  if (error) {
    console.error("insights-predict select error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []).slice(-MAX_DAYS);
  if (list.length < MIN_DAYS) {
    return NextResponse.json({
      predictions: null,
      message: `Need at least ${MIN_DAYS} days of snapshots. Record daily from Admin → Insights (you have ${list.length}).`,
      daysUsed: list.length,
    });
  }

  // x = day index (0, 1, 2, ...), y = completed_count or booked_count
  const xCompleted = list.map((_, i) => i);
  const yCompleted = list.map((r) => Number((r as { completed_count?: number }).completed_count ?? 0));
  const xBooked = list.map((_, i) => i);
  const yBooked = list.map((r) => Number((r as { booked_count?: number }).booked_count ?? 0));

  const lrCompleted = linearRegression(
    xCompleted.map((x) => [x, yCompleted[x]] as [number, number])
  );
  const lrBooked = linearRegression(
    xBooked.map((x) => [x, yBooked[x]] as [number, number])
  );

  // next day index = list.length
  const nextX = list.length;
  const predictedCompleted = Math.max(0, Math.round(lrCompleted.m * nextX + lrCompleted.b));
  const predictedBooked = Math.max(0, Math.round(lrBooked.m * nextX + lrBooked.b));

  const trendCompleted = lrCompleted.m >= 0.5 ? "up" : lrCompleted.m <= -0.5 ? "down" : "stable";
  const trendBooked = lrBooked.m >= 0.2 ? "up" : lrBooked.m <= -0.2 ? "down" : "stable";

  return NextResponse.json({
    predictions: {
      tomorrowCompleted: predictedCompleted,
      tomorrowBooked: predictedBooked,
      trendCompleted,
      trendBooked,
    },
    model: "linear regression (your data)",
    daysUsed: list.length,
  });
}
