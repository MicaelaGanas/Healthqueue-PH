"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "../../../components/common/Navbar";
import { Footer } from "../../../components/common/Footer";
import { BackToHome } from "../components/BackToHome";
import { StepIndicator } from "../components/StepIndicator";
import { ConfirmationDetails } from "./components/ConfirmationDetails";
import { ConfirmationDisclaimer } from "./components/ConfirmationDisclaimer";
import { ConfirmationActions } from "./components/ConfirmationActions";

const BOOKING_STORAGE_KEY = "healthqueue_booking";

type BookingData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  department?: string;
  date?: string;
  time?: string;
  preferredDoctor?: string;
};

const DEFAULT_CONFIRMATION = {
  referenceNo: "APT-2026-0131-001",
  department: "Pediatrics",
  date: "2/4/2026",
  time: "1:30 PM",
};

function getDisplayName(booking: BookingData | null): string {
  if (!booking) return "—";
  const first = (booking.firstName ?? "").trim();
  const last = (booking.lastName ?? "").trim();
  if (!first && !last) return "—";
  return [first, last].filter(Boolean).join(" ");
}

export default function BookStep3Page() {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [referenceNo] = useState(DEFAULT_CONFIRMATION.referenceNo);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BookingData;
        setBooking(parsed);
      }
    } catch {
      setBooking(null);
    }
  }, []);

  const department = booking?.department ?? DEFAULT_CONFIRMATION.department;
  const date = booking?.date ?? DEFAULT_CONFIRMATION.date;
  const time = booking?.time ?? DEFAULT_CONFIRMATION.time;
  const preferredDoctor = (booking?.preferredDoctor ?? "").trim() || undefined;
  const name = getDisplayName(booking);
  const phone = (booking?.phone ?? "").trim() || "—";
  const email = (booking?.email ?? "").trim();

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={3} />

        <div className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-center text-xl font-bold text-[#333333] sm:text-2xl">
            Appointment Request Submitted
          </h2>
          <p className="mt-3 text-center text-[#333333]">
            Your schedule request has been sent to the doctor&apos;s office. Final confirmation will
            be sent to your email or the office will call your phone.
          </p>

          <ConfirmationDetails
            referenceNo={referenceNo}
            name={name}
            phone={phone}
            email={email}
            department={department}
            date={date}
            time={time}
            preferredDoctor={preferredDoctor}
          />

          <ConfirmationDisclaimer />

          <ConfirmationActions />
        </div>
      </main>

      <Footer />
    </div>
  );
}
