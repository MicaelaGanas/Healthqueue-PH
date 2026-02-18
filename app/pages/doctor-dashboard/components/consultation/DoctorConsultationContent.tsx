"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { getQueueRowsFromStorage, updateQueueRowStatusInStorage } from "../../../../lib/queueSyncStorage";
import type { QueueRowSync } from "../../../../lib/queueSyncStorage";
import { DOCTORS_BY_DEPARTMENT } from "../../../../lib/departments";

const ALL_DOCTORS = Object.values(DOCTORS_BY_DEPARTMENT).flat();

function loadQueue(): QueueRowSync[] {
  return getQueueRowsFromStorage();
}

/** Resolve staff name (and optional department) to full doctor string used in queue (e.g. "Dr. Ana Reyes - OB-GYN"). */
function resolveDoctorFromStaff(name: string | null | undefined, department: string | null | undefined): string {
  if (!name || typeof name !== "string") return "";
  const n = name.trim();
  if (!n) return "";
  const candidates = department
    ? (DOCTORS_BY_DEPARTMENT[department] ?? []).filter((d) => d.includes(n) || n.includes(d))
    : ALL_DOCTORS.filter((d) => d.includes(n) || n.includes(d));
  return candidates.length === 1 ? candidates[0] : candidates.find((d) => d.startsWith(n) || d.includes(` ${n} `)) ?? candidates[0] ?? "";
}

export function DoctorConsultationContent() {
  const [rows, setRows] = useState<QueueRowSync[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [staffDoctor, setStaffDoctor] = useState<string | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    setRows(loadQueue());
  }, []);

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
        const resolved = resolveDoctorFromStaff(name, department);
        if (resolved) {
          setStaffDoctor(resolved);
          setSelectedDoctor(resolved);
        }
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const effectiveDoctor = selectedDoctor || staffDoctor || "";
  const myQueue = useMemo(() => {
    if (!effectiveDoctor) return [];
    return rows.filter((r) => r.assignedDoctor === effectiveDoctor);
  }, [rows, effectiveDoctor]);

  const refresh = () => setRows(loadQueue());

  const startConsult = (ticket: string) => {
    updateQueueRowStatusInStorage(ticket, "in progress");
    refresh();
  };

  const completeConsult = (ticket: string) => {
    updateQueueRowStatusInStorage(ticket, "completed");
    refresh();
  };

  const waitingOrCalled = myQueue.filter(
    (r) => r.status.toLowerCase() === "waiting" || r.status.toLowerCase() === "called"
  );
  const inProgress = myQueue.filter((r) => r.status.toLowerCase() === "in progress");
  const completed = myQueue.filter((r) => r.status.toLowerCase() === "completed");

  const showDoctorSelector = !staffDoctor;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Consultation</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          {showDoctorSelector
            ? "Select yourself to see your queue and manage consultations."
            : "You only see your assigned queue. Contact an administrator to change your assignment."}
        </p>
      </div>

      {staffLoading ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-6 text-center text-[#6C757D]">
          Loading your assignment…
        </div>
      ) : staffDoctor ? (
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#333333]">
            Your queue: <span className="text-[#1e3a5f]">{staffDoctor}</span>
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
          <label htmlFor="doctor-select" className="mb-2 block text-sm font-semibold text-[#333333]">
            I am
          </label>
          <select
            id="doctor-select"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full max-w-md rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-[#333333] focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
          >
            <option value="">Select doctor...</option>
            {ALL_DOCTORS.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </div>
      )}

      {!effectiveDoctor ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          {staffLoading
            ? "Loading your assignment…"
            : "Select a doctor above to view your consultation queue. If you have an assigned department, ask an administrator to set your name so you see only your queue."}
        </div>
      ) : myQueue.length === 0 ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          No patients in your queue right now.
        </div>
      ) : (
        <div className="rounded-lg border border-[#dee2e6] bg-white shadow-sm">
          <div className="border-b border-[#dee2e6] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-medium text-[#333333]">
                Waiting: <span className="text-[#1e3a5f]">{waitingOrCalled.length}</span>
              </span>
              <span className="font-medium text-[#333333]">
                In progress: <span className="text-[#1e3a5f]">{inProgress.length}</span>
              </span>
              <span className="font-medium text-[#333333]">
                Completed: <span className="text-[#1e3a5f]">{completed.length}</span>
              </span>
            </div>
          </div>
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
                {myQueue.map((r) => (
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
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          r.status.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800"
                            : r.status.toLowerCase() === "in progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      {(r.status.toLowerCase() === "waiting" || r.status.toLowerCase() === "called") && (
                        <button
                          type="button"
                          onClick={() => startConsult(r.ticket)}
                          className="rounded bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2a4a7a]"
                        >
                          Start consult
                        </button>
                      )}
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
        </div>
      )}
    </div>
  );
}
