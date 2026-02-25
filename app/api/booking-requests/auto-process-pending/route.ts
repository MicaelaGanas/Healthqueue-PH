import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbBookingRequest } from "../../../lib/supabase/types";
import { createBookingNotification, sendBookingStatusEmail } from "../../../lib/bookingNotifications";

const MANILA_TZ = "Asia/Manila";

function getManilaNowParts(now = new Date()): { date: string; hour: number } {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TZ,
    hour: "2-digit",
    hour12: false,
  });

  const date = dateFormatter.format(now);
  const hour = Number.parseInt(timeFormatter.format(now), 10);
  return { date, hour: Number.isFinite(hour) ? hour : 0 };
}

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.BOOKING_AUTOMATION_SECRET || process.env.CRON_SECRET;
  if (!configuredSecret) return false;

  const headerSecret = request.headers.get("x-booking-automation-secret");
  const bearer = request.headers.get("authorization");
  const bearerSecret = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;

  return headerSecret === configuredSecret || bearerSecret === configuredSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { date: todayManila, hour: manilaHour } = getManilaNowParts();
  if (manilaHour < 7) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Before 7:00 AM Manila time" });
  }

  const { data: pendingRows, error: pendingError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("status", "pending")
    .eq("requested_date", todayManila);

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  const pending = (pendingRows ?? []) as DbBookingRequest[];
  let processed = 0;

  for (const req of pending) {
    const reason = "Automatically cancelled because it was not approved by 7:00 AM on the appointment day.";
    const { error: updateError } = await supabase
      .from("booking_requests")
      .update({
        status: "cancelled",
        rejection_reason: reason,
        confirmed_at: null,
        confirmed_by: null,
        confirmed_by_staff_id: null,
      })
      .eq("id", req.id)
      .eq("status", "pending");

    if (updateError) {
      continue;
    }

    await createBookingNotification(supabase, {
      patientUserId: req.patient_user_id,
      bookingRequestId: req.id,
      type: "appointment_auto_cancelled",
      title: "Appointment auto-cancelled",
      detail: `Your booking ${req.reference_no} was automatically cancelled because it was still pending by 7:00 AM on your appointment day.`,
    });

    const { data: patient } = await supabase
      .from("patient_users")
      .select("email, first_name, last_name")
      .eq("id", req.patient_user_id)
      .maybeSingle();

    const toEmail =
      req.contact_email?.trim() ||
      (typeof patient?.email === "string" ? patient.email.trim() : "");

    await sendBookingStatusEmail({
      to: toEmail,
      patientName:
        [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "Patient",
      referenceNo: req.reference_no,
      requestedDate: req.requested_date,
      requestedTime: req.requested_time,
      status: "cancelled",
      reason,
    });

    processed += 1;
  }

  return NextResponse.json({ ok: true, processed, date: todayManila });
}