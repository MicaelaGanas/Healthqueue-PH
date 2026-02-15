"use client";

import { useState, useEffect, useMemo } from "react";
import { getQueueRowsFromStorage, updateQueueRowStatusInStorage } from "../../../../lib/queueSyncStorage";
import type { QueueRowSync } from "../../../../lib/queueSyncStorage";
import { DOCTORS_BY_DEPARTMENT } from "../../../../lib/departments";

const ALL_DOCTORS = Object.values(DOCTORS_BY_DEPARTMENT).flat();

function loadQueue(): QueueRowSync[] {
  return getQueueRowsFromStorage();
}

export function DoctorConsultationContent() {
  const [rows, setRows] = useState<QueueRowSync[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  useEffect(() => {
    setRows(loadQueue());
  }, []);

  const myQueue = useMemo(() => {
    if (!selectedDoctor) return [];
    return rows.filter((r) => r.assignedDoctor === selectedDoctor);
  }, [rows, selectedDoctor]);

  const refresh = () => setRows(loadQueue());

  const startConsult = (ticket: string) => {
    updateQueueRowStatusInStorage(ticket, "in progress");
    refresh();
  };

  const completeConsult = (ticket: string) => {
    updateQueueRowStatusInStorage(ticket, "completed");
    refresh();
  };

  const waitingOrCalled = myQueue.filter(
    (r) => r.status.toLowerCase() === "waiting" || r.status.toLowerCase() === "called"
  );
  const inProgress = myQueue.filter((r) => r.status.toLowerCase() === "in progress");
  const completed = myQueue.filter((r) => r.status.toLowerCase() === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Consultation</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          Select yourself to see your queue and manage consultations.
        </p>
      </div>

      <div className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
        <label htmlFor="doctor-select" className="mb-2 block text-sm font-semibold text-[#333333]">
          I am
        </label>
        <select
          id="doctor-select"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="w-full max-w-md rounded-lg border border-[#dee2e6] bg-white px-3 py-2.5 text-[#333333] focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        >
          <option value="">Select doctor...</option>
          {ALL_DOCTORS.map((doc) => (
            <option key={doc} value={doc}>
              {doc}
            </option>
          ))}
        </select>
      </div>

      {!selectedDoctor ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          Select a doctor above to view your consultation queue.
        </div>
      ) : myQueue.length === 0 ? (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-8 text-center text-[#6C757D]">
          No patients in your queue right now.
        </div>
      ) : (
        <div className="rounded-lg border border-[#dee2e6] bg-white shadow-sm">
          <div className="border-b border-[#dee2e6] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-medium text-[#333333]">
                Waiting: <span className="text-[#1e3a5f]">{waitingOrCalled.length}</span>
              </span>
              <span className="font-medium text-[#333333]">
                In progress: <span className="text-[#1e3a5f]">{inProgress.length}</span>
              </span>
              <span className="font-medium text-[#333333]">
                Completed: <span className="text-[#1e3a5f]">{completed.length}</span>
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#dee2e6]">
              <thead className="bg-[#f8f9fa]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#6C757D] sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee2e6] bg-white">
                {myQueue.map((r) => (
                  <tr key={r.ticket} className="hover:bg-[#f8f9fa]">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#333333] sm:px-6">
                      {r.ticket}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{r.department}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-[#333333] sm:px-6">
                      {r.priority}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          r.status.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800"
                            : r.status.toLowerCase() === "in progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      {(r.status.toLowerCase() === "waiting" || r.status.toLowerCase() === "called") && (
                        <button
                          type="button"
                          onClick={() => startConsult(r.ticket)}
                          className="rounded bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2a4a7a]"
                        >
                          Start consult
                        </button>
                      )}
                      {r.status.toLowerCase() === "in progress" && (
                        <button
                          type="button"
                          onClick={() => completeConsult(r.ticket)}
                          className="rounded bg-[#28a745] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#218838]"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
