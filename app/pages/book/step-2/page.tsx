"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { Footer } from "../../../components/Footer";
import { BackToHome } from "../components/BackToHome";
import { StepIndicator } from "../components/StepIndicator";
import { YourInformationForm } from "./components/YourInformationForm";
import { AppointmentSummary } from "./components/AppointmentSummary";
import { Step2ActionButtons } from "./components/Step2ActionButtons";

const BOOKING_STORAGE_KEY = "healthqueue_booking";

const DEFAULT_SUMMARY = {
  department: "—",
  date: "—",
  time: "—",
  preferredDoctor: "—",
};

export default function BookStep2Page() {
  const router = useRouter();
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<string, string>;
        setSummary({
          department: stored.department ?? DEFAULT_SUMMARY.department,
          date: stored.date ?? DEFAULT_SUMMARY.date,
          time: stored.time ?? DEFAULT_SUMMARY.time,
          preferredDoctor: stored.preferredDoctor ?? DEFAULT_SUMMARY.preferredDoctor,
        });
      }
    } catch {
      // keep default summary
    }
  }, []);

  const handleConfirm = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    let hasError = false;
    if (!trimmedFirst) {
      setFirstNameError("First name is required.");
      hasError = true;
    } else setFirstNameError("");
    if (!trimmedLast) {
      setLastNameError("Last name is required.");
      hasError = true;
    } else setLastNameError("");
    if (!trimmedPhone) {
      setPhoneError("Phone number is required.");
      hasError = true;
    } else setPhoneError("");
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    } else setEmailError("");

    if (hasError) return;

    const payload = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phone: trimmedPhone,
      email: trimmedEmail,
      department: summary.department,
      date: summary.date,
      time: summary.time,
      preferredDoctor: summary.preferredDoctor,
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
    }
    router.push("/pages/book/step-3");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={2} />

        <div className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-[#333333]">Your Information</h2>
          <p className="mt-2 text-sm text-[#6C757D]">
            This sends a schedule request to the doctor&apos;s office. Final confirmation of your
            appointment will be sent to your email or the office will call your phone. Use the same
            phone and email when you visit so we can match this request to your record.
          </p>

          <YourInformationForm
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            email={email}
            firstNameError={firstNameError}
            lastNameError={lastNameError}
            phoneError={phoneError}
            emailError={emailError}
            onFirstNameChange={(v) => {
              setFirstName(v);
              if (firstNameError) setFirstNameError("");
            }}
            onLastNameChange={(v) => {
              setLastName(v);
              if (lastNameError) setLastNameError("");
            }}
            onPhoneChange={(v) => {
              setPhone(v);
              if (phoneError) setPhoneError("");
            }}
            onEmailChange={(v) => {
              setEmail(v);
              if (emailError) setEmailError("");
            }}
          />

          <AppointmentSummary summary={summary} />

          <Step2ActionButtons onConfirm={handleConfirm} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
