"use client";

import React, { useEffect, useState, useRef } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { parseTimeTo24 } from "../../../lib/queueBookedStorage";
import { Navbar } from "../../../components/Navbar";
import { Footer } from "../../../components/Footer";
import { PatientAuthGuard } from "../../../components/PatientAuthGuard";
import { BackToHome } from "../components/BackToHome";
import { StepIndicator } from "../components/StepIndicator";
import { ConfirmationDetails } from "./components/ConfirmationDetails";
import { ConfirmationDisclaimer } from "./components/ConfirmationDisclaimer";
import { ConfirmationActions } from "./components/ConfirmationActions";

const BOOKING_STORAGE_KEY = "healthqueue_booking";

type BookingData = {
  bookingType?: "self" | "dependent";
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  department?: string;
  date?: string;
  requestedDate?: string;
  time?: string;
  preferredDoctor?: string;
  beneficiaryFirstName?: string;
  beneficiaryLastName?: string;
  beneficiaryDateOfBirth?: string;
  beneficiaryGender?: string;
  relationship?: string;
};

const DEFAULT_CONFIRMATION = { referenceNo: "", department: "", date: "", time: "" };

function getDisplayName(booking: BookingData | null): string {
  if (!booking) return "—";
  if (booking.bookingType === "dependent" && booking.beneficiaryFirstName != null && booking.beneficiaryLastName != null) {
    return [booking.beneficiaryFirstName.trim(), booking.beneficiaryLastName.trim()].filter(Boolean).join(" ") || "—";
  }
  const first = (booking.firstName ?? "").trim();
  const last = (booking.lastName ?? "").trim();
  if (!first && !last) return "—";
  return [first, last].filter(Boolean).join(" ");
}

export default function BookStep3Page() {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [referenceNo, setReferenceNo] = useState(DEFAULT_CONFIRMATION.referenceNo);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasSubmitted = useRef(false);

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

  useEffect(() => {
    if (!booking || hasSubmitted.current || typeof window === "undefined") return;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;

    hasSubmitted.current = true;
    setSubmitting(true);
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSubmitError("Please sign in again to submit your request.");
        setSubmitting(false);
        return;
      }
      const department = (booking.department ?? "").trim() || "General Medicine";
      const requestedDate = (booking.requestedDate ?? "").trim();
      const timeStr = (booking.time ?? "").trim();
      if (!requestedDate || !timeStr) {
        setSubmitError("Missing date or time.");
        setSubmitting(false);
        return;
      }
      const preferredDoc = (booking.preferredDoctor ?? "").trim();
      const body: Record<string, unknown> = {
        bookingType: booking.bookingType === "dependent" ? "dependent" : "self",
        department,
        requestedDate,
        requestedTime: parseTimeTo24(timeStr),
        preferredDoctor: preferredDoc && preferredDoc !== "—" ? preferredDoc : undefined,
      };
      if (booking.bookingType === "dependent") {
        body.beneficiaryFirstName = (booking.beneficiaryFirstName ?? "").trim();
        body.beneficiaryLastName = (booking.beneficiaryLastName ?? "").trim();
        body.beneficiaryDateOfBirth = (booking.beneficiaryDateOfBirth ?? "").trim();
        body.beneficiaryGender = (booking.beneficiaryGender ?? "").trim();
        const rel = (booking.relationship ?? "").trim();
        body.relationship = rel ? (rel === "elder" ? "other" : rel) : undefined;
      }
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit request.");
        return;
      }
      setReferenceNo(data.referenceNo ?? data.reference_no ?? "");
    })();
  }, [booking]);

  const department = booking?.department ?? "";
  const date = booking?.date ?? "";
  const time = booking?.time ?? "";
  const preferredDoctor = (booking?.preferredDoctor ?? "").trim() || undefined;
  const name = getDisplayName(booking);
  const phone = (booking?.phone ?? "").trim() || "—";
  const email = (booking?.email ?? "").trim();

  return (
    <PatientAuthGuard>
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={3} />

        <div className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-center text-xl font-bold text-[#333333] sm:text-2xl">
            {submitting ? "Submitting request…" : referenceNo ? "Appointment request submitted" : submitError ? "Something went wrong" : "Preparing…"}
          </h2>
          {submitError && (
            <p className="mt-3 text-center text-[#dc3545]">{submitError}</p>
          )}
          <p className="mt-3 text-center text-[#333333]">
            {referenceNo
              ? "Your request is pending confirmation by the doctor's office. You will be notified by email or phone once it is confirmed. Use your reference number when you visit."
              : !submitError && !submitting
                ? "Loading…"
                : !submitError
                  ? "Sending your request…"
                  : null}
          </p>

          {referenceNo && (
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
          )}

          {referenceNo && (
            <>
              <ConfirmationDisclaimer />
              <ConfirmationActions />
            </>
          )}
        </div>
      </main>

        <Footer />
      </div>
    </PatientAuthGuard>
  );
}
