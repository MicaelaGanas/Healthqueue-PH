"use client";

import { useState, useEffect, useMemo } from "react";
import { useNurseQueue } from "../../../context/NurseQueueContext";
import type { Priority } from "../../../context/NurseQueueContext";

import { formatSlotDisplay, getDefaultSlotNow } from "../../../../../lib/slotTimes";
import { getTodayYYYYMMDD, toYYYYMMDD } from "../../../../../lib/schedule";
import { compareYmd, getWeekStartYYYYMMDD } from "../../../../../lib/departmentBooking";
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
};

type DoctorOption = { id: string; name: string; department: string | null; displayLabel: string };

function AddToQueueOverlay({
  open,
  onClose,
  pendingId,
  patientName,
  initialDepartment,
  setDepartmentByRow,
  selectedTime,
  onAddToQueue,
}: AddToQueueOverlayProps) {
  const [department, setDepartment] = useState(initialDepartment);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState(getTodayYYYYMMDD());
  const [calendarMonthCursor, setCalendarMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [priority, setPriority] = useState<Priority>("normal");
  const [selectedTime24, setSelectedTime24] = useState(selectedTime);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [doctorsByDept, setDoctorsByDept] = useState<Record<string, string[]>>({});
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [takenTimes24, setTakenTimes24] = useState<string[]>([]);
  const [timeSlots24, setTimeSlots24] = useState<string[]>([]);
  const [departmentRules, setDepartmentRules] = useState<{
    currentWeekStart: string;
    openWeekStarts: string[];
  } | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

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
  const disabledSlots = useMemo(
    () => timeSlots24.filter((t) => takenTimes24.includes(t)),
    [timeSlots24, takenTimes24]
  );

  useEffect(() => {
    if (!open) return;
    setDepartment(initialDepartment && initialDepartment !== "—" ? initialDepartment : "General Medicine");
    setDoctor("");
    const today = getTodayYYYYMMDD();
    setDate(today);
    const d = new Date(today + "T12:00:00");
    setCalendarMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setPriority("normal");
    setSelectedTime24(selectedTime || getDefaultSlotNow());
    setTakenTimes24([]);
    setTimeSlots24([]);
    setDepartmentRules(null);
    setRulesError(null);
    setAvailabilityError(null);
    setRulesLoading(Boolean(initialDepartment && initialDepartment !== "—"));
  }, [open, initialDepartment, selectedTime]);

  useEffect(() => {
    if (!open || departmentsList.length === 0) return;
    if (!department || department === "—" || !departmentsList.includes(department)) {
      setDepartment(departmentsList[0]);
    }
  }, [open, departmentsList, department]);

  useEffect(() => {
    if (department && (!doctor || !doctors.includes(doctor))) setDoctor(doctors[0] ?? "");
  }, [department, doctors, doctor]);

  useEffect(() => {
    if (!open || !department || department === "—") return;
    let cancelled = false;
    setRulesLoading(true);
    setRulesError(null);
    fetch(`/api/availability/department-rules?department=${encodeURIComponent(department)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load department schedule."))))
      .then((data) => {
        if (cancelled) return;
        setDepartmentRules({
          currentWeekStart: String(data.currentWeekStart ?? ""),
          openWeekStarts: Array.isArray(data.openWeekStarts)
            ? data.openWeekStarts.map((v: unknown) => String(v))
            : [],
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setDepartmentRules(null);
        setRulesError(error instanceof Error ? error.message : "Failed to load department schedule.");
      })
      .finally(() => {
        if (!cancelled) setRulesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, department]);

  const isDateAllowedForDepartment = (dateYmd: string) => {
    if (!department || department === "—") return true;
    if (!departmentRules) return false;
    const weekStart = getWeekStartYYYYMMDD(dateYmd);
    if (!weekStart) return false;
    if (compareYmd(weekStart, departmentRules.currentWeekStart) === 0) return true;
    return departmentRules.openWeekStarts.includes(weekStart);
  };

  useEffect(() => {
    if (!open || !date || !department || department === "—") return;
    let cancelled = false;
    fetch(
      `/api/availability/slots?date=${encodeURIComponent(date)}&department=${encodeURIComponent(department)}`
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load available slots."))))
      .then((data) => {
        if (cancelled) return;
        const slots24 = Array.isArray(data.timeSlots24)
          ? data.timeSlots24.map((v: unknown) => String(v))
          : [];
        const taken24 = Array.isArray(data.takenTimes)
          ? data.takenTimes.map((v: unknown) => String(v))
          : [];
        setTimeSlots24(slots24);
        setTakenTimes24(taken24);
        setAvailabilityError(data.isDepartmentReady === false ? String(data.reason ?? "") : null);
        if (!slots24.includes(selectedTime24) || taken24.includes(selectedTime24)) {
          const firstAvailable = slots24.find((t: string) => !taken24.includes(t)) ?? "";
          setSelectedTime24(firstAvailable);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setTakenTimes24([]);
        setTimeSlots24([]);
        setAvailabilityError("Failed to load available slots.");
        setSelectedTime24("");
      });
    return () => {
      cancelled = true;
    };
  }, [open, date, department]);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setDate(getTodayYYYYMMDD());
    setSelectedTime24("");
    setTakenTimes24([]);
    setTimeSlots24([]);
    setDepartmentRules(null);
    setRulesError(null);
    setAvailabilityError(null);
    setRulesLoading(Boolean(dept && dept !== "—"));
    setDepartmentByRow((prev) => ({ ...prev, [pendingId]: dept }));
  };

  const handleAdd = () => {
    if (!selectedTime24) return;
    onAddToQueue(priority, department, selectedTime24, effectiveDoctor, date);
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
          isAllowed: isDateAllowedForDepartment(ymd),
      };
    });
  }, [calendarMonthCursor, departmentRules, department]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#e9ecef] bg-white p-4 shadow-xl sm:max-h-[88vh]"
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
                    if (d.isPast || !d.isAllowed) return;
                    setDate(d.ymd);
                  }}
                  disabled={d.isPast || !d.isAllowed}
                  className={`h-8 rounded text-xs font-medium ${
                    date === d.ymd
                      ? "bg-[#007bff] text-white"
                        : d.isPast || !d.isAllowed
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
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-[#6C757D]">Time slot</label>
          <p className="mb-2 text-[11px] text-[#6C757D]">
            Blue = selected, Light = available, Gray = taken.
          </p>
          <div className="grid max-h-52 grid-cols-2 gap-2 overflow-auto rounded border border-[#e9ecef] bg-[#f8f9fa] p-2 sm:grid-cols-3">
            {timeSlots24.length === 0 ? (
              <div className="col-span-full rounded border border-dashed border-[#dee2e6] bg-white px-3 py-4 text-center text-xs text-[#6C757D]">
                No available slots for this date.
              </div>
            ) : (
              timeSlots24.map((t24) => {
                const isTaken = disabledSlots.includes(t24);
                const isSelected = selectedTime24 === t24;
                return (
                  <button
                    key={t24}
                    type="button"
                    disabled={isTaken}
                    onClick={() => setSelectedTime24(t24)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      isTaken
                        ? "cursor-not-allowed border-[#dee2e6] bg-[#e9ecef] text-[#adb5bd]"
                        : isSelected
                          ? "border-[#007bff] bg-[#007bff] text-white"
                          : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f0f7ff]"
                    }`}
                  >
                    <span className="block">{formatSlotDisplay(t24)}</span>
                    <span className={`mt-0.5 block text-[10px] ${isTaken ? "text-[#adb5bd]" : isSelected ? "text-blue-100" : "text-[#6C757D]"}`}>
                      {isTaken ? "Taken" : "Available"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {(rulesLoading || rulesError || availabilityError) && (
            <p className="mt-1 text-xs text-[#6C757D]">
              {rulesLoading
                ? "Loading department schedule..."
                : rulesError
                  ? rulesError
                  : availabilityError}
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={doctorsLoading || !selectedTime24}
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
            selectedTime={getDefaultSlotNow()}
            onAddToQueue={(priority, department, slotTime, doctor, appointmentDate) => {
              addWalkInToQueue(p.id, priority, department, slotTime, doctor, appointmentDate);
              setAddToQueueOverlayFor(null);
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
