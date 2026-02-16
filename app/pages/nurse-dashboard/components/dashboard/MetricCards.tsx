"use client";

import React, { useMemo } from "react";
import { useNurseQueue } from "../../context/NurseQueueContext";
import type { QueueRow } from "../../context/NurseQueueContext";

type MetricItem = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
};

const CARD_CONFIG: Omit<MetricItem, "value">[] = [
  {
    label: "Waiting for Triage",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "text-[#007bff]",
  },
  {
    label: "In Assessment",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: "text-[#007bff]",
  },
  {
    label: "Urgent",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: "text-amber-600",
  },
  {
    label: "Avg. Triage Time",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-green-600",
  },
];

export function MetricCards() {
  const { queueRows } = useNurseQueue();

  const metrics = useMemo((): MetricItem[] => {
    const waitingForTriage = queueRows.filter((r: QueueRow) => r.status === "waiting").length;
    const inAssessment = queueRows.filter((r: QueueRow) =>
      ["called", "in progress"].includes(r.status)
    ).length;
    const urgent = queueRows.filter((r: QueueRow) => r.priority === "urgent").length;

    const MINS_PER_PATIENT = 10;
    const waiting = queueRows.filter((r: QueueRow) => r.status === "waiting");
    const avgTriageMins =
      waiting.length > 0 ? Math.round((waiting.length * MINS_PER_PATIENT) / 2) : 0;

    const values = [
      String(waitingForTriage),
      String(inAssessment),
      String(urgent),
      avgTriageMins > 0 ? `~${avgTriageMins} min` : "—",
    ];

    return CARD_CONFIG.map((config, i) => ({
      ...config,
      value: values[i] ?? "—",
    }));
  }, [queueRows]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e9ecef] bg-white p-3 shadow-sm sm:gap-4 sm:p-4"
        >
          <div className={`shrink-0 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-8 sm:[&_svg]:w-8 ${m.color}`}>
            {m.icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-[#333333] sm:text-2xl">{m.value}</p>
            <p className="truncate text-xs text-[#6C757D] sm:text-sm">{m.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
