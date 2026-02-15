"use client";

import { useState } from "react";

const SYMPTOMS = [
  "Fever",
  "Cough",
  "Chest Pain",
  "Difficulty Breathing",
  "Dizziness",
  "Nausea/Vomiting",
  "Skin Rash",
  "Headache",
  "Abdominal Pain",
  "Body Weakness",
];

export function WalkInRegistration() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({});
  const [otherSymptoms, setOtherSymptoms] = useState("");

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => {
      const next = { ...prev, [s]: !prev[s] };
      if (s === "Others" && !next[s]) setOtherSymptoms("");
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-[#007bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h2 className="text-lg font-bold text-[#333333]">Walk-In Patient Registration</h2>
      </div>
      <p className="mb-4 text-sm text-[#6C757D]">
        For patients without an appointment. Add phone, email, or booking reference to link to an existing online booking or patient record.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#333333]">First Name *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Last Name *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Age *</label>
          <input
            type="text"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Sex *</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          >
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Phone (optional, for record sync)</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 09XX XXX XXXX"
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Email (optional, for record sync)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. patient@email.com"
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[#333333]">Booking reference (optional)</label>
          <input
            type="text"
            value={bookingReference}
            onChange={(e) => setBookingReference(e.target.value)}
            placeholder="e.g. APT-2026-0131-001 — if they booked online"
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-[#333333]">Symptoms (Select all that apply)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SYMPTOMS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-[#333333]">
              <input
                type="checkbox"
                checked={symptoms[s] ?? false}
                onChange={() => toggleSymptom(s)}
                className="rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]"
              />
              {s}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-[#333333]">
            <input
              type="checkbox"
              checked={symptoms["Others"] ?? false}
              onChange={() => toggleSymptom("Others")}
              className="rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]"
            />
            Others
          </label>
        </div>
        {(symptoms["Others"] ?? false) && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-[#333333]">Please specify</label>
            <input
              type="text"
              value={otherSymptoms}
              onChange={(e) => setOtherSymptoms(e.target.value)}
              placeholder="Describe other symptoms..."
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>
        )}
      </div>
      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#007bff] py-3 font-medium text-white hover:bg-[#0069d9]"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Register & Assign Queue
      </button>
    </div>
  );
}
