"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useNurseQueue } from "../../context/NurseQueueContext";

type BookingRequest = {
  id: string;
  referenceNo: string;
  bookingType: string;
  patientFirstName?: string;
  patientLastName?: string;
  contactPhone?: string;
  contactEmail?: string;
  beneficiaryFirstName?: string;
  beneficiaryLastName?: string;
  beneficiaryDateOfBirth?: string;
  beneficiaryGender?: string;
  relationship?: string;
  department: string;
  preferredDoctor?: string;
  requestedDate: string;
  requestedTime: string;
  notes?: string;
  status: string;
  createdAt?: string;
};

function formatTime(t?: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  child: "My child",
  parent: "My parent",
  spouse: "My spouse",
  elder: "Elder (e.g. grandparent)",
  other: "Other",
};

function BookingRequestSummaryModal({
  request,
  onClose,
  onConfirm,
  onReject,
  actingId,
  rejectReason,
  onRejectReasonChange,
}: {
  request: BookingRequest;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  actingId: string | null;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
}) {
  const isSelf = request.bookingType === "self";
  const relationshipLabel = request.relationship ? (RELATIONSHIP_LABELS[request.relationship] ?? request.relationship) : "—";
  const submittedAt = request.createdAt
    ? new Date(request.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#e9ecef] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 border-b border-[#e9ecef] bg-white px-4 py-3">
          <h2 id="summary-title" className="text-lg font-bold text-[#333333]">Booking request details</h2>
          <p className="mt-0.5 text-sm text-[#6C757D]">Reference: {request.referenceNo}</p>
        </div>
        <div className="space-y-4 px-4 py-4 text-sm">
          <dl className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3 gap-y-2">
            <dt className="text-[#6C757D]">Booking for</dt>
            <dd className="text-[#333333]">{isSelf ? "Self" : "Someone else (dependent)"}</dd>

            {isSelf ? (
              <>
                <dt className="text-[#6C757D]">Patient name</dt>
                <dd className="text-[#333333]">
                  {[request.patientFirstName, request.patientLastName].filter(Boolean).join(" ") || "—"}
                </dd>
                {(request.contactPhone || request.contactEmail) && (
                  <>
                    {request.contactPhone && (
                      <>
                        <dt className="text-[#6C757D]">Contact phone</dt>
                        <dd className="text-[#333333]">{request.contactPhone}</dd>
                      </>
                    )}
                    {request.contactEmail && (
                      <>
                        <dt className="text-[#6C757D]">Contact email</dt>
                        <dd className="text-[#333333]">{request.contactEmail}</dd>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <dt className="text-[#6C757D]">Patient name</dt>
                <dd className="text-[#333333]">{[request.beneficiaryFirstName, request.beneficiaryLastName].filter(Boolean).join(" ")}</dd>
                <dt className="text-[#6C757D]">Relationship</dt>
                <dd className="text-[#333333]">{relationshipLabel}</dd>
                {request.beneficiaryDateOfBirth && (
                  <>
                    <dt className="text-[#6C757D]">Date of birth</dt>
                    <dd className="text-[#333333]">{request.beneficiaryDateOfBirth}</dd>
                  </>
                )}
                {request.beneficiaryGender && (
                  <>
                    <dt className="text-[#6C757D]">Gender</dt>
                    <dd className="text-[#333333]">{request.beneficiaryGender}</dd>
                  </>
                )}
              </>
            )}

            <dt className="text-[#6C757D]">Department</dt>
            <dd className="text-[#333333]">{request.department}</dd>
            <dt className="text-[#6C757D]">Requested date</dt>
            <dd className="text-[#333333]">{request.requestedDate}</dd>
            <dt className="text-[#6C757D]">Requested time</dt>
            <dd className="text-[#333333]">{formatTime(request.requestedTime)}</dd>
            <dt className="text-[#6C757D]">Preferred doctor</dt>
            <dd className="text-[#333333]">{request.preferredDoctor ?? "—"}</dd>
            <dt className="text-[#6C757D]">Submitted</dt>
            <dd className="text-[#333333]">{submittedAt}</dd>
            {request.notes && (
              <>
                <dt className="text-[#6C757D]">Notes</dt>
                <dd className="text-[#333333]">{request.notes}</dd>
              </>
            )}
          </dl>
          <div className="border-t border-[#e9ecef] pt-4">
            <label className="block text-[#6C757D]">Rejection reason (optional)</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="e.g. slot no longer available"
              className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-[#333333]"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#e9ecef] bg-[#f8f9fa] px-4 py-3">
          <button type="button" onClick={onClose} className="rounded border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#e9ecef]">
            Close
          </button>
          <button
            type="button"
            disabled={actingId === request.id}
            onClick={onConfirm}
            className="rounded bg-[#28a745] px-3 py-2 text-sm font-medium text-white hover:bg-[#218838] disabled:opacity-50"
          >
            {actingId === request.id ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={actingId === request.id}
            onClick={onReject}
            className="rounded border border-[#dc3545] bg-white px-3 py-2 text-sm font-medium text-[#dc3545] hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

type PendingBookingRequestsProps = {
  refreshTrigger?: number;
  onPendingChange?: () => void;
};

export function PendingBookingRequests({ refreshTrigger, onPendingChange }: PendingBookingRequestsProps) {
  const { refetchQueue, addBookedRowFromConfirm } = useNurseQueue();
  const [list, setList] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [summaryRequest, setSummaryRequest] = useState<BookingRequest | null>(null);

  const loadPending = async (silent = false) => {
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError("");
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      if (!silent) setLoading(false);
      return;
    }
    const res = await fetch("/api/booking-requests?status=pending", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!silent) setLoading(false);
    if (!res.ok) {
      if (!silent) setError("Failed to load pending requests.");
      return;
    }
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadPending();
  }, []);

  // Refetch when parent triggers (polling or after confirm elsewhere) so new bookings appear without refresh.
  useEffect(() => {
    if (refreshTrigger === undefined || refreshTrigger === 0) return;
    loadPending(true);
  }, [refreshTrigger]);

  const handleConfirm = async (id: string) => {
    const supabase = createSupabaseBrowser();
    if (!supabase?.auth.getSession) return;
    setConfirmError(null);
    setActingId(id);
    const request = list.find((r) => r.id === id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch(`/api/booking-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ status: "confirmed" }),
    });
    setActingId(null);
    if (res.ok) {
      if (request) {
        const patientName =
          request.bookingType === "dependent"
            ? [request.beneficiaryFirstName, request.beneficiaryLastName].filter(Boolean).join(" ") || "Dependent"
            : [request.patientFirstName, request.patientLastName].filter(Boolean).join(" ") || "Patient";
        addBookedRowFromConfirm({
          ticket: request.referenceNo,
          patientName,
          department: request.department,
          requestedDate: request.requestedDate,
          requestedTime: request.requestedTime ?? null,
          preferredDoctor: request.preferredDoctor ?? null,
        });
      }
      setList((prev) => prev.filter((r) => r.id !== id));
      setSummaryRequest((prev) => (prev?.id === id ? null : prev));
      onPendingChange?.();
      await refetchQueue();
      setTimeout(() => refetchQueue(), 600);
    } else {
      const body = await res.json().catch(() => ({}));
      setConfirmError((body.error as string) || "Failed to confirm. Try again.");
    }
  };

  const handleReject = async (id: string) => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    setActingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch(`/api/booking-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ status: "rejected", rejectionReason: rejectReason[id] || "" }),
    });
    setActingId(null);
    if (res.ok) {
      setList((prev) => prev.filter((r) => r.id !== id));
      setRejectReason((prev) => ({ ...prev, [id]: "" }));
      setSummaryRequest((prev) => (prev?.id === id ? null : prev));
      onPendingChange?.();
    }
  };

  if (loading) return <p className="text-sm text-[#6C757D]">Loading pending requests…</p>;
  if (error) return <p className="text-sm text-[#dc3545]">{error}</p>;
  if (list.length === 0) return <p className="text-sm text-[#6C757D]">No pending booking requests.</p>;

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      <div className="border-b border-[#e9ecef] px-4 py-3">
        <h3 className="font-bold text-[#333333]">Pending requests (awaiting confirmation)</h3>
        <p className="mt-0.5 text-xs text-[#6C757D]">Confirm to add the patient to the queue. Reject to decline the request.</p>
        {confirmError && (
          <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {confirmError}
            <button type="button" onClick={() => setConfirmError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-[#333333]">Reference</th>
              <th className="px-3 py-2 text-left font-medium text-[#333333]">For</th>
              <th className="px-3 py-2 text-left font-medium text-[#333333]">Department</th>
              <th className="px-3 py-2 text-left font-medium text-[#333333]">Date</th>
              <th className="px-3 py-2 text-left font-medium text-[#333333]">Time</th>
              <th className="px-3 py-2 text-left font-medium text-[#333333]">Doctor</th>
              <th className="px-3 py-2 text-right font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9ecef]">
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-[#f8f9fa]">
                <td className="px-3 py-2 font-medium text-[#007bff]">{r.referenceNo}</td>
                <td className="px-3 py-2 text-[#333333]">
                  {r.bookingType === "dependent"
                    ? `Dependent: ${[r.beneficiaryFirstName, r.beneficiaryLastName].filter(Boolean).join(" ")}`
                    : [r.patientFirstName, r.patientLastName].filter(Boolean).join(" ") || "Self"}
                </td>
                <td className="px-3 py-2 text-[#333333]">{r.department}</td>
                <td className="px-3 py-2 text-[#333333]">{r.requestedDate}</td>
                <td className="px-3 py-2 text-[#333333]">{formatTime(r.requestedTime)}</td>
                <td className="px-3 py-2 text-[#333333]">{r.preferredDoctor ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSummaryRequest(r)}
                      className="rounded border border-[#007bff] bg-white px-2 py-1.5 text-xs font-medium text-[#007bff] hover:bg-[#e7f1ff]"
                    >
                      Summary
                    </button>
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      value={rejectReason[r.id] ?? ""}
                      onChange={(e) => setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className="max-w-[140px] rounded border border-[#dee2e6] px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => handleConfirm(r.id)}
                      className="rounded bg-[#28a745] px-2 py-1.5 text-xs font-medium text-white hover:bg-[#218838] disabled:opacity-50"
                    >
                      {actingId === r.id ? "…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => handleReject(r.id)}
                      className="rounded border border-[#dc3545] bg-white px-2 py-1.5 text-xs font-medium text-[#dc3545] hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {summaryRequest && (
        <BookingRequestSummaryModal
          request={summaryRequest}
          onClose={() => setSummaryRequest(null)}
          onConfirm={() => handleConfirm(summaryRequest.id)}
          onReject={() => handleReject(summaryRequest.id)}
          actingId={actingId}
          rejectReason={rejectReason[summaryRequest.id] ?? ""}
          onRejectReasonChange={(v) => setRejectReason((prev) => ({ ...prev, [summaryRequest.id]: v }))}
        />
      )}
    </div>
  );
}
