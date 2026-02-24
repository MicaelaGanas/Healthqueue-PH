"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { getQueueRowsFromStorage, setQueueRowsInStorage } from "../../../../lib/queueSyncStorage";
import type { QueueRowSync } from "../../../../lib/queueSyncStorage";
import { DOCTORS_BY_DEPARTMENT } from "../../../../lib/departments";

const ALL_DOCTORS = Object.values(DOCTORS_BY_DEPARTMENT).flat();

/** Resolve staff name (and optional department) to full doctor string used in queue (e.g. "Dr. Ana Reyes - OB-GYN"). */
function resolveDoctorFromStaff(name: string | null | undefined, department: string | null | undefined): string {
  if (!name || typeof name !== "string") return "";
  const n = name.trim();
  if (!n) return "";
  const pool = department
    ? (DOCTORS_BY_DEPARTMENT[department] ?? [])
    : ALL_DOCTORS;
  let candidates = pool.filter((d) => d.includes(n) || n.includes(d));
  if (candidates.length === 0 && n.length > 1) {
    const words = n.replace(/\s+/g, " ").split(" ").filter(Boolean);
    candidates = pool.filter((d) => words.every((w) => d.toLowerCase().includes(w.toLowerCase())));
  }
  const picked =
    candidates.length === 1
      ? candidates[0]
      : candidates.find((d) => d.startsWith(n) || d.includes(` ${n} `)) ?? candidates[0] ?? "";
  return picked;
}

/** Build doctor display string from name + department when not in hardcoded list (so we still hide "I am" and filter queue). */
function syntheticDoctorString(name: string, department: string): string {
  const n = name.replace(/^Dr\.\s*/i, "").trim();
  return n ? `Dr. ${n} - ${department}` : "";
}

export function DoctorConsultationContent() {
  const [rows, setRows] = useState<QueueRowSync[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [staffDoctor, setStaffDoctor] = useState<string | null>(null);
  const [staffDepartment, setStaffDepartment] = useState<string | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setRows(getQueueRowsFromStorage());
      setQueueLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setRows(getQueueRowsFromStorage());
      setQueueLoading(false);
      return;
    }
    const res = await fetch("/api/queue-rows", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data as QueueRowSync[]);
        setQueueRowsInStorage(data);
      } else {
        setRows(getQueueRowsFromStorage());
      }
    } else {
      setRows(getQueueRowsFromStorage());
    }
    setQueueLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setStaffLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled || !session?.access_token) {
          setStaffLoading(false);
          return;
        }
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled || !res.ok) {
          setStaffLoading(false);
          return;
        }
        const body = await res.json().catch(() => ({}));
        const name = body.name ?? null;
        const department = body.department ?? null;
        const deptStr = department && typeof department === "string" ? department.trim() : null;
        if (deptStr) setStaffDepartment(deptStr);
        const resolved = resolveDoctorFromStaff(name, department);
        const doctorToUse =
          resolved ||
          (name && deptStr ? syntheticDoctorString(String(name).trim(), deptStr) : "");
        if (doctorToUse) setStaffDoctor(doctorToUse);
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const effectiveDoctor = staffDoctor || "";
  const departmentOnly = !effectiveDoctor && !!staffDepartment;
  /** Only show patients who have been called in (or in progress / completed). Scheduled and waiting stay hidden until staff clicks "Call in". */
  const VISIBLE_STATUSES = ["called", "in progress", "completed"];
  const myQueue = useMemo(() => {
    let scope = rows.filter((r) => VISIBLE_STATUSES.includes((r.status || "").toLowerCase()));
    if (effectiveDoctor && staffDepartment) {
      const deptMatch = (r: QueueRowSync) => (r.department || "").trim() === staffDepartment;
      scope = scope.filter((r) => {
        if (!deptMatch(r)) return false;
        const assigned = (r.assignedDoctor ?? "").trim();
        if (assigned === "") return true;
        return r.assignedDoctor === effectiveDoctor;
      });
    } else if (effectiveDoctor) {
      scope = scope.filter((r) => {
        const assigned = (r.assignedDoctor ?? "").trim();
        if (assigned === "") return true;
        return r.assignedDoctor === effectiveDoctor;
      });
    } else if (staffDepartment) {
      scope = scope.filter((r) => (r.department || "").trim() === staffDepartment);
    }
    return scope;
  }, [rows, effectiveDoctor, staffDepartment]);

  const completeConsult = useCallback(async (ticket: string) => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/queue-rows/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ticket, status: "completed" }),
    });
    if (res.ok) await fetchQueue();
  }, [fetchQueue]);

  const inProgress = myQueue.filter((r) => r.status.toLowerCase() === "in progress");
  const completed = myQueue.filter((r) => r.status.toLowerCase() === "completed");
  const waitingCount = myQueue.filter((r) => r.status.toLowerCase() !== "completed").length;

  type QueueFilter = "waiting" | "completed";
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("waiting");
  const filteredQueue = useMemo(() => {
    if (queueFilter === "completed") return myQueue.filter((r) => r.status.toLowerCase() === "completed");
    return myQueue.filter((r) => r.status.toLowerCase() !== "completed");
  }, [myQueue, queueFilter]);

  const canShowQueue = effectiveDoctor || departmentOnly;
  const needsAdmin = !staffLoading && !staffDepartment && !staffDoctor;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Consultation</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          Consultations for your assigned department.
        </p>
      </div>

      {staffLoading ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-6 text-center text-[#6C757D]">
          Loading your assignment…
        </div>
      ) : needsAdmin ? (
        <div className="rounded-lg border border-[#dee2e6] bg-amber-50 p-4 text-amber-800">
          <p className="text-sm font-medium">
            Your account has no name or department set. Contact an administrator to set your name and department so we can show your consultation queue.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#333333]">
            {effectiveDoctor ? (
              <span className="text-[#1e3a5f]">{effectiveDoctor}</span>
            ) : (
              <>
                <span className="text-[#1e3a5f]">{staffDepartment}</span>
                <span className="text-[#6C757D]"> — Ask an administrator to set your name to filter by your profile.</span>
              </>
            )}
          </p>
        </div>
      )}

      {!canShowQueue ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          {staffLoading ? "Loading your assignment…" : "We need your name and department to show your queue. Contact an administrator."}
        </div>
      ) : queueLoading ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          Loading queue…
        </div>
      ) : myQueue.length === 0 ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          No patients sent to you yet. Staff will call in the next patient when you’re ready; they’ll appear here then.
        </div>
      ) : (
        <div className="rounded-lg border border-[#dee2e6] bg-white shadow-sm">
          <div className="border-b border-[#dee2e6] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-medium text-[#6C757D]">Show:</span>
                <div className="flex rounded-lg border border-[#dee2e6] p-0.5">
                  <button
                    type="button"
                    onClick={() => setQueueFilter("waiting")}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      queueFilter === "waiting"
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-transparent text-[#333333] hover:bg-[#f8f9fa]"
                    }`}
                  >
                    Waiting ({waitingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter("completed")}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      queueFilter === "completed"
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-transparent text-[#333333] hover:bg-[#f8f9fa]"
                    }`}
                  >
                    Completed ({completed.length})
                  </button>
                </div>
                <span className="text-[#6C757D]">
                  {queueFilter === "waiting" ? "Waiting" : "Completed"}: <span className="font-medium text-[#333333]">{filteredQueue.length}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setQueueLoading(true); fetchQueue(); }}
                className="rounded border border-[#dee2e6] bg-white px-3 py-1.5 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
              >
                Refresh queue
              </button>
            </div>
          </div>
          {filteredQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6C757D]">
              {queueFilter === "completed" ? "No completed consultations yet." : "No patients waiting."}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#dee2e6]">
              <thead className="bg-[#f8f9fa]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#6C757D] sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee2e6] bg-white">
                {filteredQueue.map((r) => (
                  <tr key={r.ticket} className="hover:bg-[#f8f9fa]">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#333333] sm:px-6">
                      {r.ticket}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.department}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-[#333333] sm:px-6">
                      {r.priority}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.status.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800"
                            : r.status.toLowerCase() === "in progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status.toLowerCase() === "completed"
                          ? "Done"
                          : r.status.toLowerCase() === "in progress"
                            ? "With doctor"
                            : "Waiting"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      {r.status.toLowerCase() === "in progress" && (
                        <button
                          type="button"
                          onClick={() => completeConsult(r.ticket)}
                          className="rounded bg-[#28a745] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#218838]"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
