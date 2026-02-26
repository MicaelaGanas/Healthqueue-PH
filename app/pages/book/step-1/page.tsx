"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toYYYYMMDD } from "../../../lib/schedule";
import { parseTimeTo24 } from "../../../lib/queueBookedStorage";
import { formatSlotDisplay } from "../../../lib/slotTimes";
import { compareYmd, getWeekStartYYYYMMDD } from "../../../lib/departmentBooking";
import { Footer } from "../../../components/Footer";
import { PatientAuthGuard } from "../../../components/PatientAuthGuard";
import { BackToHome } from "../components/BackToHome";
import { StepIndicator } from "../components/StepIndicator";
import { BookingTypeCard, type BookingType } from "./components/BookingTypeCard";
import { SelectDateCard } from "./components/SelectDateCard";
import { SelectDepartmentCard } from "./components/SelectDepartmentCard";
import { PreferDoctorCard } from "./components/PreferDoctorCard";
import { SelectTimeCard } from "./components/SelectTimeCard";

const BOOKING_STORAGE_KEY = "healthqueue_booking";
const BOOKING_SUBMITTED_KEY = "healthqueue_booking_submitted";
const WEEKDAYS = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(",");
const MONTHS = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");

function formatDateForSummary(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function BookStep1Page() {
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType>("self");
  const [relationship, setRelationship] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [preferredDoctor, setPreferredDoctor] = useState("");
  const [takenTimes24, setTakenTimes24] = useState<string[]>([]);
  const [timeSlotsDisplay, setTimeSlotsDisplay] = useState<string[]>([]);
  const [departmentRules, setDepartmentRules] = useState<{
    currentWeekStart: string;
    openWeekStarts: string[];
  } | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const dateStr = selectedDate ? toYYYYMMDD(selectedDate) : null;
  const disabledSlots = useMemo(
    () =>
      dateStr == null || timeSlotsDisplay.length === 0
        ? []
        : timeSlotsDisplay.filter((display) => takenTimes24.includes(parseTimeTo24(display))),
    [dateStr, timeSlotsDisplay, takenTimes24]
  );

  const handleDepartmentChange = (nextDepartment: string) => {
    setDepartment(nextDepartment);
    setSelectedDate(null);
    setSelectedTime("");
    setTakenTimes24([]);
    setTimeSlotsDisplay([]);
    setDepartmentRules(null);
    setRulesError(null);
    setAvailabilityError(null);
    setRulesLoading(Boolean(nextDepartment && nextDepartment !== "—"));
  };

  const handleDateChange = (nextDate: Date | null) => {
    setSelectedDate(nextDate);
    setSelectedTime("");
    setAvailabilityError(null);
    setTakenTimes24([]);
    setTimeSlotsDisplay([]);
  };

  useEffect(() => {
    if (!department || department === "—") return;
    let cancelled = false;

    fetch(`/api/availability/department-rules?department=${encodeURIComponent(department)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load department schedule."))))
      .then((data) => {
        if (cancelled) return;
        setDepartmentRules({
          currentWeekStart: String(data.currentWeekStart ?? ""),
          openWeekStarts: Array.isArray(data.openWeekStarts)
            ? data.openWeekStarts.map((v: unknown) => String(v))
            : [],
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setDepartmentRules(null);
        setRulesError(error instanceof Error ? error.message : "Failed to load department schedule.");
      })
      .finally(() => {
        if (!cancelled) setRulesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [department]);

  const isDateAllowedForDepartment = (d: Date) => {
    if (!department || department === "—") return true;
    if (!departmentRules) return false;
    const dateYmd = toYYYYMMDD(d);
    const weekStart = getWeekStartYYYYMMDD(dateYmd);
    if (!weekStart) return false;
    if (compareYmd(weekStart, departmentRules.currentWeekStart) === 0) return true;
    return departmentRules.openWeekStarts.includes(weekStart);
  };

  useEffect(() => {
    if (!dateStr || !department || department === "—") return;
    let cancelled = false;
    fetch(
      `/api/availability/slots?date=${encodeURIComponent(dateStr)}&department=${encodeURIComponent(department)}`
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load available slots."))))
      .then((data) => {
        if (cancelled) return;
        const slots24 = Array.isArray(data.timeSlots24)
          ? data.timeSlots24.map((v: unknown) => String(v))
          : [];
        const taken24 = Array.isArray(data.takenTimes)
          ? data.takenTimes.map((v: unknown) => String(v))
          : [];
        setTimeSlotsDisplay(slots24.map((t: string) => formatSlotDisplay(t)));
        setTakenTimes24(taken24);
        setAvailabilityError(data.isDepartmentReady === false ? String(data.reason ?? "") : null);
      })
      .catch(() => {
        if (cancelled) return;
        setTakenTimes24([]);
        setTimeSlotsDisplay([]);
        setAvailabilityError("Failed to load available slots.");
      });
    return () => {
      cancelled = true;
    };
  }, [dateStr, department]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime || disabledSlots.includes(selectedTime)) return;
    if (bookingType === "dependent" && !relationship) return;
    const dateStr = formatDateForSummary(selectedDate);
    const requestedDate = toYYYYMMDD(selectedDate);
    const payload: Record<string, string> = {
      bookingType,
      department: department || "—",
      date: dateStr,
      requestedDate: requestedDate ?? "",
      time: selectedTime,
      preferredDoctor: preferredDoctor.trim() || "—",
    };
    if (bookingType === "dependent" && relationship) payload.relationship = relationship;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(BOOKING_SUBMITTED_KEY);
      sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
    }
    router.push("/pages/book/step-2");
  };

  const canContinue =
    selectedDate != null &&
    selectedTime !== "" &&
    !disabledSlots.includes(selectedTime) &&
    (bookingType === "self" || (bookingType === "dependent" && relationship !== ""));

  return (
    <PatientAuthGuard>
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={1} />

        <div className="mt-8">
          <BookingTypeCard
            value={bookingType}
            onChange={setBookingType}
            relationship={relationship as "child" | "parent" | "spouse" | "elder" | "other" | ""}
            onRelationshipChange={(v) => setRelationship(v)}
          />
        </div>

        <div className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-10">
            <div className="md:w-1/2 md:min-w-0">
              <SelectDepartmentCard value={department} onChange={handleDepartmentChange} />
              <div className="mt-8">
                <SelectDateCard
                  value={selectedDate}
                  onChange={handleDateChange}
                  isDateSelectable={isDateAllowedForDepartment}
                  helperText={
                    !department || department === "—"
                      ? "Choose a department to check which future weeks are open."
                      : rulesLoading
                        ? "Loading department schedule…"
                        : rulesError
                          ? rulesError
                          : "Current week is available. Future weeks must be opened by admin first."
                  }
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-6 md:w-1/2 md:min-w-0">
              <PreferDoctorCard
                department={department || "—"}
                value={preferredDoctor}
                onChange={setPreferredDoctor}
              />
              <SelectTimeCard
                value={selectedTime}
                onChange={setSelectedTime}
                timeSlots={timeSlotsDisplay}
                disabledSlots={disabledSlots}
                selectionDisabled={!department || department === "—"}
              />
              {availabilityError && (
                <p className="-mt-2 text-sm text-[#6C757D]">{availabilityError}</p>
              )}
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
      </main>

        <Footer />
      </div>
    </PatientAuthGuard>
  );
}
