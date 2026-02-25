"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createSupabaseBrowser } from "../../../../../lib/supabase/client";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { QueueRow } from "../../../context/NurseQueueContext";

const SEVERITY_OPTIONS = ["Select severity", "Mild", "Moderate", "Severe", "Critical"];

/** Today as YYYY-MM-DD in local time (so nurse's "today" matches their timezone). */
function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse an ISO or YYYY-MM-DD string to local YYYY-MM-DD for comparison. Uses full timestamp when present so local date is correct in all timezones. */
function toLocalDateStr(isoOrDate?: string | null): string {
  if (!isoOrDate || typeof isoOrDate !== "string") return "";
  const s = isoOrDate.trim();
  // Full ISO timestamp (has time part): parse as instant so local date is correct (e.g. "2026-02-25T23:30:00Z" in UTC+8 → 2026-02-26).
  if (s.length > 10 || s.includes("T")) {
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  // Date-only YYYY-MM-DD: parse as local noon to avoid UTC-midnight interpretation (which can shift date in eastern timezones).
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const date = new Date(s + "T12:00:00");
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** True if this queue row is scheduled for today (appointment date or added date) in local time. */
function isScheduledForToday(r: QueueRow): boolean {
  const today = getTodayDateStr();
  const aptDate = toLocalDateStr(r.appointmentDate ?? null);
  const addedDate = toLocalDateStr(r.addedAt ?? null);
  if (aptDate) return aptDate === today;
  return addedDate === today;
}

type QueuePatient = { ticket: string; patientName: string; department: string };
type VitalsRecord = { ticket: string; patientName: string; department: string; recordedAt: string };

function formatRecordedAt(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
    " " + d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function matchPatient(q: string, p: QueuePatient) {
  const lower = q.toLowerCase().trim();
  if (!lower) return true;
  return (
    p.patientName.toLowerCase().includes(lower) ||
    p.ticket.toLowerCase().includes(lower) ||
    p.department.toLowerCase().includes(lower)
  );
}

export function VitalSignsForm() {
  const { queueRows, setPatientPriority, confirmedForTriage, clearConfirmedForTriage } = useNurseQueue();
  // Only today's patients or just-confirmed: need vitals AND (scheduled for today OR in confirmedForTriage). Avoids old patients accumulating.
  // Include todayDateStr in deps so the list updates when the date changes (e.g. past midnight while component stays mounted).
  const todayDateStr = getTodayDateStr();
  const queuePatients = useMemo<QueuePatient[]>(() => {
    const included = queueRows.filter(
      (r) =>
        r.hasVitals !== true &&
        (isScheduledForToday(r) || confirmedForTriage.includes(r.ticket))
    );
    return included.map((r) => ({ ticket: r.ticket, patientName: r.patientName, department: r.department }));
  }, [queueRows, confirmedForTriage, todayDateStr]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [vitalsCompleted, setVitalsCompleted] = useState<VitalsRecord[]>([]);
  const [vitalsLoading, setVitalsLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("72");
  const [temperature, setTemperature] = useState("36.5");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [severity, setSeverity] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchRecordedVitals = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setVitalsLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setVitalsLoading(false);
      return;
    }
    setVitalsLoading(true);
    try {
      const res = await fetch("/api/vitals", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const byTicket = new Map<string, { patientName: string; department: string; recordedAt: string }>();
        list.forEach((v: { ticket: string; patientName: string; department: string; recordedAt: string }) => {
          const existing = byTicket.get(v.ticket);
          if (!existing || new Date(v.recordedAt) > new Date(existing.recordedAt)) {
            byTicket.set(v.ticket, {
              patientName: v.patientName,
              department: v.department,
              recordedAt: formatRecordedAt(v.recordedAt),
            });
          }
        });
        setVitalsCompleted(
          Array.from(byTicket.entries()).map(([ticket, v]) => ({
            ticket,
            patientName: v.patientName,
            department: v.department,
            recordedAt: v.recordedAt,
          }))
        );
      }
    } finally {
      setVitalsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordedVitals();
  }, [fetchRecordedVitals]);

  const selectedPatient = queuePatients.find((p) => p.ticket === selectedTicket);
  const filteredPatients = queuePatients.filter((p) => matchPatient(searchQuery, p));
  const showSearchResults = searchFocused && searchQuery.trim().length >= 0;
  const checkedTickets = new Set(vitalsCompleted.map((r) => r.ticket));
  const uncheckedPatients = queuePatients.filter((p) => !checkedTickets.has(p.ticket));
  /** Patients in the list who still need vitals (show in green box so they persist after refresh). */
  const awaitingTriageRefs = useMemo(
    () => uncheckedPatients.map((p) => p.ticket),
    [uncheckedPatients]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPatient = (p: QueuePatient) => {
    setSelectedTicket(p.ticket);
    setSearchQuery("");
    setSearchFocused(false);
    // Reset form fields to default prefilled values
    setSystolic("");
    setDiastolic("");
    setHeartRate("72");
    setTemperature("36.5");
    setWeight("");
    setHeight("");
    setSeverity("");
    setSaveError("");
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient) {
      setSaveError("Please select a patient first.");
      return;
    }
    
    // Validate all required fields
    if (!systolic.trim()) {
      setSaveError("Systolic blood pressure is required.");
      return;
    }
    if (!diastolic.trim()) {
      setSaveError("Diastolic blood pressure is required.");
      return;
    }
    if (!heartRate.trim()) {
      setSaveError("Heart rate is required.");
      return;
    }
    if (!temperature.trim()) {
      setSaveError("Temperature is required.");
      return;
    }
    if (!weight.trim()) {
      setSaveError("Weight is required.");
      return;
    }
    if (!height.trim()) {
      setSaveError("Height is required.");
      return;
    }
    if (!severity || severity === "Select severity") {
      setSaveError("Symptom severity is required.");
      return;
    }
    
    setSaveError("");
    setSaving(true);
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setSaveError("Not signed in.");
      setSaving(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSaveError("Not signed in.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/vitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticket: selectedPatient.ticket,
          patientName: selectedPatient.patientName,
          department: selectedPatient.department,
          systolic: systolic.trim(),
          diastolic: diastolic.trim(),
          heartRate: heartRate.trim(),
          temperature: temperature.trim(),
          weight: weight.trim(),
          height: height.trim(),
          severity: severity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to save vitals.");
        return;
      }
      if (severity === "Severe" || severity === "Critical") setPatientPriority(selectedTicket, "urgent");
      clearConfirmedForTriage(selectedTicket);
      await fetchRecordedVitals();
      setSelectedTicket("");
      setSearchQuery("");
      setSystolic("");
      setDiastolic("");
      setSeverity("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patients awaiting triage (in queue, vitals not recorded yet — persists after refresh) */}
      {awaitingTriageRefs.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-green-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Patients awaiting triage — record vitals
          </h3>
          <p className="mb-2 text-sm text-green-800">
            These patients are in the queue and need their vitals recorded. They will stay in this list after you refresh until vitals are saved.
          </p>
          <div className="flex flex-wrap gap-2">
            {awaitingTriageRefs.map((ref) => {
              const p = queuePatients.find((x) => x.ticket === ref);
              return p ? (
                <button
                  key={ref}
                  type="button"
                  onClick={() => handleSelectPatient(p)}
                  className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100"
                >
                  {ref} — {p.patientName}
                </button>
              ) : (
                <span key={ref} className="rounded border border-green-200 bg-green-100 px-3 py-1.5 text-sm text-green-800">
                  {ref}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Section: Checked + Unchecked vitals */}
      <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#333333]">
          <svg className="h-5 w-5 text-[#28a745]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Patients checked for vitals
        </h3>
        <p className="mb-4 text-sm text-[#6C757D]">Checked = vitals recorded (saved). Unchecked = still need vitals.</p>
        {vitalsLoading && <p className="mb-2 text-xs text-[#6C757D]">Loading recorded vitals…</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Unchecked — left */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-[#6C757D]">Unchecked — need vitals ({uncheckedPatients.length})</h4>
            <p className="mb-2 text-xs text-[#6C757D]">Click a row to select that patient for vitals below.</p>
            <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
              <table className="w-full min-w-[280px] text-left text-sm text-[#333333]">
                <thead className="bg-[#f8f9fa]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Patient</th>
                    <th className="px-3 py-2 font-medium">Ticket</th>
                    <th className="px-3 py-2 font-medium">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {uncheckedPatients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-xs text-[#6C757D]">All checked</td>
                    </tr>
                  ) : (
                    uncheckedPatients.map((p) => (
                      <tr
                        key={p.ticket}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTicket(p.ticket)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedTicket(p.ticket)}
                        className="cursor-pointer border-t border-[#e9ecef] hover:bg-[#e7f1ff] focus:bg-[#e7f1ff] focus:outline-none"
                      >
                        <td className="px-3 py-2 font-medium">{p.patientName}</td>
                        <td className="px-3 py-2">{p.ticket}</td>
                        <td className="px-3 py-2 text-[#6C757D]">{p.department}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Checked — right */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-[#28a745]">Checked ({vitalsCompleted.length})</h4>
            <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
              <table className="w-full min-w-[280px] text-left text-sm text-[#333333]">
                <thead className="bg-[#f8f9fa]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Patient</th>
                    <th className="px-3 py-2 font-medium">Ticket</th>
                    <th className="px-3 py-2 font-medium">Recorded at</th>
                  </tr>
                </thead>
                <tbody>
                  {vitalsCompleted.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-xs text-[#6C757D]">None yet</td>
                    </tr>
                  ) : (
                    vitalsCompleted.map((r) => (
                      <tr key={`${r.ticket}-${r.recordedAt}`} className="border-t border-[#e9ecef]">
                        <td className="px-3 py-2 font-medium">{r.patientName}</td>
                        <td className="px-3 py-2">{r.ticket}</td>
                        <td className="px-3 py-2 text-[#6C757D]">{r.recordedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Record vitals form */}
      <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-[#007bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h2 className="text-lg font-bold text-[#333333]">Vital Signs & Triage Assessment</h2>
      </div>
      <div className="mb-4" ref={searchRef}>
        <label className="block text-sm font-medium text-[#333333]">Search patient for vitals</label>
        <div className="relative mt-1 max-w-md">
          <input
            type="text"
            value={selectedPatient ? `${selectedPatient.patientName} (${selectedPatient.ticket})` : searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTicket("");
            }}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search by name, ticket, or department..."
            className="w-full rounded-lg border border-[#dee2e6] py-2 pl-10 pr-3 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
          <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6C757D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {showSearchResults && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#dee2e6] bg-white py-1 shadow-lg">
              {filteredPatients.length === 0 ? (
                <li className="px-4 py-3 text-sm text-[#6C757D]">No patients match.</li>
              ) : (
                filteredPatients.map((p) => (
                  <li
                    key={p.ticket}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPatient(p)}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectPatient(p)}
                    className="cursor-pointer px-4 py-2.5 text-sm hover:bg-[#e7f1ff] focus:bg-[#e7f1ff] focus:outline-none"
                  >
                    <span className="font-medium text-[#333333]">{p.patientName}</span>
                    <span className="text-[#6C757D]"> — {p.ticket} · {p.department}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      <p className="mb-4 text-sm text-[#6C757D]">
        {selectedPatient ? (
          <>
            Recording vitals for: <span className="font-semibold text-[#333333]">{selectedPatient.patientName} ({selectedPatient.ticket})</span>
          </>
        ) : (
          "Search and select a patient above to record their vital signs."
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#333333]">
            Blood Pressure (mmHg) <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              placeholder="Systolic"
              required
              className="w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
            <input
              type="text"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              placeholder="Diastolic"
              required
              className="w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">
            Heart Rate (bpm) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">
            Temperature (°C) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">
            Weight (kg) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">
            Height (cm) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333]">
            Symptom Severity <span className="text-red-600">*</span>
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            required
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
      {saveError && <p className="mt-4 text-sm text-[#dc3545]" role="alert">{saveError}</p>}
      <button
        type="button"
        disabled={!selectedPatient || saving}
        onClick={() => handleSaveVitals()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#007bff] py-3 font-medium text-white hover:bg-[#0069d9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Vitals & Calculate Risk"}
      </button>
    </div>
    </div>
  );
}
