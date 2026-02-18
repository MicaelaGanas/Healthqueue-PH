"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBookedQueueFromStorage, removeBookedFromStorage } from "../../../lib/queueBookedStorage";
import { getQueueRowsFromStorage, setQueueRowsInStorage } from "../../../lib/queueSyncStorage";
import { createSupabaseBrowser } from "../../../lib/supabase/client";

export type Priority = "normal" | "urgent";

export type QueueRow = {
  ticket: string;
  patientName: string;
  department: string;
  priority: Priority;
  status: string;
  waitTime: string;
  source: "booked" | "walk-in";
  /** When this row was added to queue (ISO string). Used for walk-ins and for sort. */
  addedAt?: string;
  /** Appointment time for booked patients (e.g. "09:00") for fair queue order. */
  appointmentTime?: string;
  /** Assigned/preferred doctor (e.g. "Dr. Ana Reyes - OB-GYN"). Queue view filters by doctor on duty. */
  assignedDoctor?: string;
  /** Appointment date e.g. "2/4/2026" for Manage bookings filter (booked only). */
  appointmentDate?: string;
};

export type PendingWalkIn = {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  sex: string;
  phone: string;
  email: string;
  bookingReference: string;
  symptoms: string[];
  otherSymptoms: string;
  registeredAt: string;
};

/** Slot freed when a booked patient is marked no-show. Offered to next booked, then walk-ins. */
export type OpenSlot = {
  id: string;
  department: string;
  appointmentTime: string;
  freedFromTicket: string;
  /** Tickets we already offered and they declined */
  offeredToTickets: string[];
};

/** Fallback when Supabase is not configured or API fails: load from localStorage or booked queue. */
function loadFallbackQueue(): QueueRow[] {
  const fromStorage = getQueueRowsFromStorage();
  if (fromStorage.length > 0) return fromStorage as QueueRow[];
  const booked = getBookedQueueFromStorage();
  return booked.map((e) => ({
    ticket: e.referenceNo,
    patientName: e.patientName,
    department: e.department,
    priority: "normal" as Priority,
    status: "scheduled",
    waitTime: "",
    source: "booked" as const,
    appointmentTime: e.appointmentTime,
    addedAt: e.addedAt,
    assignedDoctor: e.preferredDoctor,
    appointmentDate: e.appointmentDate,
  }));
}

type RegisterWalkInInput = {
  firstName: string;
  lastName: string;
  age: string;
  sex: string;
  phone: string;
  email: string;
  bookingReference: string;
  symptoms: Record<string, boolean>;
  otherSymptoms: string;
};

type NurseQueueContextValue = {
  queueRows: QueueRow[];
  pendingWalkIns: PendingWalkIn[];
  openSlots: OpenSlot[];
  registerWalkIn: (data: RegisterWalkInInput) => void;
  addWalkInToQueue: (pendingId: string, priority: Priority, department: string, slotTime?: string, assignedDoctor?: string, appointmentDate?: string) => void;
  scheduleWalkInForLater: (pendingId: string, scheduledTime: string) => void;
  /** Remove a pending walk-in from the list (e.g. they left or registration was mistaken). */
  cancelPendingWalkIn: (pendingId: string) => void;
  setPatientPriority: (ticket: string, priority: Priority) => void;
  setPatientStatus: (ticket: string, status: string) => void;
  acceptSlotForPatient: (openSlotId: string, ticket: string) => void;
  declineSlot: (openSlotId: string, ticket: string) => void;
  assignSlotToWalkIn: (openSlotId: string, walkInTicket: string) => void;
  /** Remove a patient booking (from queue and storage). Used from Manage bookings. */
  removeBookedPatient: (referenceNo: string) => void;
  /** Change a patient's slot (reschedule). newTime = 24h "HH:mm", newDate = YYYY-MM-DD (optional, default today). */
  setPatientSlot: (ticket: string, newTime: string, newDate?: string) => void;
  /** Ticket refs confirmed in Manage bookings; show in Vitals & Triage. */
  confirmedForTriage: string[];
  /** Confirm a booking — adds ref to confirmedForTriage so it appears in Vitals & Triage. */
  confirmBooking: (ticket: string) => void;
  /** Remove a ticket from confirmed-for-triage list (e.g. after vitals recorded). */
  clearConfirmedForTriage: (ticket: string) => void;
  /** Refetch queue from server (e.g. after confirming a booking request). */
  refetchQueue: () => Promise<void>;
};

const NurseQueueContext = createContext<NurseQueueContextValue | null>(null);

let walkInTicketCounter = 1;
function nextWalkInTicket(): string {
  const n = walkInTicketCounter++;
  return `W-${String(n).padStart(3, "0")}`;
}

function formatRegisteredAt(): string {
  const d = new Date();
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) +
    " " + d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function nextOpenSlotId(): string {
  return "slot-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

export function NurseQueueProvider({ children }: { children: React.ReactNode }) {
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const [pendingWalkIns, setPendingWalkIns] = useState<PendingWalkIn[]>([]);
  const [scheduledWalkIns, setScheduledWalkIns] = useState<{ id: string; time: string; patientName: string }[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>([]);
  const [confirmedForTriage, setConfirmedForTriage] = useState<string[]>([]);
  const skipNextSyncToApiRef = useRef(false);

  const refetchQueue = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setQueueRows(loadFallbackQueue());
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setQueueRows(loadFallbackQueue());
      return;
    }
    const res = await fetch("/api/queue-rows", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        skipNextSyncToApiRef.current = true;
        setQueueRows(data as QueueRow[]);
      } else {
        setQueueRows(loadFallbackQueue());
      }
    } else {
      setQueueRows(loadFallbackQueue());
    }
  }, []);

  // Fetch queue from Supabase on mount (nurse dashboard is behind AuthGuard, so session exists).
  useEffect(() => {
    refetchQueue();
  }, [refetchQueue]);

  // Sync queue to localStorage and to Supabase when queue changes (skip right after we hydrated from API).
  useEffect(() => {
    setQueueRowsInStorage(queueRows);
    if (skipNextSyncToApiRef.current) {
      skipNextSyncToApiRef.current = false;
      return;
    }
    if (queueRows.length === 0) return;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) return;
      await fetch("/api/queue-rows", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(queueRows),
      });
    })();
    return () => { cancelled = true; };
  }, [queueRows]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "healthqueue_queue_rows" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as QueueRow[];
          if (Array.isArray(parsed) && parsed.length >= 0) setQueueRows(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const registerWalkIn = useCallback((data: RegisterWalkInInput) => {
    const symptomsList = Object.entries(data.symptoms)
      .filter(([, v]) => v)
      .map(([k]) => (k === "Others" ? data.otherSymptoms || "Others" : k));
    const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newPending: PendingWalkIn = {
      id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      age: data.age.trim(),
      sex: data.sex,
      phone: data.phone.trim(),
      email: data.email.trim(),
      bookingReference: data.bookingReference.trim(),
      symptoms: symptomsList,
      otherSymptoms: data.otherSymptoms.trim(),
      registeredAt: formatRegisteredAt(),
    };
    setPendingWalkIns((prev) => [...prev, newPending]);
  }, []);

  const addWalkInToQueue = useCallback((pendingId: string, priority: Priority, department: string, slotTime?: string, assignedDoctor?: string, appointmentDate?: string) => {
    const pending = pendingWalkIns.find((p) => p.id === pendingId);
    if (!pending) return;
    const patientName = `${pending.firstName} ${pending.lastName}`.trim() || "Unknown";
    const ticket = nextWalkInTicket();
    const now = new Date();
    const dateStr = (appointmentDate && /^\d{4}-\d{2}-\d{2}$/.test(appointmentDate.trim())) ? appointmentDate.trim() : now.toISOString().slice(0, 10);
    const [y, mo, day] = dateStr.split("-").map(Number);
    let addedAt = now.toISOString();
    let appointmentTime: string | undefined;
    if (slotTime && /^\d{1,2}:\d{2}$/.test(slotTime.trim())) {
      const [h, m] = slotTime.trim().split(":").map(Number);
      const slotDate = new Date(y, mo - 1, day, h, m, 0, 0);
      addedAt = slotDate.toISOString();
      appointmentTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    const newRow: QueueRow = {
      ticket,
      patientName,
      department: department || "General Medicine",
      priority,
      status: "waiting",
      waitTime: "",
      source: "walk-in",
      addedAt,
      appointmentTime,
      appointmentDate: dateStr,
      assignedDoctor: assignedDoctor?.trim() || undefined,
    };
    setQueueRows((prev) => [...prev, newRow]);
    setPendingWalkIns((prev) => prev.filter((p) => p.id !== pendingId));
  }, [pendingWalkIns]);

  const scheduleWalkInForLater = useCallback((pendingId: string, scheduledTime: string) => {
    const pending = pendingWalkIns.find((p) => p.id === pendingId);
    if (!pending) return;
    const patientName = `${pending.firstName} ${pending.lastName}`.trim() || "Unknown";
    setScheduledWalkIns((prev) => [...prev, { id: pendingId, time: scheduledTime, patientName }]);
    setPendingWalkIns((prev) => prev.filter((p) => p.id !== pendingId));
  }, [pendingWalkIns]);

  const cancelPendingWalkIn = useCallback((pendingId: string) => {
    setPendingWalkIns((prev) => prev.filter((p) => p.id !== pendingId));
  }, []);

  const setPatientPriority = useCallback((ticket: string, priority: Priority) => {
    setQueueRows((prev) =>
      prev.map((r) => (r.ticket === ticket ? { ...r, priority } : r))
    );
  }, []);

  const setPatientStatus = useCallback((ticket: string, status: string) => {
    setQueueRows((prev) =>
      prev.map((r) => (r.ticket === ticket ? { ...r, status } : r))
    );
  }, []);

  const acceptSlotForPatient = useCallback((openSlotId: string, ticket: string) => {
    const slot = openSlots.find((s) => s.id === openSlotId);
    if (!slot) return;
    const row = queueRows.find((r) => r.ticket === ticket);
    if (!row) return;
    setQueueRows((prev) => {
      const updated = prev.map((r) =>
        r.ticket === ticket ? { ...r, appointmentTime: slot.appointmentTime, status: r.status === "scheduled" ? "waiting" : r.status } : r
      );
      return updated;
    });
    setOpenSlots((prev) => {
      const rest = prev.filter((s) => s.id !== openSlotId);
      if (row.source === "booked" && row.appointmentTime && row.appointmentTime !== slot.appointmentTime) {
        rest.push({
          id: nextOpenSlotId(),
          department: row.department,
          appointmentTime: row.appointmentTime,
          freedFromTicket: ticket,
          offeredToTickets: [],
        });
      }
      return rest;
    });
  }, [openSlots, queueRows]);

  const declineSlot = useCallback((openSlotId: string, ticket: string) => {
    setOpenSlots((prev) =>
      prev.map((s) =>
        s.id === openSlotId
          ? { ...s, offeredToTickets: [...(s.offeredToTickets || []), ticket] }
          : s
      )
    );
  }, []);

  const assignSlotToWalkIn = useCallback((openSlotId: string, walkInTicket: string) => {
    const slot = openSlots.find((s) => s.id === openSlotId);
    if (!slot) return;
    setQueueRows((prev) =>
      prev.map((r) =>
        r.ticket === walkInTicket ? { ...r, appointmentTime: slot.appointmentTime } : r
      )
    );
    setOpenSlots((prev) => prev.filter((s) => s.id !== openSlotId));
  }, [openSlots]);

  const removeBookedPatient = useCallback((referenceNo: string) => {
    removeBookedFromStorage(referenceNo);
    setQueueRows((prev) => prev.filter((r) => r.ticket !== referenceNo));
  }, []);

  const setPatientSlot = useCallback((ticket: string, newTime: string, newDate?: string) => {
    const normalized = newTime.includes(":") ? newTime : `${newTime.padStart(2, "0")}:00`;
    const dateStr = (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) ? newDate.trim() : new Date().toISOString().slice(0, 10);
    const [y, mo, day] = dateStr.split("-").map(Number);
    const [h, m] = normalized.split(":").map(Number);
    const slotDate = new Date(y, mo - 1, day, h, m, 0, 0);
    setQueueRows((prev) =>
      prev.map((r) => {
        if (r.ticket !== ticket) return r;
        return {
          ...r,
          appointmentTime: normalized,
          appointmentDate: dateStr,
          addedAt: r.source === "walk-in" ? slotDate.toISOString() : r.addedAt,
        };
      })
    );
  }, []);

  const confirmBooking = useCallback((ticket: string) => {
    setConfirmedForTriage((prev) => (prev.includes(ticket) ? prev : [...prev, ticket]));
  }, []);

  const clearConfirmedForTriage = useCallback((ticket: string) => {
    setConfirmedForTriage((prev) => prev.filter((t) => t !== ticket));
  }, []);

  const value = useMemo<NurseQueueContextValue>(
    () => ({
      queueRows,
      pendingWalkIns,
      openSlots,
      registerWalkIn,
      addWalkInToQueue,
      scheduleWalkInForLater,
      cancelPendingWalkIn,
      setPatientPriority,
      setPatientStatus,
      acceptSlotForPatient,
      declineSlot,
      assignSlotToWalkIn,
      removeBookedPatient,
      setPatientSlot,
      confirmedForTriage,
      confirmBooking,
      clearConfirmedForTriage,
      refetchQueue,
    }),
    [
      queueRows,
      pendingWalkIns,
      openSlots,
      registerWalkIn,
      addWalkInToQueue,
      scheduleWalkInForLater,
      cancelPendingWalkIn,
      setPatientPriority,
      setPatientStatus,
      acceptSlotForPatient,
      declineSlot,
      assignSlotToWalkIn,
      removeBookedPatient,
      setPatientSlot,
      confirmedForTriage,
      confirmBooking,
      clearConfirmedForTriage,
      refetchQueue,
    ]
  );

  return (
    <NurseQueueContext.Provider value={value}>
      {children}
    </NurseQueueContext.Provider>
  );
}

export function useNurseQueue() {
  const ctx = useContext(NurseQueueContext);
  if (!ctx) throw new Error("useNurseQueue must be used within NurseQueueProvider");
  return ctx;
}
