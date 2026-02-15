"use client";

const ROWS = [
  { ticket: "A-001", patientName: "Maria Santos", department: "General Consultation", priority: "normal", status: "in progress", waitTime: "" },
  { ticket: "A-002", patientName: "Juan Dela Cruz", department: "Laboratory", priority: "normal", status: "called", waitTime: "" },
  { ticket: "E-001", patientName: "Ana Reyes", department: "Emergency Room", priority: "emergency", status: "in progress", waitTime: "" },
  { ticket: "A-003", patientName: "Pedro Garcia", department: "Pharmacy", priority: "normal", status: "waiting", waitTime: "18 min" },
  { ticket: "U-001", patientName: "Rosa Martinez", department: "X-Ray", priority: "urgent", status: "waiting", waitTime: "25 min" },
  { ticket: "A-004", patientName: "Carlos Ramos", department: "General Consultation", priority: "normal", status: "waiting", waitTime: "32 min" },
  { ticket: "A-005", patientName: "Elena Cruz", department: "Pediatrics", priority: "normal", status: "completed", waitTime: "" },
  { ticket: "A-006", patientName: "Miguel Torres", department: "Laboratory", priority: "normal", status: "no show", waitTime: "" },
];

const PRIORITY_STYLES: Record<string, string> = {
  normal: "bg-blue-100 text-blue-800",
  urgent: "bg-amber-100 text-amber-800",
  emergency: "bg-red-100 text-red-800",
};

const STATUS_STYLES: Record<string, string> = {
  waiting: "bg-gray-100 text-gray-700",
  called: "bg-amber-100 text-amber-800",
  "in progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  "no show": "bg-red-100 text-red-800",
};

function Badge({ value, styles }: { value: string; styles: Record<string, string> }) {
  const label = value.replace(/_/g, " ");
  const cls = styles[value] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6v0a6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SkipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  );
}

export function PatientQueueTable() {
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      <h3 className="border-b border-[#e9ecef] px-4 py-3 text-base font-bold text-[#333333]">
        Patient Queue
      </h3>
      <div className="max-h-[400px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Ticket</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Patient Name</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Department</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Wait Time</th>
              <th className="px-4 py-3 text-right font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.ticket} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
                <td className="px-4 py-3 font-medium text-[#333333]">{r.ticket}</td>
                <td className="px-4 py-3 text-[#333333]">{r.patientName}</td>
                <td className="px-4 py-3 text-[#333333]">{r.department}</td>
                <td className="px-4 py-3">
                  <Badge value={r.priority} styles={PRIORITY_STYLES} />
                </td>
                <td className="px-4 py-3">
                  <Badge value={r.status} styles={STATUS_STYLES} />
                </td>
                <td className="px-4 py-3 text-[#333333]">{r.waitTime || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
                      aria-label="Notify"
                    >
                      <BellIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
                      aria-label="Call"
                    >
                      <PlayIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]"
                      aria-label="Skip"
                    >
                      <SkipIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
