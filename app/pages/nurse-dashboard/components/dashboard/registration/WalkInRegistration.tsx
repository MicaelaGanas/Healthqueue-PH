"use client";

import { useState, useEffect } from "react";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { Priority } from "../../../context/NurseQueueContext";

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

import { DEPARTMENTS, DOCTORS_BY_DEPARTMENT } from "../../../../../lib/departments";
import { formatSlotDisplay, getDefaultSlotNow } from "../../../../../lib/slotTimes";
import { getDateOptions, getTodayYYYYMMDD } from "../../../../../lib/schedule";
import { WalkInSlotPickerPanel } from "./WalkInSlotPickerPanel";
import { PatientSummaryOverlay } from "../../PatientSummaryOverlay";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
];

export function WalkInRegistration() {
  const { pendingWalkIns, registerWalkIn, addWalkInToQueue, scheduleWalkInForLater } = useNurseQueue();
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

  const handleRegister = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast || !age.trim() || !sex) return;
    registerWalkIn({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      age,
      sex,
      phone,
      email,
      bookingReference,
      symptoms,
      otherSymptoms,
    });
    setFirstName("");
    setLastName("");
    setAge("");
    setSex("");
    setPhone("");
    setEmail("");
    setBookingReference("");
    setSymptoms({});
    setOtherSymptoms("");
  };

  const canRegister = firstName.trim() && lastName.trim() && age.trim() && sex;

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-[#007bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-lg font-bold text-[#333333]">Walk-In Patient Registration</h2>
        </div>
        <p className="mb-4 text-sm text-[#6C757D]">
          Register the patient first. They will appear in <strong>Pending queue</strong> below. Add them to the queue only after triage (e.g. vitals) or when ready. Add phone, email, or booking reference to link to an existing record.
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
          onClick={handleRegister}
          disabled={!canRegister}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#007bff] py-3 font-medium text-white hover:bg-[#0069d9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Register (pending queue)
        </button>
    </div>
  );
}

type SlotPanelFor = {
  pendingId: string;
  patientName: string;
  department: string;
  doctor: string;
  dateStr: string;
};

type AddToQueueOverlayProps = {
  open: boolean;
  onClose: () => void;
  pendingId: string;
  patientName: string;
  initialDepartment: string;
  setDepartmentByRow: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedTime: string;
  onAddToQueue: (priority: Priority, department: string, slotTime: string, doctor: string, appointmentDate: string) => void;
  onScheduleForLater: (scheduledTime: string) => void;
  onOpenSlotPicker: (department: string, doctor: string, dateStr: string) => void;
};

function AddToQueueOverlay({
  open,
  onClose,
  pendingId,
  patientName,
  initialDepartment,
  setDepartmentByRow,
  selectedTime,
  onAddToQueue,
  onScheduleForLater,
  onOpenSlotPicker,
}: AddToQueueOverlayProps) {
  const [department, setDepartment] = useState(initialDepartment);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState(getTodayYYYYMMDD());
  const [priority, setPriority] = useState<Priority>("normal");
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");

  const doctors = DOCTORS_BY_DEPARTMENT[department] ?? [];
  const effectiveDoctor = doctor || (doctors[0] ?? "");

  useEffect(() => {
    if (!open) return;
    setDepartment(initialDepartment);
    setDoctor(DOCTORS_BY_DEPARTMENT[initialDepartment]?.[0] ?? "");
    setDate(getTodayYYYYMMDD());
    setPriority("normal");
    setShowScheduleInput(false);
    setScheduleTime("");
  }, [open, initialDepartment]);

  useEffect(() => {
    if (!doctors.includes(doctor)) setDoctor(doctors[0] ?? "");
  }, [department, doctors]);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setDepartmentByRow((prev) => ({ ...prev, [pendingId]: dept }));
  };

  const handleAdd = () => {
    onAddToQueue(priority, department, selectedTime, effectiveDoctor, date);
    onClose();
  };

  const handleSchedule = () => {
    onScheduleForLater(scheduleTime || "—");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-[#e9ecef] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-bold text-[#333333]">Add to queue</h3>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef]" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="mb-4 text-sm font-medium text-[#333333]">{patientName}</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Department</label>
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full rounded border border-[#dee2e6] px-3 py-2 text-sm focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Doctor</label>
            <select
              value={effectiveDoctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full rounded border border-[#dee2e6] px-3 py-2 text-sm focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {doctors.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Date</label>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-[#dee2e6] px-3 py-2 text-sm focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {getDateOptions(7).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Time slot</label>
            <button
              type="button"
              onClick={() => onOpenSlotPicker(department, effectiveDoctor, date)}
              className="w-full rounded border border-[#dee2e6] bg-white px-3 py-2 text-left text-sm text-[#333333] hover:bg-[#f8f9fa]"
            >
              {formatSlotDisplay(selectedTime)} — tap to pick (see availability)
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full rounded border border-[#dee2e6] px-3 py-2 text-sm focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              {PRIORITIES.map((pr) => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={handleAdd} className="rounded-lg bg-[#28a745] px-4 py-2 text-sm font-medium text-white hover:bg-[#218838]">
            Add to queue
          </button>
          {!showScheduleInput ? (
            <button type="button" onClick={() => setShowScheduleInput(true)} className="rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]">
              Schedule for later
            </button>
          ) : (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="rounded border border-[#dee2e6] px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={handleSchedule} className="rounded bg-[#6c757d] px-3 py-1.5 text-sm text-white hover:bg-[#5a6268]">Set</button>
              <button type="button" onClick={() => { setShowScheduleInput(false); setScheduleTime(""); }} className="rounded border border-[#dee2e6] px-3 py-1.5 text-sm text-[#6C757D] hover:bg-[#f8f9fa]">Cancel</button>
            </div>
          )}
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dee2e6] px-4 py-2 text-sm text-[#6C757D] hover:bg-[#f8f9fa]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function WalkInPendingQueue() {
  const { pendingWalkIns, addWalkInToQueue, scheduleWalkInForLater, cancelPendingWalkIn } = useNurseQueue();
  const [departmentByRow, setDepartmentByRow] = useState<Record<string, string>>({});
  const [slotPanelFor, setSlotPanelFor] = useState<SlotPanelFor | null>(null);
  const [selectedSlotByPendingId, setSelectedSlotByPendingId] = useState<Record<string, string>>({});
  const [summaryForPendingId, setSummaryForPendingId] = useState<string | null>(null);
  const [addToQueueOverlayFor, setAddToQueueOverlayFor] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-[#333333]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">!</span>
        Registered — Pending queue
      </h3>
      <p className="mb-4 text-sm text-[#6C757D]">
        When ready, click <strong>Add to queue</strong> for a patient to set department, doctor, date, time, and priority in the overlay. They will appear in that doctor&apos;s queue for that day and time.
      </p>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full table-fixed text-left text-sm text-[#333333]">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[12%]" />
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Patient</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Age / Sex</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Symptoms</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Registered</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingWalkIns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[#6C757D]">
                  No pending registrations. Register a walk-in above.
                </td>
              </tr>
            ) : (
              pendingWalkIns.map((p) => {
                const patientName = `${p.firstName} ${p.lastName}`.trim() || "—";
                const symptomsText = p.symptoms.length ? p.symptoms.join(", ") : "—";
                const dept = departmentByRow[p.id] ?? "General Medicine";
                return (
                  <tr key={p.id} className="border-t border-[#e9ecef] hover:bg-[#f8f9fa]">
                    <td className="align-middle px-3 py-2.5">
                      <span className="font-medium text-[#333333]">{patientName}</span>
                    </td>
                    <td className="align-middle whitespace-nowrap px-3 py-2.5 text-[#333333]">{p.age || "—"} / {p.sex || "—"}</td>
                    <td className="align-middle px-3 py-2.5">
                      <span className="block min-w-0 truncate text-[#333333]" title={symptomsText}>{symptomsText}</span>
                    </td>
                    <td className="align-middle whitespace-nowrap px-3 py-2.5 text-[#6C757D]">{p.registeredAt}</td>
                    <td className="align-middle px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSummaryForPendingId(p.id)}
                          className="rounded border border-[#dee2e6] bg-white px-2 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
                          title="View and download summary"
                        >
                          Summary
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddToQueueOverlayFor(p.id)}
                          className="rounded bg-[#28a745] px-2 py-1 text-xs font-medium text-white hover:bg-[#218838]"
                        >
                          Add to queue
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelPendingWalkIn(p.id)}
                          className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          title="Remove from pending (e.g. left or mistaken registration)"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {slotPanelFor && (
        <WalkInSlotPickerPanel
          patientName={slotPanelFor.patientName}
          department={slotPanelFor.department}
          doctor={slotPanelFor.doctor}
          dateStr={slotPanelFor.dateStr}
          onSelect={(time24) => {
            setSelectedSlotByPendingId((prev) => ({ ...prev, [slotPanelFor.pendingId]: time24 }));
          }}
          onClose={() => setSlotPanelFor(null)}
        />
      )}
      {addToQueueOverlayFor && (() => {
        const p = pendingWalkIns.find((x) => x.id === addToQueueOverlayFor);
        if (!p) return null;
        const patientName = `${p.firstName} ${p.lastName}`.trim() || "—";
        const dept = departmentByRow[p.id] ?? "General Medicine";
        return (
          <AddToQueueOverlay
            open={true}
            onClose={() => setAddToQueueOverlayFor(null)}
            pendingId={p.id}
            patientName={patientName}
            initialDepartment={dept}
            setDepartmentByRow={setDepartmentByRow}
            selectedTime={selectedSlotByPendingId[p.id] ?? getDefaultSlotNow()}
            onAddToQueue={(priority, department, slotTime, doctor, appointmentDate) => {
              addWalkInToQueue(p.id, priority, department, slotTime, doctor, appointmentDate);
              setSelectedSlotByPendingId((prev) => {
                const next = { ...prev };
                delete next[p.id];
                return next;
              });
              setAddToQueueOverlayFor(null);
            }}
            onScheduleForLater={(scheduledTime) => {
              scheduleWalkInForLater(p.id, scheduledTime);
              setAddToQueueOverlayFor(null);
            }}
            onOpenSlotPicker={(department, doctor, dateStr) => {
              setSlotPanelFor({ pendingId: p.id, patientName, department, doctor, dateStr });
            }}
          />
        );
      })()}
      <PatientSummaryOverlay
        open={summaryForPendingId !== null}
        onClose={() => setSummaryForPendingId(null)}
        pendingWalkIn={summaryForPendingId != null ? pendingWalkIns.find((p) => p.id === summaryForPendingId) ?? null : null}
      />
    </div>
  );
}
