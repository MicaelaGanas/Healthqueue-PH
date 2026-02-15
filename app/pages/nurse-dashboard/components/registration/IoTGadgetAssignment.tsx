"use client";

import { useState } from "react";

const gadgets = [
  { id: "GDG-001", status: "Online", assignedTo: "Maria Santos", battery: "85%" },
  { id: "GDG-002", status: "Online", assignedTo: "Juan Dela Cruz", battery: "72%" },
  { id: "GDG-003", status: "Online", assignedTo: "—", battery: "100%" },
];

function GadgetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function QRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h3v3H3V3zm6 0h3v3H9V3zM3 9h3v3H3V9zm6 0h3v3H9V9zM3 15h3v3H3v-3zm6 0h3v3H9v-3zM15 3h3v3h-3V3zm6 0h3v3h-3V3zM15 9h3v3h-3V9zm6 0h3v3h-3V9zM15 15h3v3h-3v-3zm6 0h3v3h-3v-3z" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  );
}

function AssignLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function UnassignRefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function IoTGadgetAssignment() {
  const [lookupId, setLookupId] = useState("");

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <GadgetIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">IoT Gadget Assignment</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
          <span className="block text-xl font-bold text-green-800">3</span>
          <p className="text-sm text-green-700">Available</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
          <span className="block text-xl font-bold text-blue-800">3</span>
          <p className="text-sm text-blue-700">In Use</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center">
          <span className="block text-xl font-bold text-gray-700">2</span>
          <p className="text-sm text-gray-600">Offline</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
            <QRIcon className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Scan QR or enter Gadget ID..."
            className="w-full rounded-lg border border-[#dee2e6] py-2.5 pl-10 pr-3 text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-[#007bff] px-5 py-2.5 font-medium text-white hover:bg-[#0069d9]"
        >
          Lookup
        </button>
      </div>

      <div className="max-h-[320px] overflow-auto rounded-lg border border-[#e9ecef]">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Gadget ID</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Assigned To</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Battery</th>
              <th className="px-4 py-3 text-left font-medium text-[#333333]">Action</th>
            </tr>
          </thead>
          <tbody>
            {gadgets.map((g) => (
              <tr key={g.id} className="border-b border-[#e9ecef] last:border-b-0">
                <td className="px-4 py-3 font-medium text-[#333333]">{g.id}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                    <WifiIcon className="h-4 w-4" />
                    {g.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#333333]">{g.assignedTo}</td>
                <td className="px-4 py-3 text-[#333333]">{g.battery}</td>
                <td className="px-4 py-3">
                  {g.assignedTo === "—" ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-[#007bff] hover:underline"
                    >
                      <AssignLinkIcon className="h-4 w-4" />
                      Assign
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-[#007bff] hover:underline"
                    >
                      <UnassignRefreshIcon className="h-4 w-4" />
                      Unassign
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
