"use client";

import { useState, useEffect, useMemo } from "react";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { Priority } from "../../../context/NurseQueueContext";

import { formatSlotDisplay, getDefaultSlotNow } from "../../../../../lib/slotTimes";
import { getTodayYYYYMMDD, toYYYYMMDD } from "../../../../../lib/schedule";
import { WalkInSlotPickerPanel } from "./WalkInSlotPickerPanel";
import { PatientSummaryOverlay } from "../../PatientSummaryOverlay";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
];

export function WalkInRegistration() {
  const { pendingWalkIns, registerWalkIn, addWalkInToQueue } = useNurseQueue();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

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
      symptoms: {},
      otherSymptoms: "",
    });
    setFirstName("");
    setLastName("");
    setAge("");
    setSex("");
    setPhone("");
    setEmail("");
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
          Register the patient first. They will appear in <strong>Pending queue</strong> below. Add them to the queue only after triage (e.g. vitals) or when ready.
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
            <label className="block text-sm font-medium text-[#333333]">Phone (optional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 09XX XXX XXXX"
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#333333]">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patient@email.com"
              className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
          </div>
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

type AddToQueueOverlayProps = {
  open: boolean;
  onClose: () => void;
  pendingId: string;
  patientName: string;
  initialDepartment: string;
  setDepartmentByRow: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedTime: string;
  onAddToQueue: (priority: Priority, department: string, slotTime: string, doctor: string, appointmentDate: string) => void;
  onOpenSlotPicker: (department: string, doctor: string, dateStr: string) => void;
};

type DoctorOption = { id: string; name: string; department: string | null; displayLabel: string };
type SlotPanelFor = { pendingId: string; patientName: string; department: string; doctor: string; dateStr: string };

function AddToQueueOverlay({
  open,
  onClose,
  pendingId,
  patientName,
  initialDepartment,
  setDepartmentByRow,
  selectedTime,
  onAddToQueue,
  onOpenSlotPicker,
}: AddToQueueOverlayProps) {
  const [department, setDepartment] = useState(initialDepartment);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState(getTodayYYYYMMDD());
  const [calendarMonthCursor, setCalendarMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [priority, setPriority] = useState<Priority>("normal");
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [doctorsByDept, setDoctorsByDept] = useState<Record<string, string[]>>({});
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDoctorsLoading(true);
    Promise.all([
      fetch("/api/departments").then((res) => (res.ok ? res.json() : [])).then((arr: { id: string; name: string }[]) => Array.isArray(arr) ? arr.map((d) => d.name) : []),
      fetch("/api/doctors").then((res) => (res.ok ? res.json() : [])).then((list: DoctorOption[]) => {
        if (!Array.isArray(list)) return {};
        const byDept: Record<string, string[]> = {};
        for (const d of list) {
          const dept = (d.department ?? "").trim() || "General Medicine";
          if (!byDept[dept]) byDept[dept] = [];
          byDept[dept].push(d.displayLabel ?? `Dr. ${d.name}`);
        }
        return byDept;
      }),
    ])
      .then(([deptNames, byDept]) => {
        setDepartmentsList(deptNames.length > 0 ? deptNames : ["General Medicine"]);
        setDoctorsByDept(byDept);
      })
      .catch(() => {
        setDepartmentsList(["General Medicine"]);
        setDoctorsByDept({});
      })
      .finally(() => setDoctorsLoading(false));
  }, [open]);

  const doctors = doctorsByDept[department] ?? [];
  const effectiveDoctor = doctor || (doctors[0] ?? "");

  useEffect(() => {
    if (!open) return;
    setDepartment(initialDepartment && departmentsList.includes(initialDepartment) ? initialDepartment : departmentsList[0] ?? "General Medicine");
    setDoctor("");
    const today = getTodayYYYYMMDD();
    setDate(today);
    const d = new Date(today + "T12:00:00");
    setCalendarMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setPriority("normal");
  }, [open, initialDepartment, departmentsList, selectedTime]);

  useEffect(() => {
    if (department && (!doctor || !doctors.includes(doctor))) setDoctor(doctors[0] ?? "");
  }, [department, doctors, doctor]);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setDepartmentByRow((prev) => ({ ...prev, [pendingId]: dept }));
  };

  const handleAdd = () => {
    onAddToQueue(priority, department, selectedTime, effectiveDoctor, date);
    onClose();
  };

  const calendarMonthLabel = useMemo(
    () => calendarMonthCursor.toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
    [calendarMonthCursor]
  );

  const weekDayLabels = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);

  const calendarDays = useMemo(() => {
    const year = calendarMonthCursor.getFullYear();
    const month = calendarMonthCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstGridDate = new Date(firstOfMonth);
    firstGridDate.setDate(1 - firstOfMonth.getDay());
    const today = getTodayYYYYMMDD();
    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(firstGridDate);
      d.setDate(firstGridDate.getDate() + i);
      const ymd = toYYYYMMDD(d);
      return {
        ymd,
        day: d.getDate(),
        inCurrentMonth: d.getMonth() === month,
        isPast: ymd < today,
      };
    });
  }, [calendarMonthCursor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-4xl rounded-xl border border-[#e9ecef] bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-bold text-[#333333]">Add to queue</h3>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef]" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="mb-3 text-sm font-medium text-[#333333]">{patientName}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Department</label>
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={doctorsLoading}
              className="w-full rounded border border-[#dee2e6] px-3 py-2 text-sm focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff] disabled:bg-[#f8f9fa]"
            >
              {doctorsLoading ? (
                <option value="">Loading…</option>
              ) : (
                departmentsList.map((d) => <option key={d} value={d}>{d}</option>)
              )}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6C757D]">Doctor</label>
            <select
              value={effectiveDoctor}
              onChange={(e) => setDoctor(e.target.value)}
              disabled={doctorsLoading || doctors.length === 0}
              className="w-full rounded border border-[#dee2e6] px-3 py-2 text-sm focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff] disabled:bg-[#f8f9fa]"
            >
              {doctors.length === 0 ? (
                <option value="">No doctors in this department</option>
              ) : (
                doctors.map((doc) => <option key={doc} value={doc}>{doc}</option>)
              )}
            </select>
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
        <div className="mt-2">
          <label className="mb-1 block text-xs font-medium text-[#6C757D]">Date</label>
          <div className="rounded border border-[#dee2e6] bg-white p-2">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="rounded border border-[#dee2e6] px-2 py-1 text-xs text-[#333333] hover:bg-[#f8f9fa]"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-[#333333]">{calendarMonthLabel}</span>
              <button
                type="button"
                onClick={() => setCalendarMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="rounded border border-[#dee2e6] px-2 py-1 text-xs text-[#333333] hover:bg-[#f8f9fa]"
              >
                Next
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {weekDayLabels.map((label) => (
                <div key={label} className="py-1 text-center text-[10px] font-medium text-[#6C757D]">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d) => (
                <button
                  key={d.ymd}
                  type="button"
                    onClick={() => {
                      if (d.isPast || !effectiveDoctor) return;
                      setDate(d.ymd);
                      onOpenSlotPicker(department, effectiveDoctor, d.ymd);
                    }}
                    disabled={d.isPast || !effectiveDoctor}
                  className={`h-8 rounded text-xs font-medium ${
                    date === d.ymd
                      ? "bg-[#007bff] text-white"
                        : d.isPast || !effectiveDoctor
                        ? "cursor-not-allowed text-[#adb5bd]"
                        : d.inCurrentMonth
                          ? "text-[#333333] hover:bg-[#f8f9fa]"
                          : "text-[#adb5bd] hover:bg-[#f8f9fa]"
                  }`}
                >
                  {d.day}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={doctorsLoading || doctors.length === 0 || !effectiveDoctor || !selectedTime}
            className="rounded-lg bg-[#28a745] px-4 py-2 text-sm font-medium text-white hover:bg-[#218838] disabled:opacity-60 disabled:pointer-events-none"
          >
            Add to queue
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dee2e6] px-4 py-2 text-sm text-[#6C757D] hover:bg-[#f8f9fa]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function WalkInPendingQueue() {
  const { pendingWalkIns, addWalkInToQueue, cancelPendingWalkIn } = useNurseQueue();
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
            <col className="w-[34%]" />
            <col className="w-[14%]" />
            <col className="w-[22%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Patient</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Age / Sex</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Registered</th>
              <th className="px-3 py-2.5 font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingWalkIns.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[#6C757D]">
                  No pending registrations. Register a walk-in above.
                </td>
              </tr>
            ) : (
              pendingWalkIns.map((p) => {
                const patientName = `${p.firstName} ${p.lastName}`.trim() || "—";
                const dept = departmentByRow[p.id] ?? "General Medicine";
                return (
                  <tr key={p.id} className="border-t border-[#e9ecef] hover:bg-[#f8f9fa]">
                    <td className="align-middle px-3 py-2.5">
                      <span className="font-medium text-[#333333]">{patientName}</span>
                    </td>
                    <td className="align-middle whitespace-nowrap px-3 py-2.5 text-[#333333]">{p.age || "—"} / {p.sex || "—"}</td>
                    <td className="align-middle whitespace-nowrap px-3 py-2.5 text-[#6C757D]" title={p.registeredAt}>
                      {p.createdAt
                        ? (() => {
                            try {
                              return new Date(p.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
                            } catch {
                              return p.registeredAt;
                            }
                          })()
                        : p.registeredAt}
                    </td>
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
