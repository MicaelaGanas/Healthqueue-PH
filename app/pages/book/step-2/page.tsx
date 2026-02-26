"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { Footer } from "../../../components/Footer";
import { PatientAuthGuard } from "../../../components/PatientAuthGuard";
import { BackToHome } from "../components/BackToHome";
import { StepIndicator } from "../components/StepIndicator";
import { YourInformationForm } from "./components/YourInformationForm";
import { DependentInformationForm, type Relationship } from "./components/DependentInformationForm";
import { AppointmentSummary } from "./components/AppointmentSummary";
import { Step2ActionButtons } from "./components/Step2ActionButtons";

const BOOKING_STORAGE_KEY = "healthqueue_booking";

const DEFAULT_SUMMARY = {
  department: "",
  date: "",
  requestedDate: "",
  time: "",
  preferredDoctor: "",
  bookingType: "self" as "self" | "dependent",
  relationship: "",
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
  const [beneficiaryFirstName, setBeneficiaryFirstName] = useState("");
  const [beneficiaryLastName, setBeneficiaryLastName] = useState("");
  const [beneficiaryDateOfBirth, setBeneficiaryDateOfBirth] = useState("");
  const [beneficiaryGender, setBeneficiaryGender] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [beneficiaryFirstNameError, setBeneficiaryFirstNameError] = useState("");
  const [beneficiaryLastNameError, setBeneficiaryLastNameError] = useState("");
  const [beneficiaryDateOfBirthError, setBeneficiaryDateOfBirthError] = useState("");
  const [beneficiaryGenderError, setBeneficiaryGenderError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");
  const hasAutoFilledSelf = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<string, string>;
        setSummary({
          department: stored.department ?? "",
          date: stored.date ?? "",
          requestedDate: stored.requestedDate ?? "",
          time: stored.time ?? "",
          preferredDoctor: stored.preferredDoctor ?? "",
          bookingType: (stored.bookingType === "dependent" ? "dependent" : "self") as "self" | "dependent",
          relationship: stored.relationship ?? "",
        });
        if (stored.bookingType === "dependent" && stored.relationship) {
          setRelationship((stored.relationship as Relationship) || "");
        }
      }
    } catch {
      // keep default summary
    }
  }, []);

  // Auto-fill "Your contact information" from the logged-in patient profile (once per visit), for both "for yourself" and "for another patient".
  // Depends on summary.date/requestedDate so we run after storage has been loaded.
  useEffect(() => {
    const hasLoadedFromStorage = summary.date !== "" || summary.requestedDate !== "";
    if (!hasLoadedFromStorage || hasAutoFilledSelf.current || typeof window === "undefined") return;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;

    hasAutoFilledSelf.current = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/patient-users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data.first_name != null) setFirstName(String(data.first_name).trim());
      if (data.last_name != null) setLastName(String(data.last_name).trim());
      if (data.number != null) setPhone(String(data.number).trim());
      if (data.email != null) setEmail(String(data.email).trim());
    })();
  }, [summary.bookingType, summary.date, summary.requestedDate]);

  const handleConfirm = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    let hasError = false;
    if (!trimmedFirst) { setFirstNameError("First name is required."); hasError = true; } else setFirstNameError("");
    if (!trimmedLast) { setLastNameError("Last name is required."); hasError = true; } else setLastNameError("");
    if (!trimmedPhone) { setPhoneError("Phone number is required."); hasError = true; } else setPhoneError("");
    if (!trimmedEmail) { setEmailError("Email is required."); hasError = true; } else setEmailError("");
    if (summary.bookingType === "dependent") {
      const bFirst = beneficiaryFirstName.trim();
      const bLast = beneficiaryLastName.trim();
      const bDob = beneficiaryDateOfBirth.trim();
      const bGender = beneficiaryGender.trim();
      if (!bFirst) { setBeneficiaryFirstNameError("First name is required."); hasError = true; } else setBeneficiaryFirstNameError("");
      if (!bLast) { setBeneficiaryLastNameError("Last name is required."); hasError = true; } else setBeneficiaryLastNameError("");
      if (!bDob) { setBeneficiaryDateOfBirthError("Date of birth is required."); hasError = true; } else setBeneficiaryDateOfBirthError("");
      if (!bGender) { setBeneficiaryGenderError("Gender is required."); hasError = true; } else setBeneficiaryGenderError("");
      if (!relationship) { setRelationshipError("Relationship is required."); hasError = true; } else setRelationshipError("");
    }
    if (hasError) return;
    const payload: Record<string, string> = {
      ...summary,
      bookingType: summary.bookingType,
      preferredDoctor: summary.preferredDoctor ?? "",
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phone: trimmedPhone,
      email: trimmedEmail,
    };
    if (summary.bookingType === "dependent") {
      payload.beneficiaryFirstName = beneficiaryFirstName.trim();
      payload.beneficiaryLastName = beneficiaryLastName.trim();
      payload.beneficiaryDateOfBirth = beneficiaryDateOfBirth.trim();
      payload.beneficiaryGender = beneficiaryGender.trim();
      payload.relationship = relationship;
    }
    if (typeof window !== "undefined") sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
    router.push("/pages/book/step-3");
  };

  return (
    <PatientAuthGuard>
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={2} />

        <div className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-[#333333]">Your contact information</h2>
          <p className="mt-2 text-sm text-[#6C757D]">
            We’ll use this to confirm your appointment request.
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
            onFirstNameChange={(v) => { setFirstName(v); setFirstNameError(""); }}
            onLastNameChange={(v) => { setLastName(v); setLastNameError(""); }}
            onPhoneChange={(v) => { setPhone(v); setPhoneError(""); }}
            onEmailChange={(v) => { setEmail(v); setEmailError(""); }}
          />

          {summary.bookingType === "dependent" && (
            <DependentInformationForm
              firstName={beneficiaryFirstName}
              lastName={beneficiaryLastName}
              dateOfBirth={beneficiaryDateOfBirth}
              gender={beneficiaryGender}
              relationship={relationship}
              firstNameError={beneficiaryFirstNameError}
              lastNameError={beneficiaryLastNameError}
              dateOfBirthError={beneficiaryDateOfBirthError}
              genderError={beneficiaryGenderError}
              relationshipError={relationshipError}
              onFirstNameChange={(v) => { setBeneficiaryFirstName(v); setBeneficiaryFirstNameError(""); }}
              onLastNameChange={(v) => { setBeneficiaryLastName(v); setBeneficiaryLastNameError(""); }}
              onDateOfBirthChange={(v) => { setBeneficiaryDateOfBirth(v); setBeneficiaryDateOfBirthError(""); }}
              onGenderChange={(v) => { setBeneficiaryGender(v); setBeneficiaryGenderError(""); }}
              onRelationshipChange={(v) => { setRelationship(v); setRelationshipError(""); }}
            />
          )}

          <AppointmentSummary summary={summary} />

          <Step2ActionButtons onConfirm={handleConfirm} />
        </div>
      </main>

        <Footer />
      </div>
    </PatientAuthGuard>
  );
}
