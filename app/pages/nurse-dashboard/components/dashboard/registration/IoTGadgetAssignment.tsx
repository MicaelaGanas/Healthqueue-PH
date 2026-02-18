"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Gadget = {
  id: string;
  status: "Online" | "Offline";
  assignedTo: string;
  battery: string;
};

const INITIAL_GADGETS: Gadget[] = [
  { id: "GDG-001", status: "Online", assignedTo: "Maria Santos", battery: "85%" },
  { id: "GDG-002", status: "Online", assignedTo: "Juan Dela Cruz", battery: "72%" },
  { id: "GDG-003", status: "Online", assignedTo: "—", battery: "100%" },
  { id: "GDG-004", status: "Offline", assignedTo: "—", battery: "19%" },
];

type DetectedCode = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: ImageBitmap | HTMLVideoElement | HTMLCanvasElement) => Promise<DetectedCode[]>;
};

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const detectorClass = (window as Window & { BarcodeDetector?: new (opts?: unknown) => BarcodeDetectorLike })
    .BarcodeDetector;
  if (!detectorClass) return null;
  return new detectorClass({ formats: ["qr_code"] });
}

function normalizeId(value: string) {
  return value.trim().toUpperCase();
}

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
  const [gadgets, setGadgets] = useState<Gadget[]>(INITIAL_GADGETS);
  const [lookupId, setLookupId] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const availableCount = useMemo(
    () => gadgets.filter((g) => g.assignedTo === "—" && g.status === "Online").length,
    [gadgets]
  );
  const inUseCount = useMemo(
    () => gadgets.filter((g) => g.assignedTo !== "—" && g.status === "Online").length,
    [gadgets]
  );
  const offlineCount = useMemo(() => gadgets.filter((g) => g.status === "Offline").length, [gadgets]);

  const stopCameraScan = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
    setIsDecoding(false);
  };

  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

  const runLookup = (candidate: string) => {
    const normalized = normalizeId(candidate);
    if (!normalized) {
      setLookupMessage("Enter or scan a gadget ID first.");
      return;
    }
    const found = gadgets.find((g) => normalizeId(g.id) === normalized);
    if (!found) {
      setLookupMessage(`No gadget found for "${normalized}".`);
      return;
    }
    setLookupId(found.id);
    setLookupMessage(`Found ${found.id} (${found.status}) assigned to ${found.assignedTo}.`);
  };

  const tryDecodeFromVideo = async () => {
    const detector = getBarcodeDetector();
    const video = videoRef.current;
    if (!detector || !video || video.readyState < 2) return;

    try {
      const codes = await detector.detect(video);
      const value = codes[0]?.rawValue?.trim();
      if (!value) return;
      const scanned = normalizeId(value);
      setLookupId(scanned);
      setScanMessage(`Scanned QR: ${scanned}`);
      runLookup(scanned);
      stopCameraScan();
    } catch {
      // Ignore intermittent decode errors while scanning frames.
    }
  };

  const startCameraScan = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsCameraSupported(false);
      setScanMessage("Camera scanning is not supported in this browser.");
      return;
    }
    const detector = getBarcodeDetector();
    if (!detector) {
      setScanMessage("QR decoding is not available in this browser. Use image upload or manual ID.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerActive(true);
      setScanMessage("Scanner started. Point camera at a gadget QR code.");
      scanTimerRef.current = window.setInterval(() => {
        if (isDecoding) return;
        setIsDecoding(true);
        void tryDecodeFromVideo().finally(() => setIsDecoding(false));
      }, 700);
    } catch {
      setScanMessage("Unable to access camera. Check browser permissions and try again.");
    }
  };

  const decodeImageFile = async (file: File) => {
    const detector = getBarcodeDetector();
    if (!detector) {
      setScanMessage("QR decoding from image is not available in this browser.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const value = codes[0]?.rawValue?.trim();
      if (!value) {
        setScanMessage("No QR code was detected in the selected image.");
        return;
      }
      const scanned = normalizeId(value);
      setLookupId(scanned);
      setScanMessage(`Scanned from image: ${scanned}`);
      runLookup(scanned);
    } catch {
      setScanMessage("Could not decode the selected image.");
    }
  };

  const toggleAssignment = (gadget: Gadget) => {
    setGadgets((current) =>
      current.map((g) =>
        g.id === gadget.id
          ? { ...g, assignedTo: g.assignedTo === "—" ? "Walk-in Patient" : "—" }
          : g
      )
    );
  };

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <GadgetIcon className="h-5 w-5 text-[#007bff]" />
        <h2 className="text-lg font-bold text-[#333333]">IoT Gadget Assignment</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
          <span className="block text-xl font-bold text-green-800">{availableCount}</span>
          <p className="text-sm text-green-700">Available</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
          <span className="block text-xl font-bold text-blue-800">{inUseCount}</span>
          <p className="text-sm text-blue-700">In Use</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center">
          <span className="block text-xl font-bold text-gray-700">{offlineCount}</span>
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
          onClick={() => runLookup(lookupId)}
          className="shrink-0 rounded-lg bg-[#007bff] px-5 py-2.5 font-medium text-white hover:bg-[#0069d9]"
        >
          Lookup
        </button>
      </div>

      <div className="mb-4 space-y-3 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void startCameraScan()}
            disabled={scannerActive}
            className="rounded-lg border border-[#007bff] bg-white px-3 py-2 text-sm font-medium text-[#007bff] hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start camera scan
          </button>
          <button
            type="button"
            onClick={stopCameraScan}
            disabled={!scannerActive}
            className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#e9ecef] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Stop scan
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#e9ecef]"
          >
            Upload QR image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void decodeImageFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full rounded-lg border border-[#dee2e6] bg-black ${scannerActive ? "block" : "hidden"}`}
        />
        {!isCameraSupported && (
          <p className="text-xs text-[#DC3545]">Camera scanning is unavailable on this browser/device.</p>
        )}
        {scanMessage && <p className="text-xs text-[#6C757D]">{scanMessage}</p>}
        {lookupMessage && <p className="text-xs font-medium text-[#333333]">{lookupMessage}</p>}
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
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      g.status === "Online"
                        ? "border border-blue-200 bg-blue-50 text-blue-800"
                        : "border border-gray-200 bg-gray-100 text-gray-700"
                    }`}
                  >
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
                      onClick={() => toggleAssignment(g)}
                      className="inline-flex items-center gap-1.5 text-[#007bff] hover:underline"
                    >
                      <AssignLinkIcon className="h-4 w-4" />
                      Assign
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleAssignment(g)}
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
