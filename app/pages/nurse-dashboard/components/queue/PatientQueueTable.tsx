"use client";

const ROWS = [
  { queue: "TRG-001", patient: "Rosa Villanueva", age: 58, arrival: "08:15 AM", department: "Chest Pain, shortness of breath", status: "Waiting", triage: "—" },
  { queue: "TRG-002", patient: "Carlos Mendoza", age: 34, arrival: "10:23 AM", department: "Fever for 3 days, cough", status: "Assessed", triage: "L4" },
  { queue: "TRG-003", patient: "Elena Cruz", age: 22, arrival: "11:20 AM", department: "Severe headache, dizziness", status: "Waiting", triage: "—" },
  { queue: "TRG-004", patient: "Rosa Villanueva", age: 58, arrival: "01:15 PM", department: "High blood pressure, chest discomfort", status: "Referred", triage: "L2" },
  { queue: "TRG-005", patient: "Patricia Gomez", age: 45, arrival: "04:15 PM", department: "Minor cut on hand", status: "Assessed", triage: "L4" },
];

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Waiting: "bg-amber-100 text-amber-800",
    Assessed: "bg-blue-100 text-blue-800",
    Referred: "bg-green-100 text-green-800",
  };
  const s = styles[status] ?? "bg-gray-100 text-gray-800";
  return <span className={"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium " + s}>{status}</span>;
}

export function PatientQueueTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e9ecef] bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <th className="px-4 py-3 text-left font-medium text-[#333333]">Queue #</th>
            <th className="px-4 py-3 text-left font-medium text-[#333333]">Patient</th>
            <th className="px-4 py-3 text-left font-medium text-[#333333]">Arrival</th>
            <th className="px-4 py-3 text-left font-medium text-[#333333]">Department</th>
            <th className="px-4 py-3 text-left font-medium text-[#333333]">Status</th>
            <th className="px-4 py-3 text-left font-medium text-[#333333]">Triage</th>
            <th className="px-4 py-3 text-right font-medium text-[#333333]"> </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.queue} className="border-b border-[#e9ecef] last:border-b-0 hover:bg-[#f8f9fa]">
              <td className="px-4 py-3 font-medium text-[#333333]">{r.queue}</td>
              <td className="px-4 py-3 text-[#333333]">{r.patient} ({r.age} years old)</td>
              <td className="px-4 py-3 text-[#333333]">{r.arrival}</td>
              <td className="px-4 py-3 text-[#333333]">{r.department}</td>
              <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              <td className="px-4 py-3 text-[#333333]">{r.triage}</td>
              <td className="px-4 py-3 text-right">
                <button type="button" className="rounded p-1 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#333333]" aria-label="Actions">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
