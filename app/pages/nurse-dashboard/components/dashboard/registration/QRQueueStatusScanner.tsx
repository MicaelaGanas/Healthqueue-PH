"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type QueueStatusResult = {
  queueNumber: string;
  assignedDepartment: string;
  estimatedWaitTime: string;
  status: string;
  patientName?: string | null;
  age?: number | null;
  sex?: string | null;
  phone?: string | null;
  email?: string | null;
  priority?: string;
  source?: string;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  assignedDoctor?: string | null;
  addedAt?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed — check in when you arrive",
  awaiting_triage: "Awaiting triage",
  waiting: "Waiting",
  scheduled: "Scheduled",
  called: "Called",
  almost: "Almost turn",
  proceed: "With doctor",
  "in progress": "With doctor",
  in_consultation: "With doctor",
  completed: "Done",
  cancelled: "Cancelled",
  no_show: "No show",
};

/** Upload + decode QR from image file. Works on any origin (no camera/HTTPS needed). */
async function decodeQRFromFile(file: File): Promise<string> {
  const { Html5Qrcode } = await import("html5-qrcode");
  const id = "qr-file-decode-" + Date.now();
  const div = document.createElement("div");
  div.id = id;
  div.style.position = "absolute";
  div.style.left = "-9999px";
  div.style.width = "1px";
  div.style.height = "1px";
  document.body.appendChild(div);
  try {
    const scanner = new Html5Qrcode(id);
    const text = await scanner.scanFile(file, false);
    return String(text ?? "").trim();
  } finally {
    document.body.removeChild(div);
  }
}

export function QRQueueStatusScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const capturedRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [result, setResult] = useState<QueueStatusResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const fetchStatus = useCallback(async (referenceNo: string) => {
    const trimmed = referenceNo.trim();
    if (!trimmed) return;
    setLoading(true);
    setLookupError(null);
    setResult(null);
    setLastScanned(trimmed);
    try {
      const res = await fetch(`/api/queue/status/${encodeURIComponent(trimmed)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLookupError(data?.error || "Failed to load status");
        setLoading(false);
        return;
      }
      if (data == null) {
        setLookupError("No appointment or queue found for this reference number.");
        setLoading(false);
        return;
      }
      setResult({
        queueNumber: data.queueNumber ?? trimmed,
        assignedDepartment: data.assignedDepartment ?? data.department ?? "—",
        estimatedWaitTime: data.estimatedWaitTime ?? data.waitTime ?? "—",
        status: data.status ?? "—",
        patientName: data.patientName ?? null,
        age: data.age ?? null,
        sex: data.sex ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        priority: data.priority ?? null,
        source: data.source ?? null,
        appointmentDate: data.appointmentDate ?? null,
        appointmentTime: data.appointmentTime ?? null,
        assignedDoctor: data.assignedDoctor ?? null,
        addedAt: data.addedAt ?? null,
      });
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (typeof window === "undefined" || !scannerRef.current) return;
    setError(null);
    setResult(null);
    setLookupError(null);
    setUploadError(null);
    capturedRef.current = false;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const elementId = "qr-reader-nurse-" + Date.now();
      scannerRef.current.innerHTML = "";
      const div = document.createElement("div");
      div.id = elementId;
      scannerRef.current.appendChild(div);

      const html5Qr = new Html5Qrcode(elementId);
      html5QrRef.current = html5Qr;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const onScan = (decodedText: string) => {
        const ref = decodedText.trim();
        if (!ref || capturedRef.current) return;
        capturedRef.current = true;
        // Capture once: stop camera then fetch status (stops repeated scans of same QR).
        const scanner = html5QrRef.current;
        html5QrRef.current = null;
        if (scannerRef.current) scannerRef.current.innerHTML = "";
        setScanning(false);
        scanner?.stop().catch(() => {});
        fetchStatus(ref);
      };
      const onError = () => {};

      // Library accepts facingMode as string or { exact: "environment" }. Try back camera first, then front (desktop).
      try {
        await html5Qr.start({ facingMode: "environment" }, config, onScan, onError);
      } catch {
        await html5Qr.start({ facingMode: "user" }, config, onScan, onError);
      }
      setScanning(true);
    } catch (e) {
      if (scannerRef.current) scannerRef.current.innerHTML = "";
      const msg =
        e instanceof Error
          ? e.message
          : typeof (e as { message?: string })?.message === "string"
            ? (e as { message: string }).message
            : String(e);
      const hint =
        typeof window !== "undefined" && window.isSecureContext === false
          ? " To use the camera, open this app at http://localhost:3000 in the address bar (same computer). It does not work on http://192.168.x.x or other HTTP URLs. Or use Upload QR image / reference below."
          : /denied|permission|not allowed/i.test(msg)
            ? " Allow camera in browser settings, or use Upload QR image / reference below."
            : /not found|no device|notreadable/i.test(msg)
              ? " Try Upload QR image or enter reference below."
              : "";
      setError((msg + hint).trim() || "Could not start camera. Use Upload QR image or reference below.");
    }
  }, [fetchStatus]);

  const stopScanner = useCallback(async () => {
    capturedRef.current = true;
    if (html5QrRef.current) {
      await html5QrRef.current.stop();
      html5QrRef.current = null;
    }
    if (scannerRef.current) scannerRef.current.innerHTML = "";
    setScanning(false);
  }, []);

  const tryAgain = useCallback(() => {
    setResult(null);
    setLookupError(null);
    setUploadError(null);
    setLastScanned(null);
    setError(null);
    setSummaryOpen(false);
    capturedRef.current = false;
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      setUploadError(null);
      if (!file || !file.type.startsWith("image/")) {
        setUploadError("Please choose an image file (e.g. PNG, JPG).");
        return;
      }
      try {
        const ref = await decodeQRFromFile(file);
        if (ref) fetchStatus(ref);
        else setUploadError("No QR code found in the image.");
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Could not read QR code from image.");
      }
    },
    [fetchStatus]
  );

  useEffect(() => {
    return () => {
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#333333]">Scan patient QR — live queue status</h2>
      <p className="mt-1 text-sm text-[#6C757D]">
        Point the camera at the patient&apos;s QR for instant lookup. <strong>Camera works only at http://localhost:3000</strong> (type that in the address bar on this computer) or over HTTPS. Otherwise use Upload QR image or reference below.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!scanning ? (
          <button
            type="button"
            onClick={startScanner}
            className="inline-flex items-center gap-2 rounded-lg bg-[#007bff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0069d9]"
          >
            <CameraIcon className="h-5 w-5" />
            Start camera scan
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScanner}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Stop camera
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload QR image"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#dee2e6] bg-white px-4 py-2.5 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
        >
          <UploadIcon className="h-5 w-5" />
          Upload QR image
        </button>
        {result && (
          <button
            type="button"
            onClick={tryAgain}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dee2e6] bg-white px-4 py-2.5 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
          >
            Scan another
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {uploadError && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {uploadError}
        </div>
      )}

      {/* Scanner area: only show when camera is running (no black box when idle) */}
      <div
        ref={scannerRef}
        className={`overflow-hidden rounded-lg border border-[#dee2e6] ${scanning ? "mt-4 min-h-[200px] bg-black" : "mt-0 h-0 min-h-0 border-0"}`}
      />

      {scanning && (
        <p className="mt-2 text-xs text-[#6C757D]">Point at the patient&apos;s QR code. Status will load automatically.</p>
      )}

      <div className="mt-4 border-t border-[#e9ecef] pt-4">
        <label htmlFor="manual-ref" className="block text-sm font-medium text-[#333333]">
          Or enter reference number
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="manual-ref"
            type="text"
            placeholder="e.g. APT-20260224-MUI"
            className="flex-1 rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value?.trim();
                if (v) fetchStatus(v);
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById("manual-ref") as HTMLInputElement | null;
              if (input?.value?.trim()) fetchStatus(input.value.trim());
            }}
            className="rounded-lg bg-[#6c757d] px-4 py-2 text-sm font-medium text-white hover:bg-[#5a6268]"
          >
            Look up
          </button>
        </div>
      </div>

      {(loading || result || lookupError) && (
        <div className="mt-4 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] p-4">
          {loading && <p className="text-sm text-[#6C757D]">Loading status…</p>}
          {lookupError && !result && (
            <div>
              <p className="text-sm text-red-700">{lookupError}</p>
              <button
                type="button"
                onClick={tryAgain}
                className="mt-2 text-sm font-medium text-[#007bff] hover:underline"
              >
                Try again
              </button>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Captured</p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-[#333333]">Queue / reference: {result.queueNumber}</p>
                    <p><span className="text-[#6C757D]">Department:</span> {result.assignedDepartment}</p>
                    <p><span className="text-[#6C757D]">Status:</span> <span className="font-medium">{STATUS_LABELS[result.status] ?? result.status}</span></p>
                    {result.estimatedWaitTime && result.estimatedWaitTime !== "—" && (
                      <p><span className="text-[#6C757D]">Est. wait:</span> {result.estimatedWaitTime}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSummaryOpen(true)}
                  className="shrink-0 rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f8f9fa]"
                >
                  Full details
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {summaryOpen && result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-title"
          onClick={() => setSummaryOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-[#e9ecef] bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e9ecef] pb-3">
              <h3 id="summary-title" className="text-lg font-bold text-[#333333]">Patient queue summary</h3>
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="rounded-lg p-1 text-[#6C757D] hover:bg-[#f8f9fa] hover:text-[#333333]"
                aria-label="Close"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Queue / reference</dt>
                <dd className="mt-0.5 font-semibold text-[#333333]">{result.queueNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Patient name</dt>
                <dd className="mt-0.5 font-medium text-[#333333]">{result.patientName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Department</dt>
                <dd className="mt-0.5 text-[#333333]">{result.assignedDepartment}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Age / Sex</dt>
                <dd className="mt-0.5 text-[#333333]">
                  {result.age !== null && result.age !== undefined ? result.age : "—"} / {result.sex || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Phone</dt>
                <dd className="mt-0.5 text-[#333333]">{result.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Email</dt>
                <dd className="mt-0.5 text-[#333333]">{result.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Type</dt>
                <dd className="mt-0.5 text-[#333333]">
                  {result.source === "booked" ? "Reserved" : result.source === "walk-in" ? "Walk-in" : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Priority</dt>
                <dd className="mt-0.5 text-[#333333]">{result.priority || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Status</dt>
                <dd className="mt-0.5 font-medium text-[#333333]">{STATUS_LABELS[result.status] ?? result.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Appointment date</dt>
                <dd className="mt-0.5 text-[#333333]">
                  {result.appointmentDate
                    ? new Date(result.appointmentDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Appointment time</dt>
                <dd className="mt-0.5 text-[#333333]">
                  {result.appointmentTime
                    ? new Date(`2000-01-01T${result.appointmentTime}`).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Assigned doctor</dt>
                <dd className="mt-0.5 text-[#333333]">{result.assignedDoctor || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Estimated wait time</dt>
                <dd className="mt-0.5 text-[#333333]">{result.estimatedWaitTime && result.estimatedWaitTime !== "—" ? result.estimatedWaitTime : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">Added at</dt>
                <dd className="mt-0.5 text-[#333333]">
                  {result.addedAt
                    ? new Date(result.addedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
