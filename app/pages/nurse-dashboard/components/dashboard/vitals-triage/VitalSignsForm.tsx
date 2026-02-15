"use client";

import { useState } from "react";

const SEVERITY_OPTIONS = ["Select severity", "Mild", "Moderate", "Severe", "Critical"];

export function VitalSignsForm() {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("72");
  const [temperature, setTemperature] = useState("36.5");
  const [o2Sat, setO2Sat] = useState("98");
  const [respRate, setRespRate] = useState("16");
  const [severity, setSeverity] = useState("");

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#007bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-lg font-bold text-[#333333]">Vital Signs & Triage Assessment</h2>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[#007bff] bg-white px-4 py-2 text-sm font-medium text-[#007bff] hover:bg-[#007bff] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Auto-Read from Device
        </button>
      </div>
      <p className="mb-4 text-sm text-[#6C757D]">
        Recording vitals for: <span className="font-semibold text-[#333333]">Maria Santos (TRG-001)</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#333333]">Blood Pressure (mmHg)</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              placeholder="Systolic"
              className="w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
            <input
              type="text"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              placeholder="Diastolic"
              className="w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Heart Rate (bpm)</label>
          <input
            type="text"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Temperature (°C)</label>
          <input
            type="text"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">O₂ Saturation (%)</label>
          <input
            type="text"
            value={o2Sat}
            onChange={(e) => setO2Sat(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Respiratory Rate (/min)</label>
          <input
            type="text"
            value={respRate}
            onChange={(e) => setRespRate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">Symptom Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt === "Select severity" ? "" : opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#007bff] py-3 font-medium text-white hover:bg-[#0069d9]"
      >
        Save Vitals & Calculate Risk
      </button>
    </div>
  );
}
