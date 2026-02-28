"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { addDaysYmd, parseYYYYMMDDLocal, toYYYYMMDDLocal } from "../../../../lib/departmentBooking";
import { AdminSectionHeader } from "../layout/AdminSectionHeader";

type DepartmentWeek = {
  weekStartDate: string;
  weekEndDate: string;
  slotIntervalMinutes: number;
  isOpen: boolean;
};

type DepartmentSettings = {
  id: string;
  name: string;
  defaultSlotIntervalMinutes: number;
  hasCurrentWeekBookings: boolean;
  weeks: DepartmentWeek[];
};

type ApiResponse = {
  currentWeekStart: string;
  departments: DepartmentSettings[];
};

function formatWeekLabel(weekStartDate: string, weekEndDate: string) {
  const start = parseYYYYMMDDLocal(weekStartDate);
  const end = parseYYYYMMDDLocal(weekEndDate);
  if (!start || !end) return `${weekStartDate} to ${weekEndDate}`;
  const startLabel = start.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

export function AdminScheduleContent() {
  const [loading, setLoading] = useState(true);
  const [savingWeek, setSavingWeek] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState("");
  const [departments, setDepartments] = useState<DepartmentSettings[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [edits, setEdits] = useState<Record<string, { interval: number; isOpen: boolean }>>({});

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) throw new Error("Supabase not configured");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/department-booking-settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = (await res.json().catch(() => ({}))) as Partial<ApiResponse> & { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load department booking schedule");

      const current = String(data.currentWeekStart ?? "");
      const list = Array.isArray(data.departments) ? data.departments : [];

      setCurrentWeekStart(current);
      setDepartments(list);
      if (list.length > 0) {
        setSelectedDepartmentId((prev) => prev || list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId]
  );

  const weekRows = useMemo(() => {
    if (!selectedDepartment || !currentWeekStart) return [] as DepartmentWeek[];
    const existing = new Map(selectedDepartment.weeks.map((w) => [w.weekStartDate, w]));
    return Array.from({ length: 8 }).map((_, idx) => {
      const weekStartDate = addDaysYmd(currentWeekStart, idx * 7);
      const fromApi = existing.get(weekStartDate);
      return (
        fromApi ?? {
          weekStartDate,
          weekEndDate: addDaysYmd(weekStartDate, 6),
          slotIntervalMinutes: selectedDepartment.defaultSlotIntervalMinutes,
          isOpen: idx === 0,
        }
      );
    });
  }, [selectedDepartment, currentWeekStart]);

  const getEdit = (week: DepartmentWeek) => edits[week.weekStartDate] ?? { interval: week.slotIntervalMinutes, isOpen: week.isOpen };

  const hasWeekChanges = (week: DepartmentWeek) => {
    const draft = getEdit(week);
    const normalizedDraftInterval = Math.max(5, Math.min(60, Math.round(draft.interval / 5) * 5));
    return normalizedDraftInterval !== week.slotIntervalMinutes || draft.isOpen !== week.isOpen;
  };

  const onSaveWeek = async (week: DepartmentWeek) => {
    if (!selectedDepartment) return;
    const draft = getEdit(week);
    const interval = Math.max(5, Math.min(60, Math.round(draft.interval / 5) * 5));
    setSavingWeek(week.weekStartDate);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) throw new Error("Supabase not configured");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/department-booking-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          departmentId: selectedDepartment.id,
          weekStartDate: week.weekStartDate,
          slotIntervalMinutes: interval,
          isOpen: draft.isOpen,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save week setup");
      }

      setSuccess(`Saved ${formatWeekLabel(week.weekStartDate, week.weekEndDate)} for ${selectedDepartment.name}.`);
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save week setup");
    } finally {
      setSavingWeek("");
    }
  };

  const introDate = toYYYYMMDDLocal(new Date());

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Schedule"
        description="Configure department booking weeks and slot intervals."
      />

      <section className="rounded-lg border border-[#dee2e6] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-[#333333]">Department Booking Schedule</h3>
        <p className="mt-2 text-sm text-[#6C757D]">
          Configure per-department slot interval and open future weeks for booking. Today is {introDate}.
        </p>
        <div className="mt-3 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 text-sm text-[#495057]">
          Current week stays bookable. If bookings already exist this week, interval changes are blocked and you must configure next week.
        </div>
      </section>

      <section className="rounded-lg border border-[#dee2e6] bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#007bff] border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="department-schedule" className="mb-2 block text-sm font-medium text-[#495057]">
                  Department
                </label>
                <select
                  id="department-schedule"
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setEdits({});
                  }}
                  className="w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2.5 text-sm text-[#333333] outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/20"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-[#e9ecef] bg-[#f8f9fa] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[#6C757D]">Default interval</p>
                <p className="mt-1 text-xl font-semibold text-[#333333]">
                  {selectedDepartment?.defaultSlotIntervalMinutes ?? 30} minutes
                </p>
              </div>
            </div>

            {selectedDepartment?.hasCurrentWeekBookings && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Current week already has bookings for this department. Keep this week interval unchanged and update next week onward.
              </div>
            )}

            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-[#dee2e6]">
                <thead className="bg-[#f8f9fa]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Week</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Open for booking</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Interval (minutes)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#6C757D]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] bg-white">
                  {weekRows.map((week, index) => {
                    const edit = getEdit(week);
                    const isCurrentWeek = week.weekStartDate === currentWeekStart;
                    const hasChanges = hasWeekChanges(week);
                    const disableCurrentWeekInterval =
                      isCurrentWeek && Boolean(selectedDepartment?.hasCurrentWeekBookings);
                    const disableCurrentWeekClose =
                      isCurrentWeek && Boolean(selectedDepartment?.hasCurrentWeekBookings) && !edit.isOpen;
                    const saveDisabled =
                      savingWeek === week.weekStartDate ||
                      !hasChanges ||
                      disableCurrentWeekClose ||
                      edit.interval < 5 ||
                      edit.interval > 60;

                    return (
                      <tr key={week.weekStartDate} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 text-sm text-[#333333]">
                          <div className="font-medium">{index === 0 ? "Current week" : `Week +${index}`}</div>
                          <div className="text-xs text-[#6C757D]">{formatWeekLabel(week.weekStartDate, week.weekEndDate)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#333333]">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={edit.isOpen}
                              onChange={(e) => {
                                const next = e.target.checked;
                                setEdits((prev) => ({
                                  ...prev,
                                  [week.weekStartDate]: { ...edit, isOpen: next },
                                }));
                              }}
                              className="h-4 w-4 rounded border-[#ced4da] text-[#007bff] focus:ring-[#007bff]/20"
                            />
                            <span>{edit.isOpen ? "Open" : "Closed"}</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#333333]">
                          <input
                            type="number"
                            min={5}
                            max={60}
                            step={5}
                            value={edit.interval}
                            disabled={disableCurrentWeekInterval}
                            onChange={(e) => {
                              const nextInterval = Number(e.target.value || 30);
                              setEdits((prev) => ({
                                ...prev,
                                [week.weekStartDate]: { ...edit, interval: nextInterval },
                              }));
                            }}
                            className="w-28 rounded-lg border border-[#ced4da] px-3 py-2 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/20 disabled:cursor-not-allowed disabled:bg-[#e9ecef]"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSaveWeek(week)}
                            disabled={saveDisabled}
                            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingWeek === week.weekStartDate ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
