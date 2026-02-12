"use client";

import React from "react";

const inputBase =
  "mt-2 w-full rounded-lg border bg-white px-4 py-3 text-[#333333] placeholder-[#6C757D] focus:outline-none focus:ring-1 focus:ring-[#007bff]";
const inputError = "border-[#dc3545]";
const inputNormal = "border-[#dee2e6]";

type Props = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  firstNameError: string;
  lastNameError: string;
  phoneError: string;
  emailError: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
};

export function YourInformationForm({
  firstName,
  lastName,
  phone,
  email,
  firstNameError,
  lastNameError,
  phoneError,
  emailError,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onEmailChange,
}: Props) {
  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="first-name" className="block text-sm font-medium text-[#333333]">
          First Name <span className="text-[#dc3545]">*</span>
        </label>
        <input
          id="first-name"
          type="text"
          required
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          className={`${inputBase} ${firstNameError ? inputError : inputNormal}`}
          placeholder=""
        />
        {firstNameError && (
          <p className="mt-1 text-sm text-[#dc3545]" role="alert">
            {firstNameError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="last-name" className="block text-sm font-medium text-[#333333]">
          Last Name <span className="text-[#dc3545]">*</span>
        </label>
        <input
          id="last-name"
          type="text"
          required
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          className={`${inputBase} ${lastNameError ? inputError : inputNormal}`}
          placeholder=""
        />
        {lastNameError && (
          <p className="mt-1 text-sm text-[#dc3545]" role="alert">
            {lastNameError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-[#333333]">
          Phone Number <span className="text-[#dc3545]">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={`${inputBase} ${phoneError ? inputError : inputNormal}`}
          placeholder=""
        />
        {phoneError && (
          <p className="mt-1 text-sm text-[#dc3545]" role="alert">
            {phoneError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#333333]">
          Email <span className="text-[#dc3545]">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={`${inputBase} ${emailError ? inputError : inputNormal}`}
          placeholder=""
        />
        {emailError && (
          <p className="mt-1 text-sm text-[#dc3545]" role="alert">
            {emailError}
          </p>
        )}
      </div>
    </div>
  );
}
