"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { getQueueRowsFromStorage } from "../../../../lib/queueSyncStorage";
import { getBookedQueueFromStorage } from "../../../../lib/queueBookedStorage";
import type { QueueRowSync } from "../../../../lib/queueSyncStorage";
import type { BookedQueueEntry } from "../../../../lib/queueBookedStorage";
import { useDepartments } from "../../../../lib/useDepartments";

const today = () => new Date().toISOString().slice(0, 10);

type RecordTypeFilter = "all" | "booking_requests" | "appointments" | "queue" | "consultations" | "actions";

type BookingRequestRecord = {
  id: string;
  referenceNo: string;
  patientName: string;
  department: string;
  status: string;
  requestedDate: string | null;
  requestedTime: string | null;
  preferredDoctor?: string;
  createdAt: string;
};

type ActivityEntry = {
  id: string;
  staffName: string;
  staffEmail: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return d >= from && d <= to;
}

export function RecordsContent() {
  const { departments } = useDepartments();
  const departmentNames = departments.map((d) => d.name);
  const [recordType, setRecordType] = useState<RecordTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [department, setDepartment] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [queueRows, setQueueRows] = useState<QueueRowSync[]>([]);
  const [bookedLocal, setBookedLocal] = useState<BookedQueueEntry[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequestRecord[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQueueRows(getQueueRowsFromStorage());
    setBookedLocal(getBookedQueueFromStorage());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchApi() {
      setError(null);
      setLoading(true);
      const supabase = createSupabaseBrowser();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${session.access_token}` };

      try {
        const [bookingsRes, activityRes] = await Promise.all([
          fetch("/api/booking-requests", { headers }),
          fetch(`/api/admin/activity-log?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers }),
        ]);

        if (cancelled) return;

        if (bookingsRes.ok) {
          const list = (await bookingsRes.json()) as {
            id: string;
            referenceNo: string;
            patientFirstName?: string;
            patientLastName?: string;
            beneficiaryFirstName?: string;
            beneficiaryLastName?: string;
            department: string;
            status: string;
            requestedDate: string | null;
            requestedTime: string | null;
            preferredDoctor?: string;
            createdAt: string;
          }[];
          setBookingRequests(
            list.map((r) => ({
              id: r.id,
              referenceNo: r.referenceNo,
              patientName: [r.patientFirstName, r.patientLastName].filter(Boolean).join(" ") ||
                [r.beneficiaryFirstName, r.beneficiaryLastName].filter(Boolean).join(" ") || "—",
              department: r.department,
              status: r.status,
              requestedDate: r.requestedDate ?? null,
              requestedTime: r.requestedTime ?? null,
              preferredDoctor: r.preferredDoctor,
              createdAt: r.createdAt,
            }))
          );
        }
        if (activityRes.ok) {
          const list = (await activityRes.json()) as ActivityEntry[];
          setActivityLog(list);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load records");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchApi();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const filteredBookingRequests = useMemo(() => {
    let list = bookingRequests;
    if (department) list = list.filter((r) => r.department === department);
    if (bookingStatus) list = list.filter((r) => r.status === bookingStatus);
    list = list.filter(
      (r) =>
        inDateRange(r.requestedDate ?? undefined, dateFrom, dateTo) ||
        inDateRange(r.createdAt?.slice(0, 10), dateFrom, dateTo)
    );
    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [bookingRequests, department, bookingStatus, dateFrom, dateTo]);

  const filteredQueue = useMemo(() => {
    let list = queueRows;
    if (department) list = list.filter((r) => r.department === department);
    return list.filter((r) => inDateRange(r.addedAt, dateFrom, dateTo));
  }, [queueRows, department, dateFrom, dateTo]);

  const filteredConsultations = useMemo(
    () => filteredQueue.filter((r) => r.status === "Completed"),
    [filteredQueue]
  );

  const filteredAppointments = useMemo(() => {
    let list = bookedLocal.filter(
      (b) =>
        inDateRange(b.addedAt?.slice(0, 10), dateFrom, dateTo) ||
        (b.appointmentDate && inDateRange(b.appointmentDate, dateFrom, dateTo))
    );
    if (department) list = list.filter((r) => r.department === department);
    return list.sort((a, b) => (b.appointmentDate || b.addedAt || "").localeCompare(a.appointmentDate || a.addedAt || ""));
  }, [bookedLocal, department, dateFrom, dateTo]);

  const filteredActivity = useMemo(() => activityLog, [activityLog]);

  const showBookingRequests = recordType === "all" || recordType === "booking_requests";
  const showAppointments = recordType === "all" || recordType === "appointments";
  const showQueue = recordType === "all" || recordType === "queue";
  const showConsultations = recordType === "all" || recordType === "consultations";
  const showActions = recordType === "all" || recordType === "actions";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-[#333333]">Filters</h3>
          <p className="mt-0.5 text-xs text-[#6C757D]">Choose record type, date range, department, and status.</p>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6C757D] mb-1.5">Record type</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all" as const, label: "All" },
                  { value: "booking_requests" as const, label: "Booking requests" },
                  { value: "appointments" as const, label: "Appointments" },
                  { value: "queue" as const, label: "Queue" },
                  { value: "consultations" as const, label: "Consultations" },
                  { value: "actions" as const, label: "Staff actions" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRecordType(value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    recordType === value ? "bg-[#1e3a5f] text-white" : "bg-[#e9ecef] text-[#333333] hover:bg-[#dee2e6]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
              >
                <option value="">All departments</option>
                {departmentNames.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Booking status</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333]"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (showBookingRequests || showActions) ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {showBookingRequests && (
            <SectionCard
              title="Booking requests"
              subtitle="Appointment requests from patients (confirmed, pending, or rejected)."
              count={filteredBookingRequests.length}
            >
              {filteredBookingRequests.length === 0 ? (
                <p className="text-sm text-[#6C757D] py-4">No booking requests match the filters.</p>
              ) : (
                <div className="space-y-2">
                  {filteredBookingRequests.slice(0, 50).map((r) => (
                    <RecordCardBooking key={r.id} record={r} />
                  ))}
                  {filteredBookingRequests.length > 50 && (
                    <p className="text-xs text-[#6C757D] pt-2">+{filteredBookingRequests.length - 50} more</p>
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {showAppointments && (
            <SectionCard
              title="Appointments"
              subtitle="Scheduled appointments (from booking flow / local)."
              count={filteredAppointments.length}
            >
              {filteredAppointments.length === 0 ? (
                <p className="text-sm text-[#6C757D] py-4">No appointments in the date range.</p>
              ) : (
                <div className="space-y-2">
                  {filteredAppointments.slice(0, 50).map((b) => (
                    <RecordCardAppointment key={b.referenceNo} entry={b} />
                  ))}
                  {filteredAppointments.length > 50 && (
                    <p className="text-xs text-[#6C757D] pt-2">+{filteredAppointments.length - 50} more</p>
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {showQueue && (
            <SectionCard
              title="Queue entries"
              subtitle="Patients currently or previously in the queue (all statuses)."
              count={filteredQueue.length}
            >
              {filteredQueue.length === 0 ? (
                <p className="text-sm text-[#6C757D] py-4">No queue entries match the filters.</p>
              ) : (
                <div className="space-y-2">
                  {filteredQueue.slice(0, 50).map((r) => (
                    <RecordCardQueue key={r.ticket} row={r} />
                  ))}
                  {filteredQueue.length > 50 && (
                    <p className="text-xs text-[#6C757D] pt-2">+{filteredQueue.length - 50} more</p>
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {showConsultations && (
            <SectionCard
              title="Consultations"
              subtitle="Completed consultations in the date range."
              count={filteredConsultations.length}
            >
              {filteredConsultations.length === 0 ? (
                <p className="text-sm text-[#6C757D] py-4">No completed consultations in range.</p>
              ) : (
                <div className="space-y-2">
                  {filteredConsultations.slice(0, 50).map((r) => (
                    <RecordCardConsultation key={r.ticket} row={r} />
                  ))}
                  {filteredConsultations.length > 50 && (
                    <p className="text-xs text-[#6C757D] pt-2">+{filteredConsultations.length - 50} more</p>
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {showActions && (
            <SectionCard
              title="Staff actions"
              subtitle="Actions by staff (confirm booking, add walk-in, etc.) in the date range."
              count={filteredActivity.length}
            >
              {filteredActivity.length === 0 ? (
                <p className="text-sm text-[#6C757D] py-4">No staff actions in the date range.</p>
              ) : (
                <div className="space-y-2">
                  {filteredActivity.slice(0, 50).map((r) => (
                    <RecordCardAction key={r.id} entry={r} />
                  ))}
                  {filteredActivity.length > 50 && (
                    <p className="text-xs text-[#6C757D] pt-2">+{filteredActivity.length - 50} more</p>
                  )}
                </div>
              )}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-[#333333]">{title}</h4>
          <span className="rounded-full bg-[#e9ecef] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#333333]">
            {count}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#6C757D]">{subtitle}</p>
      </div>
      <div className="p-4 max-h-[420px] overflow-y-auto">{children}</div>
    </div>
  );
}

function RecordCardBooking({ record }: { record: BookingRequestRecord }) {
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#333333]">{record.patientName}</span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            record.status === "confirmed"
              ? "bg-green-100 text-green-800"
              : record.status === "rejected"
                ? "bg-red-100 text-red-800"
                : record.status === "cancelled"
                  ? "bg-gray-200 text-gray-700"
                  : "bg-amber-100 text-amber-800"
          }`}
        >
          {record.status}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs text-[#6C757D]">
        <span>{record.department}</span>
        <span>{record.referenceNo}</span>
        <span>{record.requestedDate || record.createdAt?.slice(0, 10) || "—"}</span>
        {record.preferredDoctor && <span className="truncate max-w-[140px]">{record.preferredDoctor}</span>}
      </div>
    </div>
  );
}

function RecordCardAppointment({ entry }: { entry: BookedQueueEntry }) {
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#333333]">{entry.patientName}</span>
        <span className="rounded bg-[#1e3a5f]/10 px-2 py-0.5 text-xs font-medium text-[#1e3a5f]">Scheduled</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs text-[#6C757D]">
        <span>{entry.department}</span>
        <span>{entry.appointmentDate || entry.addedAt?.slice(0, 10) || "—"}</span>
        <span>{entry.appointmentTime || "—"}</span>
        <span>{entry.referenceNo}</span>
        {entry.preferredDoctor && <span className="truncate max-w-[120px]">{entry.preferredDoctor}</span>}
      </div>
    </div>
  );
}

function RecordCardQueue({ row }: { row: QueueRowSync }) {
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#333333]">{row.patientName}</span>
        <span className="rounded bg-[#e9ecef] px-2 py-0.5 text-xs font-medium text-[#333333]">{row.status}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs text-[#6C757D]">
        <span>{row.department}</span>
        <span>{row.addedAt ? row.addedAt.slice(0, 10) : "—"}</span>
        <span>Ticket {row.ticket}</span>
        {row.assignedDoctor && <span className="truncate max-w-[120px]">{row.assignedDoctor}</span>}
      </div>
    </div>
  );
}

function RecordCardConsultation({ row }: { row: QueueRowSync }) {
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#333333]">{row.patientName}</span>
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Completed</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs text-[#6C757D]">
        <span>{row.department}</span>
        <span>{row.addedAt ? row.addedAt.slice(0, 10) : "—"}</span>
        {row.assignedDoctor && <span className="truncate max-w-[120px]">{row.assignedDoctor}</span>}
      </div>
    </div>
  );
}

function RecordCardAction({ entry }: { entry: ActivityEntry }) {
  const time = entry.createdAt ? new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—";
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#333333]">{entry.staffName}</span>
        <span className="rounded bg-[#1e3a5f]/10 px-2 py-0.5 text-xs font-medium text-[#1e3a5f]">{entry.action}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs text-[#6C757D]">
        <span>{time}</span>
        {entry.entityType && <span>{entry.entityType}</span>}
        {entry.entityId && <span className="truncate max-w-[120px]">{entry.entityId}</span>}
      </div>
    </div>
  );
}
