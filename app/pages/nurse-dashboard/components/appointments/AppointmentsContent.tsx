"use client";

import { AppointmentsSummaryCards } from "./AppointmentsSummaryCards";
import { BookingsList } from "./BookingsList";

type AppointmentsContentProps = {
  onGoToVitals?: () => void;
};

export function AppointmentsContent({ onGoToVitals }: AppointmentsContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Manage bookings</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          Review and manage patient booking requests. Confirm a booking to send the patient to Vitals & Triage. These patients booked online and are already in the queue. Manage them by department and doctor in Queue Management. To add a patient (e.g. walk-in), use Registration and Queue Management.
        </p>
      </div>

      <AppointmentsSummaryCards />

      <BookingsList onGoToVitals={onGoToVitals} />
    </div>
  );
}
