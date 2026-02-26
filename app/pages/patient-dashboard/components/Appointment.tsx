"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import Link from "next/link";

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
  department: string;
  preferredDoctor?: string;
  requestedDate: string;
  requestedTime: string;
  notes?: string;
  status: string;
  rejectionReason?: string;
  createdAt?: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

function formatTime(t?: string): string {
  if (!t) return "—";
  const parts = t.trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(ymd?: string): string {
  if (!ymd) return "—";
  try {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return ymd;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {label}
    </span>
  );
}

function BookingDetailsModal({
  request,
  onClose,
  formatTime,
  formatDate,
  StatusBadgeComponent,
}: {
  request: BookingRequest;
  onClose: () => void;
  formatTime: (t?: string) => string;
  formatDate: (ymd?: string) => string;
  StatusBadgeComponent: React.FC<{ status: string }>;
}) {
  const isSelf = request.bookingType === "self";
  const patientName = isSelf
    ? [request.patientFirstName, request.patientLastName].filter(Boolean).join(" ") || "Yourself"
    : [request.beneficiaryFirstName, request.beneficiaryLastName].filter(Boolean).join(" ") || "—";
  const submittedAt = request.createdAt
    ? new Date(request.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-details-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl sm:rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <h2 id="booking-details-title" className="text-base sm:text-lg font-bold text-[#333333]">Booking details</h2>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-500 truncate">Reference: {request.referenceNo}</p>
          </div>
          <StatusBadgeComponent status={request.status} />
        </div>
        <div className="space-y-4 px-4 py-4 text-sm">
          <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,8rem)_1fr] gap-x-3 gap-y-2">
            <dt className="text-gray-500">Booking for</dt>
            <dd className="text-[#333333]">{isSelf ? "Yourself" : "Someone else"}</dd>
            <dt className="text-gray-500">Patient name</dt>
            <dd className="text-[#333333]">{patientName}</dd>
            {(request.contactPhone || request.contactEmail) && (
              <>
                {request.contactPhone && (
                  <>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-[#333333]">{request.contactPhone}</dd>
                  </>
                )}
                {request.contactEmail && (
                  <>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-[#333333]">{request.contactEmail}</dd>
                  </>
                )}
              </>
            )}
            <dt className="text-gray-500">Department</dt>
            <dd className="text-[#333333]">{request.department}</dd>
            <dt className="text-gray-500">Requested date</dt>
            <dd className="text-[#333333]">{formatDate(request.requestedDate)}</dd>
            <dt className="text-gray-500">Requested time</dt>
            <dd className="text-[#333333]">{formatTime(request.requestedTime)}</dd>
            <dt className="text-gray-500">Preferred doctor</dt>
            <dd className="text-[#333333]">{request.preferredDoctor ?? "—"}</dd>
            <dt className="text-gray-500">Submitted</dt>
            <dd className="text-[#333333]">{submittedAt}</dd>
            {request.notes && (
              <>
                <dt className="text-gray-500">Notes</dt>
                <dd className="text-[#333333]">{request.notes}</dd>
              </>
            )}
            {request.status === "rejected" && request.rejectionReason && (
              <>
                <dt className="text-gray-500">Rejection reason</dt>
                <dd className="text-[#333333] text-red-600">{request.rejectionReason}</dd>
              </>
            )}
          </dl>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type AppointmentForQueue = {
  referenceNo: string;
  requestedDate: string;
  requestedTime: string;
  department: string;
};

type AppointmentProps = {
  onViewQueueStatus?: (appointment: AppointmentForQueue) => void;
};

export function Appointment({ onViewQueueStatus }: AppointmentProps) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">("all");
  const [detailsRequest, setDetailsRequest] = useState<BookingRequest | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter && req.status !== statusFilter) return false;
      if (dateFilter === "all") return true;
      const reqDate = req.requestedDate ?? "";
      if (dateFilter === "upcoming") return reqDate >= today;
      if (dateFilter === "past") return reqDate < today;
      return true;
    });
  }, [requests, statusFilter, dateFilter, today]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setError("Unable to load session.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Please sign in to view your appointments.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/booking-requests", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setError("Failed to load appointments.");
          setRequests([]);
          return;
        }
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
        setError("");
      } catch {
        setError("Failed to load appointments.");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-4 sm:p-6 md:p-8">
        <p className="text-gray-600 text-sm sm:text-base">Loading your appointments…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-4 sm:p-6 md:p-8">
        <p className="text-red-600 text-sm sm:text-base">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-b-lg shadow-sm p-4 sm:p-6 md:p-8">
        <p className="text-gray-600 mb-4 text-sm sm:text-base">You don’t have any appointments yet.</p>
        <Link
          href="/pages/book/step-1"
          className="inline-flex items-center gap-2 rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
        >
          Book an appointment
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-4 sm:p-6 md:p-8">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg font-bold text-[#333333]">Your appointments</h2>
        <Link
          href="/pages/book/step-1"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#007bff] px-4 py-2 text-sm font-medium text-[#007bff] hover:bg-[#e7f1ff] w-full sm:w-auto"
        >
          Book another
        </Link>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0">
          <label htmlFor="appointment-status-filter" className="text-xs sm:text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="appointment-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff] w-full sm:w-auto min-w-0"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0">
          <label htmlFor="appointment-date-filter" className="text-xs sm:text-sm font-medium text-gray-700">
            Date
          </label>
          <select
            id="appointment-date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as "all" | "upcoming" | "past")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff] w-full sm:w-auto min-w-0"
          >
            {DATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs sm:text-sm text-gray-500">
          Showing {filteredRequests.length} of {requests.length}
        </p>
      </div>

      <ul className="space-y-3 sm:space-y-4">
        {filteredRequests.map((req) => {
          const patientLabel =
            req.bookingType === "dependent" && (req.beneficiaryFirstName || req.beneficiaryLastName)
              ? [req.beneficiaryFirstName, req.beneficiaryLastName].filter(Boolean).join(" ")
              : "Yourself";
          return (
            <li
              key={req.id}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex flex-col gap-3 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#333333] text-sm sm:text-base truncate">Ref: {req.referenceNo}</p>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
                    {formatDate(req.requestedDate)} · {formatTime(req.requestedTime)}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 break-words">
                    {req.department}
                    {req.preferredDoctor ? ` · ${req.preferredDoctor}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">For: {patientLabel}</p>
                  {req.status === "rejected" && req.rejectionReason && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600 break-words">Reason: {req.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 border-t border-gray-200/80 pt-3 sm:border-0 sm:pt-0">
                  <StatusBadge status={req.status} />
                  {onViewQueueStatus && req.status === "confirmed" && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewQueueStatus({
                          referenceNo: req.referenceNo,
                          requestedDate: req.requestedDate ?? "",
                          requestedTime: req.requestedTime ?? "",
                          department: req.department,
                        })
                      }
                      className="rounded-lg bg-[#007bff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0069d9] flex-1 sm:flex-none min-w-0"
                    >
                      View queue status
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailsRequest(req)}
                    className="rounded-lg border border-[#007bff] bg-white px-3 py-1.5 text-xs font-medium text-[#007bff] hover:bg-[#e7f1ff] flex-1 sm:flex-none min-w-0"
                  >
                    View details
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {filteredRequests.length === 0 && requests.length > 0 && (
        <p className="mt-4 text-center text-gray-500">No appointments match the current filters.</p>
      )}

      {detailsRequest && (
        <BookingDetailsModal
          request={detailsRequest}
          onClose={() => setDetailsRequest(null)}
          formatTime={formatTime}
          formatDate={formatDate}
          StatusBadgeComponent={StatusBadge}
        />
      )}
    </div>
  );
}
