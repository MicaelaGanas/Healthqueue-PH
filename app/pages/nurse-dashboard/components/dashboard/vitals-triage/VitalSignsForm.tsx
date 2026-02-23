"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createSupabaseBrowser } from "../../../../../lib/supabase/client";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { QueueRow } from "../../../context/NurseQueueContext";

const SEVERITY_OPTIONS = ["Select severity", "Mild", "Moderate", "Severe", "Critical"];

/** Today as YYYY-MM-DD for schedule filtering. */
function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True if this queue row is scheduled for today (appointment date or added date). */
function isScheduledForToday(r: QueueRow): boolean {
  const today = getTodayDateStr();
  const aptDate = (r.appointmentDate ?? "").trim().slice(0, 10);
  const addedDate = (r.addedAt ?? "").slice(0, 10);
  if (aptDate && /^\d{4}-\d{2}-\d{2}$/.test(aptDate)) return aptDate === today;
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
  const queuePatients = useMemo<QueuePatient[]>(() => {
    const scheduledToday = queueRows.filter(isScheduledForToday);
    return scheduledToday.map((r) => ({ ticket: r.ticket, patientName: r.patientName, department: r.department }));
  }, [queueRows]);

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
  const [o2Sat, setO2Sat] = useState("98");
  const [respRate, setRespRate] = useState("16");
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
  const confirmedRefsNeedingVitals = useMemo(
    () => confirmedForTriage.filter((t) => queuePatients.some((p) => p.ticket === t) && !checkedTickets.has(t)),
    [confirmedForTriage, queuePatients, vitalsCompleted]
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
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient) return;
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
          systolic: systolic.trim() || undefined,
          diastolic: diastolic.trim() || undefined,
          heartRate: heartRate.trim() || undefined,
          temperature: temperature.trim() || undefined,
          o2Sat: o2Sat.trim() || undefined,
          respRate: respRate.trim() || undefined,
          severity: severity && severity !== "Select severity" ? severity : undefined,
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
      {/* Confirmed appointments from Manage bookings */}
      {confirmedRefsNeedingVitals.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-green-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirmed appointments — need vitals
          </h3>
          <p className="mb-2 text-sm text-green-800">
            These references were confirmed in Manage bookings. Record their vitals below.
          </p>
          <div className="flex flex-wrap gap-2">
            {confirmedRefsNeedingVitals.map((ref) => {
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
