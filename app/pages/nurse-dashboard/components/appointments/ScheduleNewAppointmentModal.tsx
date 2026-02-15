"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type ScheduleNewAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
};

import { DEPARTMENTS as DEPT_LIST } from "../../../../lib/departments";

const DOCTORS = ["Select doctor", "Dr. Jose Rizal", "Dr. Maria Clara", "Dr. Andres Bonifacio", "Dr. Emilio Aguinaldo"];
const DEPARTMENTS = ["Select department", ...DEPT_LIST];
const TYPES = ["Select type", "consultation", "follow up", "procedure"];

export function ScheduleNewAppointmentModal({ open, onClose }: ScheduleNewAppointmentModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [patientName, setPatientName] = useState("");
  const [doctor, setDoctor] = useState("");
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[#e9ecef] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#333333]">Schedule New Appointment</h3>
            <p className="mt-0.5 text-sm text-[#6C757D]">
              Fill in the details to create a new appointment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#333333]">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]">Doctor</label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {DOCTORS.map((d) => (
                <option key={d} value={d === "Select doctor" ? "" : d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d === "Select department" ? "" : d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333333]">Date</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full rounded-lg border border-[#dee2e6] px-3 py-2 pr-10 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]">Time</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="--:--"
                  className="w-full rounded-lg border border-[#dee2e6] px-3 py-2 pr-10 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]">Appointment Type</label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {TYPES.map((t) => (
                <option key={t} value={t === "Select type" ? "" : t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#dee2e6] bg-white px-4 py-2.5 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#007bff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0069d9]"
            >
              Schedule Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
