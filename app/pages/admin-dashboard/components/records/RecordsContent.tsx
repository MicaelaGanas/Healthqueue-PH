"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { getQueueRowsFromStorage } from "../../../../lib/queueSyncStorage";
import { getBookedQueueFromStorage } from "../../../../lib/queueBookedStorage";
import type { QueueRowSync } from "../../../../lib/queueSyncStorage";
import type { BookedQueueEntry } from "../../../../lib/queueBookedStorage";
import { useDepartments } from "../../../../lib/useDepartments";
import { AdminSectionHeader } from "../layout/AdminSectionHeader";

const today = () => new Date().toISOString().slice(0, 10);

type FolderKey = "all" | "booking_requests" | "appointments" | "queue" | "consultations" | "actions";

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

type ExplorerRecordType = "booking_requests" | "appointments" | "queue" | "consultations" | "actions";

type ExplorerRecord = {
  id: string;
  name: string;
  type: ExplorerRecordType;
  department: string;
  modifiedAt: string;
  owner: string;
  status?: string;
  reference?: string;
  details: Array<{ label: string; value: string }>;
};

function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return d >= from && d <= to;
}

function toDisplayDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function folderLabel(key: FolderKey): string {
  if (key === "all") return "All Files";
  if (key === "booking_requests") return "Booking Requests";
  if (key === "appointments") return "Appointments";
  if (key === "queue") return "Queue Entries";
  if (key === "consultations") return "Consultations";
  return "Staff Actions";
}

function typeLabel(type: ExplorerRecordType): string {
  if (type === "booking_requests") return "Booking";
  if (type === "appointments") return "Appointment";
  if (type === "queue") return "Queue";
  if (type === "consultations") return "Consultation";
  return "Action";
}

function typeBadgeClass(type: ExplorerRecordType): string {
  if (type === "booking_requests") return "bg-amber-100 text-amber-800";
  if (type === "appointments") return "bg-blue-100 text-blue-800";
  if (type === "queue") return "bg-slate-200 text-slate-700";
  if (type === "consultations") return "bg-emerald-100 text-emerald-800";
  return "bg-violet-100 text-violet-800";
}

export function RecordsContent() {
  const { departments } = useDepartments();
  const departmentNames = departments.map((d) => d.name);

  const [folder, setFolder] = useState<FolderKey>("all");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [department, setDepartment] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const [queueRows, setQueueRows] = useState<QueueRowSync[]>([]);
  const [bookedLocal, setBookedLocal] = useState<BookedQueueEntry[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequestRecord[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
              patientName:
                [r.patientFirstName, r.patientLastName].filter(Boolean).join(" ") ||
                [r.beneficiaryFirstName, r.beneficiaryLastName].filter(Boolean).join(" ") ||
                "—",
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
    return list;
  }, [bookingRequests, department, bookingStatus, dateFrom, dateTo]);

  const filteredQueue = useMemo(() => {
    let list = queueRows;
    if (department) list = list.filter((r) => r.department === department);
    return list.filter((r) => inDateRange(r.addedAt, dateFrom, dateTo));
  }, [queueRows, department, dateFrom, dateTo]);

  const filteredConsultations = useMemo(
    () => filteredQueue.filter((r) => String(r.status).toLowerCase() === "completed"),
    [filteredQueue]
  );

  const filteredAppointments = useMemo(() => {
    let list = bookedLocal.filter(
      (b) =>
        inDateRange(b.addedAt?.slice(0, 10), dateFrom, dateTo) ||
        (b.appointmentDate && inDateRange(b.appointmentDate, dateFrom, dateTo))
    );
    if (department) list = list.filter((r) => r.department === department);
    return list;
  }, [bookedLocal, department, dateFrom, dateTo]);

  const allRecords = useMemo<ExplorerRecord[]>(() => {
    const bookings: ExplorerRecord[] = filteredBookingRequests.map((r) => ({
      id: `booking-${r.id}`,
      name: `${r.patientName} • ${r.referenceNo}`,
      type: "booking_requests",
      department: r.department || "—",
      modifiedAt: r.createdAt || r.requestedDate || "",
      owner: r.patientName,
      status: r.status,
      reference: r.referenceNo,
      details: [
        { label: "Reference", value: r.referenceNo || "—" },
        { label: "Patient", value: r.patientName || "—" },
        { label: "Department", value: r.department || "—" },
        { label: "Status", value: r.status || "—" },
        { label: "Requested Date", value: r.requestedDate || "—" },
        { label: "Requested Time", value: r.requestedTime || "—" },
        { label: "Preferred Doctor", value: r.preferredDoctor || "—" },
      ],
    }));

    const appointments: ExplorerRecord[] = filteredAppointments.map((a) => ({
      id: `appointment-${a.referenceNo}-${a.appointmentDate ?? a.addedAt ?? ""}`,
      name: `${a.patientName} • ${a.referenceNo}`,
      type: "appointments",
      department: a.department || "—",
      modifiedAt: a.appointmentDate || a.addedAt || "",
      owner: a.patientName || "Patient",
      status: "scheduled",
      reference: a.referenceNo,
      details: [
        { label: "Reference", value: a.referenceNo || "—" },
        { label: "Patient", value: a.patientName || "—" },
        { label: "Department", value: a.department || "—" },
        { label: "Date", value: a.appointmentDate || a.addedAt?.slice(0, 10) || "—" },
        { label: "Time", value: a.appointmentTime || "—" },
        { label: "Preferred Doctor", value: a.preferredDoctor || "—" },
      ],
    }));

    const queue: ExplorerRecord[] = filteredQueue.map((q) => ({
      id: `queue-${q.ticket}`,
      name: `${q.patientName} • Ticket ${q.ticket}`,
      type: "queue",
      department: q.department || "—",
      modifiedAt: q.addedAt || "",
      owner: q.patientName || "Patient",
      status: q.status,
      reference: q.ticket,
      details: [
        { label: "Ticket", value: q.ticket || "—" },
        { label: "Patient", value: q.patientName || "—" },
        { label: "Department", value: q.department || "—" },
        { label: "Status", value: q.status || "—" },
        { label: "Added At", value: q.addedAt || "—" },
        { label: "Assigned Doctor", value: q.assignedDoctor || "—" },
      ],
    }));

    const consultations: ExplorerRecord[] = filteredConsultations.map((q) => ({
      id: `consultation-${q.ticket}`,
      name: `${q.patientName} • Ticket ${q.ticket}`,
      type: "consultations",
      department: q.department || "—",
      modifiedAt: q.addedAt || "",
      owner: q.patientName || "Patient",
      status: "completed",
      reference: q.ticket,
      details: [
        { label: "Ticket", value: q.ticket || "—" },
        { label: "Patient", value: q.patientName || "—" },
        { label: "Department", value: q.department || "—" },
        { label: "Status", value: "Completed" },
        { label: "Completed At", value: q.addedAt || "—" },
        { label: "Assigned Doctor", value: q.assignedDoctor || "—" },
      ],
    }));

    const actions: ExplorerRecord[] = activityLog.map((a) => ({
      id: `action-${a.id}`,
      name: `${a.action} • ${a.staffName}`,
      type: "actions",
      department: String(a.details.department ?? "—"),
      modifiedAt: a.createdAt || "",
      owner: a.staffName || "Staff",
      status: a.entityType ?? "activity",
      reference: a.entityId ?? "",
      details: [
        { label: "Action", value: a.action || "—" },
        { label: "Staff", value: a.staffName || "—" },
        { label: "Email", value: a.staffEmail || "—" },
        { label: "Entity Type", value: a.entityType || "—" },
        { label: "Entity ID", value: a.entityId || "—" },
        { label: "Department", value: String(a.details.department ?? "—") },
      ],
    }));

    return [...bookings, ...appointments, ...queue, ...consultations, ...actions];
  }, [filteredBookingRequests, filteredAppointments, filteredQueue, filteredConsultations, activityLog]);

  const folderCounts = useMemo(
    () => ({
      all: allRecords.length,
      booking_requests: allRecords.filter((r) => r.type === "booking_requests").length,
      appointments: allRecords.filter((r) => r.type === "appointments").length,
      queue: allRecords.filter((r) => r.type === "queue").length,
      consultations: allRecords.filter((r) => r.type === "consultations").length,
      actions: allRecords.filter((r) => r.type === "actions").length,
    }),
    [allRecords]
  );

  const visibleRecords = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    let list = folder === "all" ? allRecords : allRecords.filter((r) => r.type === folder);

    if (searchTerm) {
      list = list.filter((r) => {
        const haystack = [r.name, r.department, r.owner, r.reference ?? "", r.status ?? ""].join(" ").toLowerCase();
        return haystack.includes(searchTerm);
      });
    }

    if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "oldest") {
      return [...list].sort((a, b) => (a.modifiedAt || "").localeCompare(b.modifiedAt || ""));
    }
    return [...list].sort((a, b) => (b.modifiedAt || "").localeCompare(a.modifiedAt || ""));
  }, [allRecords, folder, search, sortBy]);

  const selectedRecord = useMemo(
    () => visibleRecords.find((r) => r.id === selectedRecordId) ?? null,
    [visibleRecords, selectedRecordId]
  );

  useEffect(() => {
    if (visibleRecords.length === 0) {
      setSelectedRecordId("");
      return;
    }
    if (!visibleRecords.some((r) => r.id === selectedRecordId)) {
      setSelectedRecordId(visibleRecords[0].id);
    }
  }, [visibleRecords, selectedRecordId]);

  const folders: Array<{ key: FolderKey; label: string }> = [
    { key: "all", label: "All Files" },
    { key: "booking_requests", label: "Booking Requests" },
    { key: "appointments", label: "Appointments" },
    { key: "queue", label: "Queue Entries" },
    { key: "consultations", label: "Consultations" },
    { key: "actions", label: "Staff Actions" },
  ];

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Records"
        description="Browse records using a file explorer layout: folders, file list, and details panel."
      />

      <div className="rounded-xl border border-[#e9ecef] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 sm:px-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-[#6C757D]">Search records</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, reference, owner..."
                className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              >
                <option value="">All departments</option>
                {departmentNames.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {folder === "booking_requests" && (
            <div className="mt-3 max-w-sm">
              <label className="block text-xs font-medium text-[#6C757D]">Booking status</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 rounded-full border-4 border-[#007bff] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-12">
            <aside className="border-b border-[#e9ecef] bg-[#fbfcfd] lg:col-span-3 lg:border-b-0 lg:border-r">
              <div className="border-b border-[#eef1f4] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Folders</p>
              </div>
              <nav className="p-2">
                {folders.map((item) => {
                  const isActive = folder === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFolder(item.key)}
                      className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                        isActive ? "bg-[#1e3a5f] text-white" : "text-[#333333] hover:bg-[#eef2f6]"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          isActive ? "bg-white/20 text-white" : "bg-[#e9ecef] text-[#495057]"
                        }`}
                      >
                        {folderCounts[item.key]}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="border-b border-[#e9ecef] lg:col-span-6 lg:border-b-0 lg:border-r">
              <div className="border-b border-[#eef1f4] px-4 py-3">
                <p className="text-sm font-semibold text-[#333333]">{folderLabel(folder)}</p>
                <p className="mt-0.5 text-xs text-[#6C757D]">{visibleRecords.length} item(s)</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#eef1f4]">
                  <thead className="bg-[#f8f9fa]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D]">Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f4] bg-white">
                    {visibleRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-sm text-[#6C757D]">
                          No records found for the selected folder and filters.
                        </td>
                      </tr>
                    ) : (
                      visibleRecords.map((record) => {
                        const active = selectedRecordId === record.id;
                        return (
                          <tr
                            key={record.id}
                            onClick={() => setSelectedRecordId(record.id)}
                            className={`cursor-pointer ${active ? "bg-[#eef4fb]" : "hover:bg-[#fafbfd]"}`}
                          >
                            <td className="px-4 py-3 text-sm text-[#333333]">
                              <div className="max-w-[280px] truncate font-medium">{record.name}</div>
                              {record.reference && <div className="mt-0.5 text-xs text-[#6C757D]">{record.reference}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeBadgeClass(record.type)}`}>
                                {typeLabel(record.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#333333]">{record.department || "—"}</td>
                            <td className="px-4 py-3 text-sm text-[#6C757D]">{toDisplayDate(record.modifiedAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="bg-[#fcfdff] lg:col-span-3">
              <div className="border-b border-[#eef1f4] px-4 py-3">
                <p className="text-sm font-semibold text-[#333333]">Details</p>
                <p className="mt-0.5 text-xs text-[#6C757D]">Select a file to preview metadata.</p>
              </div>

              <div className="p-4">
                {selectedRecord ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#6C757D]">Breadcrumb</p>
                      <p className="mt-1 text-sm text-[#333333]">Records / {folderLabel(folder)} / {selectedRecord.name}</p>
                    </div>

                    <div className="rounded-lg border border-[#e9ecef] bg-white p-3">
                      <p className="text-sm font-semibold text-[#333333]">{selectedRecord.name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeBadgeClass(selectedRecord.type)}`}>
                          {typeLabel(selectedRecord.type)}
                        </span>
                        {selectedRecord.status && (
                          <span className="rounded bg-[#e9ecef] px-2 py-0.5 text-xs font-medium text-[#495057]">
                            {selectedRecord.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#e9ecef] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Properties</p>
                      <dl className="mt-2 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <dt className="text-[#6C757D]">Owner</dt>
                          <dd className="text-[#333333] text-right">{selectedRecord.owner || "—"}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <dt className="text-[#6C757D]">Department</dt>
                          <dd className="text-[#333333] text-right">{selectedRecord.department || "—"}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <dt className="text-[#6C757D]">Modified</dt>
                          <dd className="text-[#333333] text-right">{toDisplayDate(selectedRecord.modifiedAt)}</dd>
                        </div>
                        {selectedRecord.details.map((item) => (
                          <div key={`${selectedRecord.id}-${item.label}`} className="grid grid-cols-2 gap-2">
                            <dt className="text-[#6C757D]">{item.label}</dt>
                            <dd className="text-[#333333] text-right break-words">{item.value || "—"}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#6C757D]">No file selected.</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
