"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< Updated upstream
=======
import { toYYYYMMDD } from "../../../lib/schedule";
import { Navbar } from "../../../components/Navbar";
>>>>>>> Stashed changes
import { Footer } from "../../../components/Footer";
import { PatientAuthGuard } from "../../../components/PatientAuthGuard";
import { BackToHome } from "../components/BackToHome";
import { StepIndicator } from "../components/StepIndicator";
import { BookingTypeCard, type BookingType, type RelationshipChoice } from "./components/BookingTypeCard";
import { SelectDateCard } from "./components/SelectDateCard";
import { PreferDoctorCard } from "./components/PreferDoctorCard";
import { SelectDepartmentCard } from "./components/SelectDepartmentCard";
import { SelectTimeCard } from "./components/SelectTimeCard";

const BOOKING_STORAGE_KEY = "healthqueue_booking";
const WEEKDAYS = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(",");
const MONTHS = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");

function formatDateForSummary(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function BookStep1Page() {
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType>("self");
  const [relationship, setRelationship] = useState<RelationshipChoice | "">("");
  const [department, setDepartment] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [preferredDoctor, setPreferredDoctor] = useState("");

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    if (bookingType === "dependent" && !relationship) return;
    const dateStr = formatDateForSummary(selectedDate);
    const requestedDate = toYYYYMMDD(selectedDate);
    const payload: Record<string, string> = {
      bookingType,
      department: department || "—",
      date: dateStr,
      requestedDate: requestedDate ?? "",
      time: selectedTime,
      preferredDoctor: preferredDoctor || "—",
    };
    if (bookingType === "dependent" && relationship) {
      payload.relationship = relationship;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
    }
    router.push("/pages/book/step-2");
  };

  const canContinue =
    selectedDate != null &&
    selectedTime !== "" &&
    (bookingType !== "dependent" || !!relationship);

  return (
    <PatientAuthGuard>
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={1} />

        <div className="mt-8 space-y-6">
          <BookingTypeCard
            value={bookingType}
            onChange={setBookingType}
            relationship={relationship}
            onRelationshipChange={setRelationship}
          />
        <div className="rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-10">
            <div className="md:w-1/2 md:min-w-0">
              <SelectDateCard value={selectedDate} onChange={setSelectedDate} />
              <div className="mt-8">
                <SelectDepartmentCard value={department} onChange={setDepartment} />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-6 md:w-1/2 md:min-w-0">
              <PreferDoctorCard
                department={department}
                value={preferredDoctor}
                onChange={setPreferredDoctor}
              />
              <SelectTimeCard value={selectedTime} onChange={setSelectedTime} />
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className={`mt-auto w-full rounded-lg py-3 text-center font-semibold text-white ${
                  canContinue
                    ? "bg-[#007bff] hover:bg-[#0069d9]"
                    : "cursor-not-allowed bg-[#6C757D] opacity-70"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
        </div>
      </main>

        <Footer />
      </div>
    </PatientAuthGuard>
  );
}
