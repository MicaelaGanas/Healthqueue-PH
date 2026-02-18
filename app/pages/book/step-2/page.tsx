"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  bookingType: "self" as "self" | "dependent",
  department: "",
  date: "",
  requestedDate: "",
  time: "",
  preferredDoctor: "",
  relationship: "" as string,
};

export default function BookStep2Page() {
  const router = useRouter();
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [beneficiaryFirstName, setBeneficiaryFirstName] = useState("");
  const [beneficiaryLastName, setBeneficiaryLastName] = useState("");
  const [beneficiaryDob, setBeneficiaryDob] = useState("");
  const [beneficiaryGender, setBeneficiaryGender] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [beneficiaryFirstError, setBeneficiaryFirstError] = useState("");
  const [beneficiaryLastError, setBeneficiaryLastError] = useState("");
  const [beneficiaryDobError, setBeneficiaryDobError] = useState("");
  const [beneficiaryGenderError, setBeneficiaryGenderError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<string, string>;
        setSummary({
          bookingType: stored.bookingType === "dependent" ? "dependent" : "self",
          department: stored.department ?? "",
          date: stored.date ?? "",
          requestedDate: stored.requestedDate ?? "",
          time: stored.time ?? "",
          preferredDoctor: stored.preferredDoctor ?? "",
          relationship: stored.relationship ?? "",
        });
        if (stored.relationship && (stored.bookingType === "dependent")) {
          setRelationship(stored.relationship as Relationship);
        }
      }
    } catch {
      // keep default summary
    }
  }, []);

  const isDependent = summary.bookingType === "dependent";

  const handleConfirm = () => {
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    let hasError = false;

    if (isDependent) {
      const bFirst = beneficiaryFirstName.trim();
      const bLast = beneficiaryLastName.trim();
      const bDob = beneficiaryDob.trim();
      const bGender = beneficiaryGender.trim();
      if (!bFirst) { setBeneficiaryFirstError("First name is required."); hasError = true; } else setBeneficiaryFirstError("");
      if (!bLast) { setBeneficiaryLastError("Last name is required."); hasError = true; } else setBeneficiaryLastError("");
      if (!bDob) { setBeneficiaryDobError("Date of birth is required."); hasError = true; } else setBeneficiaryDobError("");
      if (!bGender) { setBeneficiaryGenderError("Gender is required."); hasError = true; } else setBeneficiaryGenderError("");
      if (!relationship) { setRelationshipError("Please select relationship to you."); hasError = true; } else setRelationshipError("");
      if (!trimmedPhone) { setPhoneError("Phone number is required."); hasError = true; } else setPhoneError("");
      if (!trimmedEmail) { setEmailError("Email is required."); hasError = true; } else setEmailError("");
      if (hasError) return;
      const payload = {
        ...summary,
        bookingType: "dependent",
        beneficiaryFirstName: bFirst,
        beneficiaryLastName: bLast,
        beneficiaryDateOfBirth: bDob,
        beneficiaryGender: bGender,
        relationship: relationship || undefined,
        phone: trimmedPhone,
        email: trimmedEmail,
      };
      if (typeof window !== "undefined") sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
      router.push("/pages/book/step-3");
      return;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst) { setFirstNameError("First name is required."); hasError = true; } else setFirstNameError("");
    if (!trimmedLast) { setLastNameError("Last name is required."); hasError = true; } else setLastNameError("");
    if (!trimmedPhone) { setPhoneError("Phone number is required."); hasError = true; } else setPhoneError("");
    if (!trimmedEmail) { setEmailError("Email is required."); hasError = true; } else setEmailError("");
    if (hasError) return;
    const payload = {
      ...summary,
      bookingType: "self",
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phone: trimmedPhone,
      email: trimmedEmail,
    };
    if (typeof window !== "undefined") sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
    router.push("/pages/book/step-3");
  };

  return (
    <PatientAuthGuard>
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Booking an Appointment</h1>
        <p className="mt-2 text-[#6C757D]">Schedule your visit to reduce wait time</p>

        <StepIndicator currentStep={2} />

        <div className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-[#333333]">
            {isDependent ? "Who is this appointment for?" : "Your Information"}
          </h2>
          <p className="mt-2 text-sm text-[#6C757D]">
            {isDependent
              ? "Enter the person's details. Your contact info is used so the office can reach you about this request."
              : "This sends a schedule request to the doctor's office. Final confirmation will be sent to your email or the office will call. Use the same phone and email when you visit."}
          </p>

          {isDependent ? (
            <>
              <DependentInformationForm
                firstName={beneficiaryFirstName}
                lastName={beneficiaryLastName}
                dateOfBirth={beneficiaryDob}
                gender={beneficiaryGender}
                relationship={relationship}
                firstNameError={beneficiaryFirstError}
                lastNameError={beneficiaryLastError}
                dateOfBirthError={beneficiaryDobError}
                genderError={beneficiaryGenderError}
                onFirstNameChange={(v) => { setBeneficiaryFirstName(v); setBeneficiaryFirstError(""); }}
                onLastNameChange={(v) => { setBeneficiaryLastName(v); setBeneficiaryLastError(""); }}
                onDateOfBirthChange={(v) => { setBeneficiaryDob(v); setBeneficiaryDobError(""); }}
                onGenderChange={(v) => { setBeneficiaryGender(v); setBeneficiaryGenderError(""); }}
                onRelationshipChange={(v) => { setRelationship(v); setRelationshipError(""); }}
                relationshipError={relationshipError}
              />
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-[#333333]">Your phone <span className="text-[#dc3545]">*</span></label>
                  <input id="contact-phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }} className={`mt-2 w-full rounded-lg border bg-white px-4 py-3 ${phoneError ? "border-[#dc3545]" : "border-[#dee2e6]"}`} />
                  {phoneError && <p className="mt-1 text-sm text-[#dc3545]">{phoneError}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-[#333333]">Your email <span className="text-[#dc3545]">*</span></label>
                  <input id="contact-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} className={`mt-2 w-full rounded-lg border bg-white px-4 py-3 ${emailError ? "border-[#dc3545]" : "border-[#dee2e6]"}`} />
                  {emailError && <p className="mt-1 text-sm text-[#dc3545]">{emailError}</p>}
                </div>
              </div>
            </>
          ) : (
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
