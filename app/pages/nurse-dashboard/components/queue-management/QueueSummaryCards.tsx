"use client";

import { useMemo } from "react";
import { useNurseQueue } from "../../context/NurseQueueContext";

const MINS_PER_PATIENT = 10;

type QueueSummaryCardsProps = {
  /** When set, counts are for this specialty only. */
  managedDepartment: string;
  /** When set, counts are for this doctor's queue only (no other doctors). */
  doctorOnDuty?: string;
};

export function QueueSummaryCards({ managedDepartment, doctorOnDuty }: QueueSummaryCardsProps) {
  const { queueRows } = useNurseQueue();

  const stats = useMemo(() => {
    let dept = queueRows.filter((r) => r.department === managedDepartment);
    if (doctorOnDuty) {
      dept = dept.filter((r) => r.assignedDoctor === doctorOnDuty);
    }
    const inQueue = dept.filter((r) =>
      ["scheduled", "waiting", "called", "in progress"].includes(r.status)
    ).length;
    const waiting = dept.filter((r) => r.status === "waiting");
    const avgWaitMins = waiting.length > 0
      ? Math.round((waiting.length * MINS_PER_PATIENT) / 2)
      : 0;
    const serving = dept.filter((r) => r.status === "in progress").length;

    return {
      inQueue: String(inQueue),
      avgWait: waiting.length > 0 ? `~${avgWaitMins} min` : "—",
      serving: String(serving),
    };
  }, [queueRows, managedDepartment, doctorOnDuty]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-[#007bff]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.inQueue}</p>
          <p className="text-sm text-[#6C757D]">Patients in Queue</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-[#007bff]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.avgWait}</p>
          <p className="text-sm text-[#6C757D]">Est. Wait (waiting)</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm">
        <div className="text-[#007bff]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#333333]">{stats.serving}</p>
          <p className="text-sm text-[#6C757D]">Currently Serving</p>
        </div>
      </div>
    </div>
  );
}
