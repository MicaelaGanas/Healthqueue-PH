"use client";

import { useState, useEffect } from "react";
import { AppointmentsSummaryCards } from "./AppointmentsSummaryCards";
import { PendingBookingRequests } from "./PendingBookingRequests";
import { BookingsList } from "./BookingsList";

const APPOINTMENTS_POLL_INTERVAL_MS = 15000;

type AppointmentsContentProps = {
  onGoToVitals?: () => void;
};

export function AppointmentsContent({ onGoToVitals }: AppointmentsContentProps) {
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  // Poll so new booking requests and queue updates appear without manual refresh.
  useEffect(() => {
    const id = setInterval(() => setPendingRefreshKey((k) => k + 1), APPOINTMENTS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Manage bookings</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          Confirm pending requests to add them to Booked queue (confirmed). When the patient shows up, confirm arrival there to add them to the live queue; then record vitals in Vitals &amp; Triage—they will appear in Queue Management.
        </p>
      </div>

      <AppointmentsSummaryCards pendingRefreshKey={pendingRefreshKey} />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#333333]">Pending booking requests</h3>
        <PendingBookingRequests
          refreshTrigger={pendingRefreshKey}
          onPendingChange={() => setPendingRefreshKey((k) => k + 1)}
        />
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#333333]">Booked queue (confirmed)</h3>
        <BookingsList refreshTrigger={pendingRefreshKey} onGoToVitals={onGoToVitals} />
      </div>
    </div>
  );
}
