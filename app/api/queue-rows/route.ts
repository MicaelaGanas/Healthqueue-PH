import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";
import type { DbQueueItem } from "../../lib/supabase/types";
import { requireRoles } from "../../lib/api/auth";
import {
  ACTIVE_QUEUE_DB_STATUSES,
  estimateWaitMinutesFromPosition,
  formatEstimatedWaitFromMinutes,
  getRollingAverageConsultationMinutes,
  getWaitingAheadForTicket,
  type QueueEtaRow,
} from "../../lib/queue/eta";
import { buildConsultationTimestampUpdate, normalizeQueueStatusForDb } from "../../lib/queue/status";

type BookingRequestJoin = {
  booking_type?: "self" | "dependent" | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  beneficiary_first_name?: string | null;
  beneficiary_last_name?: string | null;
};

type QueueItemWithJoins = DbQueueItem & {
  departments?: { name: string } | null;
  patient_users?: { first_name: string; last_name: string } | null;
  staff_users?: { first_name: string; last_name: string } | null;
  booking_requests?: BookingRequestJoin | BookingRequestJoin[] | null;
};

function resolveQueuePatientName(r: QueueItemWithJoins): string {
  const booking = r.booking_requests;
  const b = Array.isArray(booking) ? booking[0] : booking;
  if (r.source === "booked" && b) {
    if (b.booking_type === "dependent") {
      const first = (b.beneficiary_first_name ?? "").trim();
      const last = (b.beneficiary_last_name ?? "").trim();
      if (first || last) return `${first} ${last}`.trim() || "Unknown";
    } else {
      const first = (b.patient_first_name ?? "").trim();
      const last = (b.patient_last_name ?? "").trim();
      if (first || last) return `${first} ${last}`.trim() || "Unknown";
    }
  }
  if (r.patient_users?.first_name && r.patient_users?.last_name)
    return `${r.patient_users.first_name} ${r.patient_users.last_name}`;
  if (r.walk_in_first_name && r.walk_in_last_name)
    return `${r.walk_in_first_name} ${r.walk_in_last_name}`;
  return r.walk_in_first_name || r.patient_users?.first_name || "Unknown";
}

function toAppRow(r: QueueItemWithJoins, hasVitals: boolean, computedWaitByTicket: Record<string, string>) {
  const patientName = resolveQueuePatientName(r);
  const department = r.departments?.name ?? "General Medicine";
  const assignedDoctor =
    r.staff_users?.first_name && r.staff_users?.last_name
      ? `${r.staff_users.first_name} ${r.staff_users.last_name}`
      : null;
  const appointmentDate = r.appointment_at ? new Date(r.appointment_at).toISOString().slice(0, 10) : null;
  const appointmentTime = r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null;
  const statusForApp = r.status === "no_show" ? "no show" : r.status === "in_consultation" ? "in progress" : r.status;
  return {
    ticket: r.ticket,
    patientName,
    department,
    priority: r.priority,
    status: statusForApp,
    waitTime: computedWaitByTicket[r.ticket] ?? r.wait_time ?? "",
    source: r.source === "walk_in" ? "walk-in" : r.source,
    addedAt: r.added_at ?? undefined,
    appointmentTime: appointmentTime ?? undefined,
    assignedDoctor: assignedDoctor ?? undefined,
    appointmentDate: appointmentDate ?? undefined,
    hasVitals,
    walkInAgeYears: (r as { walk_in_age_years?: number | null }).walk_in_age_years ?? undefined,
    walkInGender: (r as { walk_in_sex?: string | null }).walk_in_sex ?? undefined,
  };
}

const requireStaff = requireRoles(["admin", "nurse", "doctor", "receptionist"]);

const NURSE_LIKE_ROLES = ["nurse", "receptionist"] as const;

export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  // Fetch all queue items so confirmed bookings always show in Booked queue (confirmed).
  const q = supabase
    .from("queue_items")
    .select(
      "*, departments(name), patient_users(first_name, last_name), staff_users!queue_items_assigned_doctor_id_fkey(first_name, last_name), booking_requests(booking_type, patient_first_name, patient_last_name, beneficiary_first_name, beneficiary_last_name)"
    )
    .order("added_at", { ascending: true });
  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = (data ?? []) as unknown as QueueItemWithJoins[];
  const computedWaitByTicket: Record<string, string> = {};

  const departmentIds = Array.from(new Set(rows.map((r) => r.department_id).filter((v): v is string => Boolean(v))));
  const avgByDepartmentId = new Map<string, number>();
  await Promise.all(
    departmentIds.map(async (departmentId) => {
      const avg = await getRollingAverageConsultationMinutes(supabase, departmentId, null);
      avgByDepartmentId.set(departmentId, avg);
    })
  );

  for (const departmentId of departmentIds) {
    const queueRows = rows
      .filter((r) => r.department_id === departmentId)
      .filter((r) => ACTIVE_QUEUE_DB_STATUSES.includes(normalizeQueueStatusForDb(r.status) as (typeof ACTIVE_QUEUE_DB_STATUSES)[number]))
      .map((r) => ({
        ticket: r.ticket,
        status: r.status,
        appointment_at: r.appointment_at,
        added_at: r.added_at,
      })) as QueueEtaRow[];

    const avgMinutes = avgByDepartmentId.get(departmentId) ?? 10;
    for (const queueRow of queueRows) {
      const waitingAhead = getWaitingAheadForTicket(queueRows, queueRow.ticket);
      if (waitingAhead == null) continue;
      const estimated = estimateWaitMinutesFromPosition(waitingAhead, avgMinutes);
      computedWaitByTicket[queueRow.ticket] = formatEstimatedWaitFromMinutes(estimated);
    }
  }

  const tickets = rows.map((r) => r.ticket).filter(Boolean);
  const ticketsWithVitals = new Set<string>();
  if (tickets.length > 0) {
    const { data: vitals, error: vitalsError } = await supabase
      .from("vital_signs")
      .select("ticket")
      .in("ticket", tickets);
    if (vitalsError) {
      return NextResponse.json(
        { error: `Failed to load vitals: ${vitalsError.message}` },
        { status: 500 }
      );
    }
    (vitals ?? []).forEach((v: { ticket: string }) => ticketsWithVitals.add(v.ticket));
  }
  return NextResponse.json(
    rows.map((r) => toAppRow(r, ticketsWithVitals.has(r.ticket), computedWaitByTicket))
  );
}

async function resolveDepartmentId(supabase: ReturnType<typeof getSupabaseServer>, deptName: string | null | undefined): Promise<string | null> {
  if (!deptName || !supabase) return null;
  const { data } = await supabase.from("departments").select("id").eq("name", deptName.trim()).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** Resolve booking_request_id and patient_user_id for a booked queue row (ticket = reference_no). */
async function resolveBookingRequest(
  supabase: ReturnType<typeof getSupabaseServer>,
  ticket: string
): Promise<{ id: string | null; patient_user_id: string | null }> {
  if (!ticket?.trim() || !supabase) return { id: null, patient_user_id: null };
  const { data } = await supabase
    .from("booking_requests")
    .select("id, patient_user_id")
    .eq("reference_no", ticket.trim())
    .eq("status", "confirmed")
    .maybeSingle();
  const row = data as { id?: string; patient_user_id?: string } | null;
  return {
    id: (row?.id as string | undefined) ?? null,
    patient_user_id: (row?.patient_user_id as string | undefined) ?? null,
  };
}

async function resolveDoctorId(supabase: ReturnType<typeof getSupabaseServer>, doctorName: string | null | undefined): Promise<string | null> {
  if (!doctorName || !supabase) return null;
  const clean = doctorName.trim().replace(/^Dr\.\s*/i, "").replace(/\s*-\s*.*$/, "").trim();
  if (!clean) return null;
  const parts = clean.split(" ");
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  if (!firstName) return null;
  let q = supabase.from("staff_users").select("id").eq("role", "doctor").eq("status", "active").eq("first_name", firstName);
  if (lastName) q = q.eq("last_name", lastName);
  const { data } = await q.maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function splitPatientName(name: string): { firstName: string; lastName: string } {
  const clean = name.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export async function PUT(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  let rows = Array.isArray(body) ? body : body.rows ?? [];
  const { staff } = auth;
  if (NURSE_LIKE_ROLES.includes(staff.role as "nurse" | "receptionist") && staff.department?.trim()) {
    const dept = staff.department.trim();
    rows = rows.filter((r: Record<string, unknown>) => (r.department as string) === dept);
  }

  const tickets = rows
    .map((r: Record<string, unknown>) => String(r.ticket ?? "").trim())
    .filter(Boolean);

  const existingByTicket = new Map<
    string,
    {
      status: string | null;
      consultation_started_at: string | null;
      consultation_completed_at: string | null;
      wait_time: string | null;
    }
  >();

  if (tickets.length > 0) {
    const { data: existingRows, error: existingError } = await supabase
      .from("queue_items")
      .select("ticket, status, consultation_started_at, consultation_completed_at, wait_time")
      .in("ticket", tickets);
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    for (const row of existingRows ?? []) {
      const existing = row as {
        ticket: string;
        status: string | null;
        consultation_started_at: string | null;
        consultation_completed_at: string | null;
        wait_time: string | null;
      };
      existingByTicket.set(existing.ticket, {
        status: existing.status,
        consultation_started_at: existing.consultation_started_at,
        consultation_completed_at: existing.consultation_completed_at,
        wait_time: existing.wait_time,
      });
    }
  }

  const dbRows = await Promise.all(
    rows.map(async (r: Record<string, unknown>) => {
      const source = r.source === "walk-in" ? "walk_in" : (r.source === "booked" ? "booked" : "walk_in");
      const ticket = String(r.ticket).trim();
      const priority = r.priority === "urgent" ? "urgent" : "normal";
      const deptId = await resolveDepartmentId(supabase, r.department as string | null | undefined);
      if (!deptId) {
        throw new Error(`Department "${r.department}" not found`);
      }
      const doctorId = await resolveDoctorId(supabase, r.assignedDoctor as string | null | undefined);
      const bookingResolved =
        source === "booked"
          ? await resolveBookingRequest(supabase, ticket)
          : ({ id: null as string | null, patient_user_id: null as string | null });
      const bookingRequestId = bookingResolved.id;
      const patientUserId = source === "booked" ? bookingResolved.patient_user_id : null;
      const patientName = String(r.patientName ?? "").trim();
      const { firstName, lastName } = splitPatientName(patientName);
      const appointmentAt =
        r.appointmentDate && r.appointmentTime
          ? new Date(`${r.appointmentDate}T${r.appointmentTime}`).toISOString()
          : r.appointmentDate
            ? new Date(`${r.appointmentDate}T00:00:00`).toISOString()
            : null;

      const statusForDb = normalizeQueueStatusForDb(r.status);
      const existing = existingByTicket.get(ticket);
      const timestampUpdate = buildConsultationTimestampUpdate(
        existing?.status ?? null,
        statusForDb,
        existing?.consultation_started_at ?? null
      );
      const walkInAgeYears =
        source === "walk_in" && (r as { walkInAgeYears?: number | null }).walkInAgeYears != null
          ? Number((r as { walkInAgeYears?: number | null }).walkInAgeYears)
          : null;
      const walkInSex =
        source === "walk_in" && (r as { walkInGender?: string | null }).walkInGender != null
          ? String((r as { walkInGender?: string | null }).walkInGender).trim() || null
          : null;
      const incomingWaitTime = String(r.waitTime ?? "").trim();
      return {
        ticket,
        source,
        priority,
        status: statusForDb,
        wait_time: incomingWaitTime || existing?.wait_time || "",
        department_id: deptId,
        patient_user_id: patientUserId,
        walk_in_first_name: firstName,
        walk_in_last_name: lastName,
        walk_in_age_years: Number.isNaN(walkInAgeYears) ? null : walkInAgeYears,
        walk_in_sex: walkInSex,
        walk_in_phone: null,
        walk_in_email: null,
        booking_request_id: bookingRequestId,
        assigned_doctor_id: doctorId,
        consultation_started_at:
          timestampUpdate.consultation_started_at !== undefined
            ? timestampUpdate.consultation_started_at
            : (existing?.consultation_started_at ?? null),
        consultation_completed_at:
          timestampUpdate.consultation_completed_at !== undefined
            ? timestampUpdate.consultation_completed_at
            : (existing?.consultation_completed_at ?? null),
        appointment_at: appointmentAt,
        added_at: r.addedAt ? new Date(r.addedAt as string).toISOString() : new Date().toISOString(),
      };
    })
  );

  const { error } = await supabase.from("queue_items").upsert(dbRows, {
    onConflict: "ticket",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // When a booked patient is rescheduled (new date/time in queue), update booking_requests so the appointment shows the new time everywhere (Booked queue, patient dashboard).
  for (const r of rows as Record<string, unknown>[]) {
    const source = r.source === "walk-in" ? "walk_in" : (r.source === "booked" ? "booked" : "walk_in");
    const ticket = String(r.ticket).trim();
    const appointmentDate = r.appointmentDate as string | number | undefined;
    const appointmentTime = r.appointmentTime as string | number | undefined;
    if (source !== "booked" || appointmentDate == null || appointmentTime == null) continue;
    const dateStr = String(appointmentDate).trim().slice(0, 10);
    let timeStr = String(appointmentTime).trim();
    if (timeStr.includes(":")) {
      const [h, m] = timeStr.split(":");
      timeStr = `${String(Number(h)).padStart(2, "0")}:${String(Number(m) || 0).padStart(2, "0")}`;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) continue;
    const { error: updateError } = await supabase
      .from("booking_requests")
      .update({ requested_date: dateStr, requested_time: timeStr })
      .eq("reference_no", ticket)
      .eq("status", "confirmed");
    if (updateError) {
      return NextResponse.json(
        { error: `Failed to sync reschedule to appointment: ${updateError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
