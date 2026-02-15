"use client";

import { useState } from "react";
import { AppointmentsSummaryCards } from "./AppointmentsSummaryCards";
import { AppointmentsCalendar } from "./AppointmentsCalendar";
import { TodayAppointmentsList } from "./TodayAppointmentsList";
import { ScheduleNewAppointmentModal } from "./ScheduleNewAppointmentModal";

export function AppointmentsContent() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ScheduleNewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Appointments</h2>
          <p className="mt-0.5 text-sm text-[#6C757D]">
            Manage patient appointments and schedules
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007bff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0069d9]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          New Appointment
        </button>
      </div>

      <AppointmentsSummaryCards />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AppointmentsCalendar />
        <TodayAppointmentsList />
      </div>
    </div>
  );
}
