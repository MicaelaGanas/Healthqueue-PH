"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { getQueueRowsFromStorage } from "../../../../lib/queueSyncStorage";
import { getBookedQueueFromStorage } from "../../../../lib/queueBookedStorage";

const today = () => new Date().toISOString().slice(0, 10);

type PredictionCard = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "capacity" | "workflow" | "priority" | "trend";
};

/** Simple predictive scenario: no API, just rules from your data */
type PredictiveScenario = {
  id: string;
  title: string;
  scenario: string;
  confidence: "high" | "medium" | "low";
};

/** Minutes assumed saved per completed consultation (configurable estimate). */
const MINS_SAVED_PER_COMPLETED = 5;

/** Avg consultation duration (minutes) for projections */
const AVG_CONSULT_MINS = 15;

type MLPredictions = {
  tomorrowCompleted: number;
  tomorrowBooked: number;
  trendCompleted: string;
  trendBooked: string;
};

export function InsightsContent() {
  const [queueRows, setQueueRows] = useState(getQueueRowsFromStorage());
  const [booked, setBooked] = useState(getBookedQueueFromStorage());
  const [activityCount, setActivityCount] = useState<number | null>(null);
  const [mlPredictions, setMlPredictions] = useState<MLPredictions | null>(null);
  const [mlDaysUsed, setMlDaysUsed] = useState<number | null>(null);
  const [mlMessage, setMlMessage] = useState<string | null>(null);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    setQueueRows(getQueueRowsFromStorage());
    setBooked(getBookedQueueFromStorage());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;
      try {
        const res = await fetch(`/api/admin/activity-log?date=${today()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled || !res.ok) return;
        const list = await res.json();
        setActivityCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setActivityCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const todayStr = today();
    const completedTodayCount = queueRows.filter(
      (r) => r.status === "Completed" && (r.addedAt || "").slice(0, 10) === todayStr
    ).length;
    const byDept: Record<string, number> = {};
    queueRows.forEach((r) => {
      const d = r.department || "General";
      byDept[d] = (byDept[d] || 0) + 1;
    });
    const urgent = queueRows.filter((r) => (r.priority || "").toLowerCase().includes("urgent")).length;
    const waiting = queueRows.filter((r) => r.status !== "Completed" && r.status !== "In Consultation").length;
    const inConsultation = queueRows.filter((r) => r.status === "In Consultation").length;
    const topDept = Object.entries(byDept).sort(([, a], [, b]) => b - a)[0];
    const bookedToday = booked.filter(
      (b) => (b.appointmentDate || b.addedAt?.slice(0, 10)) === todayStr
    ).length;
    return { byDept, urgent, waiting, inConsultation, topDept, bookedToday, completedTodayCount };
  }, [queueRows, booked]);

  const insightsCount = useMemo(() => {
    let n = 0;
    if (stats.urgent > 0) n += 1;
    if (stats.topDept && stats.topDept[1] >= 3) n += 1;
    if (stats.waiting > 4) n += 1;
    return n;
  }, [stats.urgent, stats.topDept, stats.waiting]);

  const staffActionsToday = activityCount ?? 0;
  const timeSavedToday = (stats.completedTodayCount * MINS_SAVED_PER_COMPLETED) / 60;
  const patientsOptimized = stats.completedTodayCount + (stats.bookedToday || 0);

  const predictions = useMemo((): PredictionCard[] => {
    const list: PredictionCard[] = [];
    if (stats.urgent > 0) {
      list.push({
        id: "urgent",
        title: "Urgent cases need prioritization",
        description: `${stats.urgent} urgent case(s) in queue. Consider moving them ahead to reduce wait and improve outcomes.`,
        priority: "high",
        category: "priority",
      });
    }
    if (stats.topDept && stats.topDept[1] >= 3) {
      list.push({
        id: "capacity",
        title: `Peak load in ${stats.topDept[0]}`,
        description: `High volume (${stats.topDept[1]} patients). Consider adding capacity or shifting staff to avoid long wait times.`,
        priority: stats.topDept[1] >= 5 ? "high" : "medium",
        category: "capacity",
      });
    }
    if (stats.waiting > 4) {
      list.push({
        id: "waiting",
        title: "Waiting list is building up",
        description: `${stats.waiting} patients waiting. Suggest batching consultations or notifying doctors to start next.`,
        priority: "medium",
        category: "workflow",
      });
    }
    return list;
  }, [stats.urgent, stats.topDept, stats.waiting]);

  /** Simple predictive scenarios from today's data — no external API */
  const predictiveScenarios = useMemo((): PredictiveScenario[] => {
    const list: PredictiveScenario[] = [];
    const totalToday = stats.completedTodayCount + stats.bookedToday;
    const stillToSee = stats.waiting + stats.inConsultation;

    if (totalToday > 0 || stillToSee > 0) {
      const tomorrowEst = totalToday > 0 ? totalToday : Math.max(1, stillToSee);
      list.push({
        id: "tomorrow-load",
        title: "Tomorrow’s expected load",
        scenario: `If trends hold, expect roughly ${tomorrowEst}–${tomorrowEst + 2} patients (bookings + walk-ins). Plan staffing for similar volume.`,
        confidence: totalToday >= 3 ? "high" : "medium",
      });
    }

    if (stats.topDept && stats.topDept[1] >= 2) {
      list.push({
        id: "dept-trend",
        title: "Department trend",
        scenario: `${stats.topDept[0]} is busiest today (${stats.topDept[1]} patients). Likely to remain high tomorrow—consider keeping or adding capacity there.`,
        confidence: stats.topDept[1] >= 4 ? "high" : "medium",
      });
    }

    if (stats.inConsultation > 0 || stats.waiting > 0) {
      const slotsPerHour = stats.inConsultation > 0 ? Math.round((60 / AVG_CONSULT_MINS) * stats.inConsultation) : 4;
      const hoursToClear = stillToSee > 0 && slotsPerHour > 0 ? (stillToSee / slotsPerHour).toFixed(1) : "—";
      list.push({
        id: "eod-projection",
        title: "End-of-day projection",
        scenario: `${stillToSee} patients still to see. At current capacity (~${slotsPerHour} slots/hr), estimated ${hoursToClear} hour(s) to clear—adjust if consult times differ.`,
        confidence: stats.inConsultation >= 1 ? "medium" : "low",
      });
    }

    if (stats.waiting >= 3 && stats.inConsultation <= 1) {
      list.push({
        id: "bottleneck",
        title: "Bottleneck risk",
        scenario: `Many waiting (${stats.waiting}) but few in consultation (${stats.inConsultation}). Consultation capacity may be the limit—consider starting more consults or adding capacity.`,
        confidence: "high",
      });
    }

    if (stats.bookedToday >= 2 && list.length < 4) {
      list.push({
        id: "booking-trend",
        title: "Booking trend",
        scenario: `${stats.bookedToday} booking(s) today. If this rate continues, prepare for a steady flow of pre-booked patients; walk-ins will add on top.`,
        confidence: "medium",
      });
    }

    return list;
  }, [stats]);

  // Record today's snapshot for ML, then fetch predictions (linear regression on your data).
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;
      const todayStr = today();
      const payload = {
        date: todayStr,
        completedCount: stats.completedTodayCount,
        bookedCount: stats.bookedToday,
        waitingMax: stats.waiting,
        urgentCount: stats.urgent,
        inConsultationMax: stats.inConsultation,
        staffActions: activityCount ?? 0,
        topDeptName: stats.topDept ? stats.topDept[0] : "",
        topDeptCount: stats.topDept ? stats.topDept[1] : 0,
      };
      setMlLoading(true);
      try {
        await fetch("/api/admin/insights-snapshot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        });
        if (cancelled) return;
        const res = await fetch("/api/admin/insights-predict", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        const data = await res.json().catch(() => ({}));
        if (data.predictions) {
          setMlPredictions(data.predictions);
          setMlDaysUsed(data.daysUsed ?? null);
          setMlMessage(null);
        } else {
          setMlPredictions(null);
          setMlDaysUsed(data.daysUsed ?? null);
          setMlMessage(data.message ?? "Not enough history yet.");
        }
      } catch {
        if (!cancelled) setMlMessage("Could not load predictions.");
      } finally {
        if (!cancelled) setMlLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [stats, activityCount]);

  const priorityColor = (p: PredictionCard["priority"]) =>
    p === "high" ? "border-l-4 border-l-amber-500" : p === "medium" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-[#e9ecef]";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333] sm:text-2xl">Insights & Recommendations</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">Data-driven insights from your queue and bookings. All numbers and recommendations are computed from live data—no dummy or placeholder values.</p>
      </div>

      {/* KPI cards – all from real data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Insights generated</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">{insightsCount}</p>
          <p className="mt-0.5 text-sm text-[#6C757D]">From current queue & booking data</p>
        </div>
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Staff actions today</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">{staffActionsToday}</p>
          <p className="mt-0.5 text-sm text-[#6C757D]">Confirmations, walk-ins, etc.</p>
        </div>
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Time saved today</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">
            {timeSavedToday >= 1 ? `${timeSavedToday.toFixed(1)} hrs` : `${Math.round(timeSavedToday * 60)} min`}
          </p>
          <p className="mt-0.5 text-sm text-[#6C757D]">≈{MINS_SAVED_PER_COMPLETED} min per completed consultation</p>
        </div>
        <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Patients (today)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">{patientsOptimized}</p>
          <p className="mt-0.5 text-sm text-[#6C757D]">Completed + booked today</p>
        </div>
      </div>

      {/* Your own ML: linear regression on daily snapshots */}
      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e9ecef] bg-gradient-to-r from-[#ede9fe] to-[#f8f9fa] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600" aria-hidden>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#333333]">Machine learning predictions</h3>
              <p className="mt-0.5 text-xs text-[#6C757D]">Your model: linear regression trained on daily snapshots. No external API—runs on your data.</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {mlLoading && (
            <div className="flex items-center gap-3 text-sm text-[#6C757D]">
              <div className="h-5 w-5 shrink-0 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span>Recording today&apos;s snapshot and running model…</span>
            </div>
          )}
          {!mlLoading && mlMessage && !mlPredictions && (
            <p className="rounded-lg bg-[#f8f9fa] px-3 py-2 text-sm text-[#6C757D]">{mlMessage}</p>
          )}
          {!mlLoading && mlPredictions && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#e9ecef] bg-[#fafafa] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Tomorrow (completed)</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333]">~{mlPredictions.tomorrowCompleted}</p>
                <p className="mt-0.5 text-xs text-[#6C757D]">Trend: {mlPredictions.trendCompleted}</p>
              </div>
              <div className="rounded-lg border border-[#e9ecef] bg-[#fafafa] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Tomorrow (bookings)</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#333333]">~{mlPredictions.tomorrowBooked}</p>
                <p className="mt-0.5 text-xs text-[#6C757D]">Trend: {mlPredictions.trendBooked}</p>
              </div>
              {mlDaysUsed != null && (
                <p className="text-xs text-[#6C757D] sm:col-span-2">Trained on {mlDaysUsed} days of your data.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Predictive scenarios — simple rules from today */}
      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e9ecef] bg-gradient-to-r from-[#ecfdf5] to-[#f8f9fa] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600" aria-hidden>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#333333]">Predictive scenarios</h3>
              <p className="mt-0.5 text-xs text-[#6C757D]">Future scenarios from today&apos;s data. Simple rules only—no external API.</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-[#e9ecef]">
          {predictiveScenarios.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#6C757D] sm:px-5">
              Not enough data yet. As queue and bookings fill in, predictions will appear here.
            </div>
          ) : (
            predictiveScenarios.map((s) => (
              <div key={s.id} className="flex gap-3 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-[#f8f9fa]">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.confidence === "high"
                      ? "bg-emerald-100 text-emerald-800"
                      : s.confidence === "medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-[#e9ecef] text-[#6C757D]"
                  }`}
                >
                  {s.confidence}
                </span>
                <div>
                  <p className="font-medium text-[#333333]">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#6C757D]">{s.scenario}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rule-based recommendations */}
      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 sm:px-5">
          <h3 className="text-base font-semibold text-[#333333]">Rule-based recommendations</h3>
          <p className="mt-0.5 text-xs text-[#6C757D]">Generated from queue volume, urgent count, and waiting list. Shown only when thresholds are met.</p>
        </div>
        <div className="divide-y divide-[#e9ecef]">
          {predictions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#6C757D] sm:px-5">
              No recommendations right now. When queue volume, urgent cases, or waiting list pass thresholds, insights will appear here.
            </div>
          ) : (
            predictions.map((p) => (
              <div
                key={p.id}
                className={`bg-white px-4 py-4 sm:px-5 ${priorityColor(p.priority)} hover:bg-[#f8f9fa]`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#333333]">{p.title}</p>
                    <p className="mt-0.5 text-sm text-[#6C757D]">{p.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.priority === "high"
                        ? "bg-amber-100 text-amber-800"
                        : p.priority === "medium"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-[#e9ecef] text-[#6C757D]"
                    }`}
                  >
                    {p.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
