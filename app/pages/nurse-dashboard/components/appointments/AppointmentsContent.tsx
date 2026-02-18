"use client";

import { useState } from "react";
import { AppointmentsSummaryCards } from "./AppointmentsSummaryCards";
import { PendingBookingRequests } from "./PendingBookingRequests";
import { BookingsList } from "./BookingsList";

type AppointmentsContentProps = {
  onGoToVitals?: () => void;
};

export function AppointmentsContent({ onGoToVitals }: AppointmentsContentProps) {
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Manage bookings</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          Pending requests need your confirmation before they are added to the queue. Confirm to add the patient to the booked queue; they will appear in Queue Management. To add a walk-in, use Registration and Queue Management.
        </p>
      </div>

      <AppointmentsSummaryCards pendingRefreshKey={pendingRefreshKey} />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#333333]">Pending booking requests</h3>
        <PendingBookingRequests onPendingChange={() => setPendingRefreshKey((k) => k + 1)} />
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#333333]">Booked queue (confirmed)</h3>
        <BookingsList onGoToVitals={onGoToVitals} />
      </div>
    </div>
  );
}
