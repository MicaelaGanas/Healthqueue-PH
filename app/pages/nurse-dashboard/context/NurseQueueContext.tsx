"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBookedQueueFromStorage, removeBookedFromStorage } from "../../../lib/queueBookedStorage";
import { getQueueRowsFromStorage, setQueueRowsInStorage } from "../../../lib/queueSyncStorage";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { getTodayYYYYMMDD } from "../../../lib/schedule";

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
  /** True if vitals have been recorded for this ticket. Booked patients without vitals stay in Vitals & Triage only (Option A). */
  hasVitals?: boolean;
  /** Walk-in only: age in years (stored in queue_items.walk_in_age_years). */
  walkInAgeYears?: number | null;
  /** Walk-in only: gender (stored in queue_items.walk_in_sex). */
  walkInGender?: string | null;
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
  /** Full timestamp from DB (ISO string); use for sorting/filtering by date. Not limited to one day. */
  createdAt?: string | null;
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
  /** Add a booked row optimistically so it shows in Booked queue immediately after confirm. */
  addBookedRowFromConfirm: (params: {
    ticket: string;
    patientName: string;
    department: string;
    requestedDate: string;
    requestedTime?: string | null;
    preferredDoctor?: string | null;
  }) => void;
};

const NurseQueueContext = createContext<NurseQueueContextValue | null>(null);

const CONFIRMED_FOR_TRIAGE_STORAGE_KEY = "healthqueue_confirmed_for_triage";

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

/** Parse walk-in age text (e.g. "25", "25 years") to number of years for queue_items.walk_in_age_years. */
function parseWalkInAge(ageText: string): number | null {
  const s = String(ageText ?? "").trim();
  if (!s) return null;
  const match = s.match(/\d+/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  return Number.isNaN(n) || n < 0 || n > 150 ? null : n;
}

function logStaffActivity(payload: { action: string; entityType?: string; entityId?: string; details?: Record<string, unknown> }) {
  const supabase = createSupabaseBrowser();
  if (!supabase?.auth) return;
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) {
      fetch("/api/staff-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  });
}

export function NurseQueueProvider({ children }: { children: React.ReactNode }) {
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const [pendingWalkIns, setPendingWalkIns] = useState<PendingWalkIn[]>([]);
  const [scheduledWalkIns, setScheduledWalkIns] = useState<{ id: string; time: string; patientName: string }[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>([]);
  const [confirmedForTriage, setConfirmedForTriage] = useState<string[]>([]);
  const skipNextSyncToApiRef = useRef(false);

  // Restore confirmed-arrival tickets so Vitals & Triage list survives page refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CONFIRMED_FOR_TRIAGE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const normalized = parsed
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      if (normalized.length > 0) {
        setConfirmedForTriage(Array.from(new Set(normalized)));
      }
    } catch {
      // Ignore malformed localStorage values.
    }
  }, []);

  // Persist confirmed-arrival tickets after any change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (confirmedForTriage.length === 0) {
        window.localStorage.removeItem(CONFIRMED_FOR_TRIAGE_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(
        CONFIRMED_FOR_TRIAGE_STORAGE_KEY,
        JSON.stringify(Array.from(new Set(confirmedForTriage)))
      );
    } catch {
      // Ignore storage quota/private mode errors.
    }
  }, [confirmedForTriage]);

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
    const res = await fetch("/api/queue-rows?t=" + Date.now(), {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        skipNextSyncToApiRef.current = true;
        const fromApi = data as QueueRow[];
        const apiTickets = new Set(fromApi.map((r) => r.ticket));
        setQueueRows((prev) => {
          const optimisticBooked = prev.filter((r) => r.source === "booked" && !apiTickets.has(r.ticket));
          return optimisticBooked.length ? [...fromApi, ...optimisticBooked] : fromApi;
        });
      } else {
        setQueueRows(loadFallbackQueue());
      }
    } else {
      setQueueRows(loadFallbackQueue());
    }
  }, []);

  const refetchPendingWalkIns = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/pending-walk-ins", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPendingWalkIns(Array.isArray(data) ? data : []);
    }
  }, []);

  // Fetch queue and pending walk-ins from API on mount (nurse dashboard is behind AuthGuard).
  useEffect(() => {
    refetchQueue();
    refetchPendingWalkIns();
  }, [refetchQueue, refetchPendingWalkIns]);

  // Poll queue and pending walk-ins so new bookings and queue changes appear without manual refresh.
  const POLL_INTERVAL_MS = 15000;
  useEffect(() => {
    const id = setInterval(() => {
      refetchQueue();
      refetchPendingWalkIns();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetchQueue, refetchPendingWalkIns]);

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

  const registerWalkIn = useCallback(async (data: RegisterWalkInInput) => {
    const symptomsList = Object.entries(data.symptoms)
      .filter(([, v]) => v)
      .map(([k]) => (k === "Others" ? data.otherSymptoms || "Others" : k));
    const registeredAt = formatRegisteredAt();
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setPendingWalkIns((prev) => [...prev, {
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
        registeredAt,
      }]);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/pending-walk-ins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        age: data.age.trim(),
        sex: data.sex,
        phone: data.phone.trim(),
        email: data.email.trim(),
        bookingReference: data.bookingReference.trim(),
        symptoms: symptomsList,
        otherSymptoms: data.otherSymptoms.trim(),
        registeredAt,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setPendingWalkIns((prev) => [...prev, created]);
    }
  }, []);

  const addWalkInToQueue = useCallback((pendingId: string, priority: Priority, department: string, slotTime?: string, assignedDoctor?: string, appointmentDate?: string) => {
    const pending = pendingWalkIns.find((p) => p.id === pendingId);
    if (!pending) return;
    const patientName = `${pending.firstName} ${pending.lastName}`.trim() || "Unknown";
    const ticket = nextWalkInTicket();
    const now = new Date();
    const dateStr = (appointmentDate && /^\d{4}-\d{2}-\d{2}$/.test(appointmentDate.trim())) ? appointmentDate.trim() : getTodayYYYYMMDD();
    const [y, mo, day] = dateStr.split("-").map(Number);
    let addedAt = now.toISOString();
    let appointmentTime: string | undefined;
    if (slotTime && /^\d{1,2}:\d{2}$/.test(slotTime.trim())) {
      const [h, m] = slotTime.trim().split(":").map(Number);
      const slotDate = new Date(y, mo - 1, day, h, m, 0, 0);
      addedAt = slotDate.toISOString();
      appointmentTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    const ageYears = parseWalkInAge(pending.age);
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
      walkInAgeYears: ageYears ?? undefined,
      walkInGender: pending.sex?.trim() || undefined,
    };
    setQueueRows((prev) => [...prev, newRow]);
    setPendingWalkIns((prev) => prev.filter((p) => p.id !== pendingId));
    logStaffActivity({
      action: "walk_in_added_to_queue",
      entityType: "pending_walk_in",
      entityId: pendingId,
      details: { patientName, department, ticket, priority },
    });
    const supabase = createSupabaseBrowser();
    if (supabase?.auth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          fetch(`/api/pending-walk-ins/${pendingId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).catch(() => {});
        }
      });
    }
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
    logStaffActivity({ action: "pending_walk_in_cancelled", entityType: "pending_walk_in", entityId: pendingId });
    const supabase = createSupabaseBrowser();
    if (supabase?.auth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          fetch(`/api/pending-walk-ins/${pendingId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).catch(() => {});
        }
      });
    }
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
    const dateStr = (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) ? newDate.trim() : getTodayYYYYMMDD();
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

  const addBookedRowFromConfirm = useCallback(
    (params: {
      ticket: string;
      patientName: string;
      department: string;
      requestedDate: string;
      requestedTime?: string | null;
      preferredDoctor?: string | null;
    }) => {
      const row: QueueRow = {
        ticket: params.ticket,
        patientName: params.patientName,
        department: params.department,
        priority: "normal",
        status: "waiting",
        waitTime: "",
        source: "booked",
        addedAt: new Date().toISOString(),
        appointmentTime: params.requestedTime ?? undefined,
        appointmentDate: params.requestedDate ?? undefined,
        assignedDoctor: params.preferredDoctor ?? undefined,
      };
      setQueueRows((prev) => (prev.some((r) => r.ticket === params.ticket) ? prev : [...prev, row]));
    },
    []
  );

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
      addBookedRowFromConfirm,
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
      addBookedRowFromConfirm,
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
