import type { SupabaseClient } from "@supabase/supabase-js";

type BookingNotificationPayload = {
  patientUserId: string;
  bookingRequestId: string;
  type: string;
  title: string;
  detail: string;
};

type BookingEmailPayload = {
  to: string;
  patientName: string;
  referenceNo: string;
  requestedDate: string;
  requestedTime: string;
  status: "confirmed" | "rejected" | "cancelled";
  reason?: string | null;
};

export async function createBookingNotification(
  supabase: SupabaseClient,
  payload: BookingNotificationPayload
) {
  await supabase.from("patient_notifications").insert({
    patient_user_id: payload.patientUserId,
    booking_request_id: payload.bookingRequestId,
    type: payload.type,
    title: payload.title,
    detail: payload.detail,
    is_read: false,
  });
}

function formatStatusLabel(status: BookingEmailPayload["status"]): string {
  if (status === "confirmed") return "Confirmed";
  if (status === "rejected") return "Rejected";
  return "Cancelled";
}

export async function sendBookingStatusEmail(payload: BookingEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_NOTIFICATIONS_FROM_EMAIL;
  if (!apiKey || !from || !payload.to) return;

  const statusLabel = formatStatusLabel(payload.status);
  const reasonLine = payload.reason ? `\n\nReason: ${payload.reason}` : "";
  const text = [
    `Hello ${payload.patientName},`,
    "",
    `Your appointment request (${payload.referenceNo}) is now ${statusLabel}.`,
    `Requested schedule: ${payload.requestedDate} ${payload.requestedTime}`,
    reasonLine,
    "",
    "Please log in to your HealthQueue account to view full details.",
  ].join("\n");

  const htmlReason = payload.reason ? `<p><strong>Reason:</strong> ${payload.reason}</p>` : "";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <p>Hello ${payload.patientName},</p>
      <p>Your appointment request <strong>${payload.referenceNo}</strong> is now <strong>${statusLabel}</strong>.</p>
      <p>Requested schedule: <strong>${payload.requestedDate}</strong> at <strong>${payload.requestedTime}</strong></p>
      ${htmlReason}
      <p>Please log in to your HealthQueue account to view full details.</p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: `Appointment ${statusLabel}: ${payload.referenceNo}`,
      html,
      text,
    }),
  });
}