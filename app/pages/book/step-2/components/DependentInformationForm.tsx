"use client";

import React from "react";

const inputBase =
  "mt-2 w-full rounded-lg border bg-white px-4 py-3 text-[#333333] placeholder-[#6C757D] focus:outline-none focus:ring-1 focus:ring-[#007bff]";
const inputError = "border-[#dc3545]";
const inputNormal = "border-[#dee2e6]";

export type Relationship = "child" | "parent" | "spouse" | "elder" | "other";

type Props = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationship: Relationship | "";
  firstNameError: string;
  lastNameError: string;
  dateOfBirthError: string;
  genderError: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onDateOfBirthChange: (v: string) => void;
  onGenderChange: (v: string) => void;
  relationshipError?: string;
  onRelationshipChange: (v: Relationship | "") => void;
};

export function DependentInformationForm({
  firstName,
  lastName,
  dateOfBirth,
  gender,
  relationship,
  firstNameError,
  lastNameError,
  dateOfBirthError,
  genderError,
  relationshipError = "",
  onFirstNameChange,
  onLastNameChange,
  onDateOfBirthChange,
  onGenderChange,
  onRelationshipChange,
}: Props) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-[#6C757D]">
        Enter the details of the person who will attend the appointment (e.g. your child or elder).
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="dep-first-name" className="block text-sm font-medium text-[#333333]">
            First name <span className="text-[#dc3545]">*</span>
          </label>
          <input
            id="dep-first-name"
            type="text"
            required
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className={`${inputBase} ${firstNameError ? inputError : inputNormal}`}
          />
          {firstNameError && <p className="mt-1 text-sm text-[#dc3545]" role="alert">{firstNameError}</p>}
        </div>
        <div>
          <label htmlFor="dep-last-name" className="block text-sm font-medium text-[#333333]">
            Last name <span className="text-[#dc3545]">*</span>
          </label>
          <input
            id="dep-last-name"
            type="text"
            required
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className={`${inputBase} ${lastNameError ? inputError : inputNormal}`}
          />
          {lastNameError && <p className="mt-1 text-sm text-[#dc3545]" role="alert">{lastNameError}</p>}
        </div>
        <div>
          <label htmlFor="dep-dob" className="block text-sm font-medium text-[#333333]">
            Date of birth <span className="text-[#dc3545]">*</span>
          </label>
          <input
            id="dep-dob"
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => onDateOfBirthChange(e.target.value)}
            className={`${inputBase} ${dateOfBirthError ? inputError : inputNormal}`}
          />
          {dateOfBirthError && <p className="mt-1 text-sm text-[#dc3545]" role="alert">{dateOfBirthError}</p>}
        </div>
        <div>
          <label htmlFor="dep-gender" className="block text-sm font-medium text-[#333333]">
            Gender <span className="text-[#dc3545]">*</span>
          </label>
          <select
            id="dep-gender"
            value={gender}
            onChange={(e) => onGenderChange(e.target.value)}
            className={`${inputBase} ${genderError ? inputError : inputNormal}`}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {genderError && <p className="mt-1 text-sm text-[#dc3545]" role="alert">{genderError}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="dep-relationship" className="block text-sm font-medium text-[#333333]">
            Relationship to you <span className="text-[#dc3545]">*</span>
          </label>
          <select
            id="dep-relationship"
            value={relationship}
            onChange={(e) => onRelationshipChange((e.target.value || "") as Relationship | "")}
            className={`${inputBase} ${relationshipError ? inputError : inputNormal}`}
          >
            <option value="">Select</option>
            <option value="child">My child</option>
            <option value="parent">My parent</option>
            <option value="spouse">My spouse</option>
            <option value="elder">Elder (e.g. grandparent)</option>
            <option value="other">Other</option>
          </select>
          {relationshipError && <p className="mt-1 text-sm text-[#dc3545]" role="alert">{relationshipError}</p>}
        </div>
      </div>
    </div>
  );
}
