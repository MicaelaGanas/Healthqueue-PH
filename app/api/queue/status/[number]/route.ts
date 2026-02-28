import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import {
  ACTIVE_QUEUE_DB_STATUSES,
  estimateWaitMinutesFromPosition,
  formatEstimatedWaitFromMinutes,
  getRollingAverageConsultationMinutes,
  getWaitingAheadForTicket,
  type QueueEtaRow,
} from "../../../../lib/queue/eta";

const ETA_ACTIVE_STATUSES: ReadonlySet<string> = new Set(ACTIVE_QUEUE_DB_STATUSES);

/** Format ISO timestamp to YYYY-MM-DD in local time (avoids UTC date shift for UTC+x timezones). */
function toLocalDateStr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeAgeFromDateOfBirth(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** GET /api/queue/status/[number] – public queue status by ticket or reference number */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const debugDemographics = new URL(request.url).searchParams.get("debug") === "1";
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const number = (await params).number;
  if (!number) {
    return NextResponse.json({ error: "Missing queue number" }, { status: 400 });
  }
  const decoded = decodeURIComponent(number).trim();

  const { data: row, error } = await supabase
    .from("queue_items")
    .select(`
      ticket, status, wait_time, priority, source, appointment_at, added_at, patient_user_id, dependent_id, booking_request_id, department_id, assigned_doctor_id,
      walk_in_first_name, walk_in_last_name, walk_in_age_years, walk_in_sex, walk_in_phone, walk_in_email,
      departments(name),
      patient_dependents(date_of_birth, gender),
      patient_users(first_name, last_name, date_of_birth, gender, email, number),
      booking_requests(booking_type, beneficiary_date_of_birth, beneficiary_gender, contact_phone, contact_email),
      staff_users(first_name, last_name)
    `)
    .eq("ticket", decoded)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // In queue: return live status (if status is waiting/scheduled and no vitals yet, patient is awaiting_triage)
  if (row) {
    type Row = {
      ticket: string;
      status: string;
      wait_time: string | null;
      priority: string;
      source: string;
      appointment_at: string | null;
      added_at: string | null;
      patient_user_id: string | null;
      dependent_id: string | null;
      booking_request_id: string | null;
      department_id: string | null;
      assigned_doctor_id: string | null;
      walk_in_first_name: string | null;
      walk_in_last_name: string | null;
      walk_in_age_years: number | null;
      walk_in_sex: string | null;
      walk_in_phone: string | null;
      walk_in_email: string | null;
      departments?: { name: string } | null;
      patient_dependents?: {
        date_of_birth: string | null;
        gender: string | null;
      } | null;
      patient_users?: { first_name: string; last_name: string; date_of_birth: string | null; gender: string | null; email: string | null; number: string | null } | null;
      booking_requests?: {
        booking_type: string | null;
        beneficiary_date_of_birth: string | null;
        beneficiary_gender: string | null;
        contact_phone: string | null;
        contact_email: string | null;
      } | null;
      staff_users?: { first_name: string; last_name: string } | null;
    };
    const r = row as unknown as Row;
    const raw = (r.status || "").toLowerCase().trim();
    let estimatedWaitTime = r.wait_time ?? "—";

    if (ETA_ACTIVE_STATUSES.has(raw) && r.department_id) {
      const { data: sameDepartmentRows, error: sameDepartmentRowsError } = await supabase
        .from("queue_items")
        .select("ticket, status, appointment_at, added_at")
        .eq("department_id", r.department_id)
        .in("status", [...ACTIVE_QUEUE_DB_STATUSES]);

      if (!sameDepartmentRowsError && Array.isArray(sameDepartmentRows)) {
        const queueRows = sameDepartmentRows as QueueEtaRow[];
        const waitingAhead = getWaitingAheadForTicket(queueRows, r.ticket);
        if (waitingAhead != null) {
          const avgMinutes = await getRollingAverageConsultationMinutes(
            supabase,
            r.department_id,
            r.assigned_doctor_id
          );
          const estimatedMinutes = estimateWaitMinutesFromPosition(waitingAhead, avgMinutes);
          estimatedWaitTime = formatEstimatedWaitFromMinutes(estimatedMinutes);
        }
      }
    }

    const isDependentBooking = r.booking_requests?.booking_type === "dependent";
    let resolvedAge =
      r.walk_in_age_years ??
      computeAgeFromDateOfBirth(r.patient_dependents?.date_of_birth) ??
      (isDependentBooking
        ? computeAgeFromDateOfBirth(r.booking_requests?.beneficiary_date_of_birth)
        : computeAgeFromDateOfBirth(r.patient_users?.date_of_birth));
    let resolvedSex =
      r.walk_in_sex ??
      r.patient_dependents?.gender ??
      (isDependentBooking ? r.booking_requests?.beneficiary_gender : r.patient_users?.gender) ??
      null;
    let resolvedPhone =
      r.walk_in_phone ?? r.booking_requests?.contact_phone ?? r.patient_users?.number ?? null;
    let resolvedEmail =
      r.walk_in_email ?? r.booking_requests?.contact_email ?? r.patient_users?.email ?? null;

    const missingDemographics =
      resolvedAge === null || !resolvedSex || !resolvedPhone || !resolvedEmail;

    if (r.source === "booked" && (!r.booking_requests || missingDemographics)) {
      if ((resolvedAge === null || !resolvedSex) && r.dependent_id) {
        const { data: dependent } = await supabase
          .from("patient_dependents")
          .select("date_of_birth, gender")
          .eq("id", r.dependent_id)
          .maybeSingle();
        if (resolvedAge === null) {
          resolvedAge = computeAgeFromDateOfBirth(dependent?.date_of_birth ?? null);
        }
        if (!resolvedSex) {
          resolvedSex = dependent?.gender ?? null;
        }
      }

      const bookingById = r.booking_request_id
        ? await supabase
            .from("booking_requests")
            .select(`
              patient_user_id,
              booking_type,
              contact_phone,
              contact_email,
              beneficiary_date_of_birth,
              beneficiary_gender,
              patient_users(date_of_birth, gender, email, number)
            `)
            .eq("id", r.booking_request_id)
            .maybeSingle()
        : { data: null as unknown, error: null as unknown };

      const bookingByRef = !bookingById.data
        ? await supabase
            .from("booking_requests")
            .select(`
              patient_user_id,
              booking_type,
              contact_phone,
              contact_email,
              beneficiary_date_of_birth,
              beneficiary_gender,
              patient_users(date_of_birth, gender, email, number)
            `)
            .eq("reference_no", r.ticket)
            .maybeSingle()
        : { data: null as unknown, error: null as unknown };

      const bookingFallback = (bookingById.data ?? bookingByRef.data) as {
        patient_user_id?: string | null;
        booking_type: string | null;
        contact_phone: string | null;
        contact_email: string | null;
        beneficiary_date_of_birth: string | null;
        beneficiary_gender: string | null;
        patient_users?: {
          date_of_birth: string | null;
          gender: string | null;
          email: string | null;
          number: string | null;
        } | null;
      } | null;

      if (bookingFallback) {
        let fallbackPatient = bookingFallback.patient_users ?? null;
        if (!fallbackPatient) {
          const patientUserId = r.patient_user_id ?? bookingFallback.patient_user_id ?? null;
          if (patientUserId) {
            const { data: directPatient } = await supabase
              .from("patient_users")
              .select("date_of_birth, gender, email, number")
              .eq("id", patientUserId)
              .maybeSingle();
            fallbackPatient = directPatient as {
              date_of_birth: string | null;
              gender: string | null;
              email: string | null;
              number: string | null;
            } | null;
          }
        }

        const fallbackDependent = bookingFallback.booking_type === "dependent";
        if (resolvedAge === null) {
          resolvedAge = fallbackDependent
            ? computeAgeFromDateOfBirth(bookingFallback.beneficiary_date_of_birth)
            : computeAgeFromDateOfBirth(fallbackPatient?.date_of_birth);
        }
        if (!resolvedSex) {
          resolvedSex = (fallbackDependent ? bookingFallback.beneficiary_gender : fallbackPatient?.gender) ?? null;
        }
        if (!resolvedPhone) {
          resolvedPhone = bookingFallback.contact_phone ?? fallbackPatient?.number ?? null;
        }
        if (!resolvedEmail) {
          resolvedEmail = bookingFallback.contact_email ?? fallbackPatient?.email ?? null;
        }
      }
    }

    if (resolvedAge === null || !resolvedSex || !resolvedPhone || !resolvedEmail) {
      const firstNameCandidate = r.patient_users?.first_name ?? r.walk_in_first_name;
      const lastNameCandidate = r.patient_users?.last_name ?? r.walk_in_last_name;

      if (firstNameCandidate && lastNameCandidate) {
        const { data: patientByName } = await supabase
          .from("patient_users")
          .select("date_of_birth, gender, email, number")
          .eq("first_name", firstNameCandidate)
          .eq("last_name", lastNameCandidate)
          .order("created_at", { ascending: false })
          .limit(1);

        const p = (Array.isArray(patientByName) ? patientByName[0] : null) as {
          date_of_birth: string | null;
          gender: string | null;
          email: string | null;
          number: string | null;
        } | null;

        if (p) {
          if (resolvedAge === null) {
            resolvedAge = computeAgeFromDateOfBirth(p.date_of_birth);
          }
          if (!resolvedSex) {
            resolvedSex = p.gender ?? null;
          }
          if (!resolvedPhone) {
            resolvedPhone = p.number ?? null;
          }
          if (!resolvedEmail) {
            resolvedEmail = p.email ?? null;
          }
        }

        if (resolvedAge === null || !resolvedSex) {
          const { data: dependentByName } = await supabase
            .from("patient_dependents")
            .select("date_of_birth, gender")
            .eq("first_name", firstNameCandidate)
            .eq("last_name", lastNameCandidate)
            .order("created_at", { ascending: false })
            .limit(1);

          const d = (Array.isArray(dependentByName) ? dependentByName[0] : null) as {
            date_of_birth: string | null;
            gender: string | null;
          } | null;

          if (d) {
            if (resolvedAge === null) {
              resolvedAge = computeAgeFromDateOfBirth(d.date_of_birth);
            }
            if (!resolvedSex) {
              resolvedSex = d.gender ?? null;
            }
          }
        }
      }
    }

    // Patient in queue but not yet checked for triage/vitals
    if (raw === "waiting" || raw === "scheduled") {
      const { data: vitalsRow, error: vitalsError } = await supabase
        .from("vital_signs")
        .select("ticket")
        .eq("ticket", r.ticket)
        .limit(1)
        .maybeSingle();
      if (vitalsError) {
        return NextResponse.json({ error: vitalsError.message }, { status: 500 });
      }
      if (!vitalsRow) {
        const patientName =
          r.patient_users?.first_name && r.patient_users?.last_name
            ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
            : r.walk_in_first_name && r.walk_in_last_name
              ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
              : r.walk_in_first_name || r.patient_users?.first_name || null;
        const assignedDoctor =
          r.staff_users?.first_name && r.staff_users?.last_name
            ? `${r.staff_users.first_name} ${r.staff_users.last_name}`
            : null;
        return NextResponse.json({
          queueNumber: r.ticket,
          assignedDepartment: r.departments?.name ?? "—",
          estimatedWaitTime,
          status: "awaiting_triage",
          patientName,
          age: resolvedAge,
          sex: resolvedSex,
          phone: resolvedPhone,
          email: resolvedEmail,
          priority: r.priority,
          source: r.source === "walk_in" ? "walk-in" : r.source,
          appointmentDate: toLocalDateStr(r.appointment_at),
          appointmentTime: r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null,
          assignedDoctor,
          addedAt: r.added_at ?? null,
          ...(debugDemographics
            ? {
                _debugDemographics: {
                  queueItem: {
                    patient_user_id: r.patient_user_id,
                    dependent_id: r.dependent_id,
                    booking_request_id: r.booking_request_id,
                    walk_in_age_years: r.walk_in_age_years,
                    walk_in_sex: r.walk_in_sex,
                  },
                  resolved: { age: resolvedAge, sex: resolvedSex, phone: resolvedPhone, email: resolvedEmail },
                },
              }
            : {}),
        });
      }
    }

    const statusMap: Record<string, string> = {
      waiting: "waiting",
      scheduled: "waiting",
      called: "almost",
      "in progress": "almost",
      in_consultation: "proceed",
      completed: "completed",
      cancelled: "completed",
      no_show: "completed",
    };
    const patientName =
      r.patient_users?.first_name && r.patient_users?.last_name
        ? `${r.patient_users.first_name} ${r.patient_users.last_name}`
        : r.walk_in_first_name && r.walk_in_last_name
          ? `${r.walk_in_first_name} ${r.walk_in_last_name}`
          : r.walk_in_first_name || r.patient_users?.first_name || null;
    const assignedDoctor =
      r.staff_users?.first_name && r.staff_users?.last_name
        ? `${r.staff_users.first_name} ${r.staff_users.last_name}`
        : null;
    return NextResponse.json({
      queueNumber: r.ticket,
      assignedDepartment: r.departments?.name ?? "—",
      estimatedWaitTime,
      status: statusMap[raw] ?? "waiting",
      patientName,
      age: resolvedAge,
      sex: resolvedSex,
      phone: resolvedPhone,
      email: resolvedEmail,
      priority: r.priority,
      source: r.source === "walk_in" ? "walk-in" : r.source,
      appointmentDate: toLocalDateStr(r.appointment_at),
      appointmentTime: r.appointment_at ? new Date(r.appointment_at).toTimeString().slice(0, 5) : null,
      assignedDoctor,
      addedAt: r.added_at ?? null,
      ...(debugDemographics
        ? {
            _debugDemographics: {
              queueItem: {
                patient_user_id: r.patient_user_id,
                dependent_id: r.dependent_id,
                booking_request_id: r.booking_request_id,
                walk_in_age_years: r.walk_in_age_years,
                walk_in_sex: r.walk_in_sex,
              },
              resolved: { age: resolvedAge, sex: resolvedSex, phone: resolvedPhone, email: resolvedEmail },
            },
          }
        : {}),
    });
  }

  // Not in queue yet: if it's a confirmed booking, return "confirmed" so patient sees appointment and "check in when you arrive"
  const { data: booking } = await supabase
    .from("booking_requests")
    .select(`
      reference_no, patient_user_id, booking_type, requested_date, requested_time, department_id,
      patient_first_name, patient_last_name,
      contact_phone, contact_email,
      beneficiary_first_name, beneficiary_last_name, beneficiary_date_of_birth, beneficiary_gender,
      departments(name),
      patient_users(first_name, last_name, date_of_birth, gender, email, number)
    `)
    .eq("reference_no", decoded)
    .eq("status", "confirmed")
    .maybeSingle();

  if (booking) {
    const b = booking as unknown as {
      reference_no: string;
      patient_user_id: string | null;
      booking_type: string | null;
      requested_date: string | null;
      requested_time: string | null;
      patient_first_name: string | null;
      patient_last_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      beneficiary_first_name: string | null;
      beneficiary_last_name: string | null;
      beneficiary_date_of_birth: string | null;
      beneficiary_gender: string | null;
      departments?: { name: string } | { name: string }[] | null;
      patient_users?: {
        first_name: string;
        last_name: string;
        date_of_birth: string | null;
        gender: string | null;
        email: string | null;
        number: string | null;
      } | null;
    };
    let bookingPatient = b.patient_users ?? null;
    if (!bookingPatient && b.patient_user_id) {
      const { data: directPatient } = await supabase
        .from("patient_users")
        .select("first_name, last_name, date_of_birth, gender, email, number")
        .eq("id", b.patient_user_id)
        .maybeSingle();
      bookingPatient = directPatient as {
        first_name: string;
        last_name: string;
        date_of_birth: string | null;
        gender: string | null;
        email: string | null;
        number: string | null;
      } | null;
    }
    const dept = b.departments;
    const departmentName = Array.isArray(dept) ? dept[0]?.name : dept?.name;
    const isDependentBooking = b.booking_type === "dependent";
    const patientName = isDependentBooking
      ? b.beneficiary_first_name && b.beneficiary_last_name
        ? `${b.beneficiary_first_name} ${b.beneficiary_last_name}`
        : b.beneficiary_first_name ?? null
      : b.patient_first_name && b.patient_last_name
        ? `${b.patient_first_name} ${b.patient_last_name}`
        : bookingPatient?.first_name && bookingPatient?.last_name
          ? `${bookingPatient.first_name} ${bookingPatient.last_name}`
          : b.patient_first_name ?? bookingPatient?.first_name ?? null;
    const age = isDependentBooking
      ? computeAgeFromDateOfBirth(b.beneficiary_date_of_birth)
      : computeAgeFromDateOfBirth(bookingPatient?.date_of_birth);
    const sex = isDependentBooking ? b.beneficiary_gender : bookingPatient?.gender;
    return NextResponse.json({
      queueNumber: b.reference_no,
      assignedDepartment: departmentName ?? "—",
      estimatedWaitTime: "",
      status: "confirmed",
      patientName,
      age,
      sex,
      phone: b.contact_phone ?? bookingPatient?.number ?? null,
      email: b.contact_email ?? bookingPatient?.email ?? null,
      appointmentDate: b.requested_date ?? null,
      appointmentTime: b.requested_time ?? null,
      source: "booked",
      ...(debugDemographics
        ? {
            _debugDemographics: {
              bookingRequest: {
                booking_type: b.booking_type,
                patient_user_id: b.patient_user_id,
                beneficiary_date_of_birth: b.beneficiary_date_of_birth,
                beneficiary_gender: b.beneficiary_gender,
              },
              patientUser: bookingPatient,
            },
          }
        : {}),
    });
  }

  return NextResponse.json(null);
}
