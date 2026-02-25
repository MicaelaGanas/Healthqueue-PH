"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";

type PatientDetails = {
  ticket: string;
  patientName: string;
  age: number | null;
  gender: string | null;
  vitals: {
    systolic: number | null;
    diastolic: number | null;
    heartRate: number | null;
    temperature: number | null;
    weight: number | null;
    height: number | null;
    recordedAt: string | null;
    recordedBy: string | null;
  } | null;
};

type PatientModalProps = {
  open: boolean;
  ticket: string | null;
  patientName?: string | null;
  onClose: () => void;
};

export function PatientModal({ open, ticket, patientName, onClose }: PatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<PatientDetails | null>(null);
  const activeTicketRef = useRef<string | null>(null);

  const formatValue = useCallback((value: number | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return "Not recorded";
    return unit ? `${value} ${unit}` : String(value);
  }, []);

  useEffect(() => {
    if (!open || !ticket) {
      activeTicketRef.current = null;
      setLoading(false);
      setError("");
      setDetails(null);
      return;
    }

    activeTicketRef.current = ticket;
    setLoading(true);
    setError("");
    setDetails({
      ticket,
      patientName: patientName || "Unknown",
      age: null,
      gender: null,
      vitals: null,
    });

    const fetchDetails = async () => {
      const supabase = createSupabaseBrowser();
      if (!supabase) {
        if (activeTicketRef.current === ticket) {
          setError("Not signed in.");
          setLoading(false);
        }
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (activeTicketRef.current === ticket) {
          setError("Not signed in.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/queue-rows/details?ticket=${encodeURIComponent(ticket)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (activeTicketRef.current === ticket) {
            setError(data.error || "Failed to load patient details.");
            setLoading(false);
          }
          return;
        }
        if (activeTicketRef.current !== ticket) return;
        setDetails({
          ticket: data.ticket ?? ticket,
          patientName: data.patientName ?? patientName ?? "Unknown",
          age: typeof data.age === "number" ? data.age : null,
          gender: typeof data.gender === "string" ? data.gender : null,
          vitals: data.vitals ?? null,
        });
      } catch {
        if (activeTicketRef.current === ticket) {
          setError("Failed to load patient details.");
        }
      } finally {
        if (activeTicketRef.current === ticket) {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [open, ticket, patientName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-[#dee2e6] px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[#333333]">Patient details</h3>
            <p className="mt-0.5 text-xs text-[#6C757D]">Ticket {details?.ticket ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#dee2e6] bg-white px-3 py-1 text-xs font-medium text-[#333333] hover:bg-[#f8f9fa]"
          >
            Close
          </button>
        </div>
        <div className="space-y-5 px-5 py-4">
          {loading ? (
            <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-4 text-center text-sm text-[#6C757D]">
              Loading patient details...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-[#1e3a5f]">Basic information</h4>
                <dl className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[#6C757D]">Name</dt>
                    <dd className="font-medium text-[#333333]">{details?.patientName ?? "Unknown"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6C757D]">Age</dt>
                    <dd className="font-medium text-[#333333]">
                      {details?.age === null || details?.age === undefined ? "Not specified" : details.age}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6C757D]">Gender</dt>
                    <dd className="font-medium text-[#333333]">{details?.gender || "Not specified"}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1e3a5f]">Vital signs</h4>
                {details?.vitals ? (
                  <dl className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[#6C757D]">Blood pressure</dt>
                      <dd className="font-medium text-[#333333]">
                        {details.vitals.systolic !== null && details.vitals.diastolic !== null
                          ? `${details.vitals.systolic}/${details.vitals.diastolic} mmHg`
                          : "Not recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#6C757D]">Heart rate</dt>
                      <dd className="font-medium text-[#333333]">
                        {formatValue(details.vitals.heartRate, "bpm")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#6C757D]">Temperature</dt>
                      <dd className="font-medium text-[#333333]">
                        {formatValue(details.vitals.temperature, "C")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#6C757D]">Weight</dt>
                      <dd className="font-medium text-[#333333]">
                        {formatValue(details.vitals.weight, "kg")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#6C757D]">Height</dt>
                      <dd className="font-medium text-[#333333]">
                        {formatValue(details.vitals.height, "cm")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#6C757D]">Recorded</dt>
                      <dd className="font-medium text-[#333333]">
                        {details.vitals.recordedAt ? new Date(details.vitals.recordedAt).toLocaleString("en-PH") : "Not recorded"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-[#6C757D]">No vitals recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
