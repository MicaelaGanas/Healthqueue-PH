"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type QueueStatusQRCodeProps = {
  /** Reference number (ticket) to encode — nurse scans this to look up live status */
  referenceNo: string;
  /** Optional size in pixels for the QR image */
  size?: number;
  /** Show "Save as PNG" button */
  showDownload?: boolean;
  className?: string;
};

export function QueueStatusQRCode({
  referenceNo,
  size = 200,
  showDownload = true,
  className = "",
}: QueueStatusQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceNo?.trim()) {
      setDataUrl(null);
      return;
    }
    setError(null);
    QRCode.toDataURL(referenceNo.trim(), {
      width: size,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to generate QR"));
  }, [referenceNo, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `HealthQueue-${referenceNo.trim()}.png`;
    a.click();
  };

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 ${className}`}>
        Could not generate QR: {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`} style={{ width: size, height: size }}>
        <span className="text-sm text-gray-500">Loading QR…</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="rounded-xl bg-white p-2.5 shadow-md ring-1 ring-slate-200/60">
        <img
          src={dataUrl}
          alt={`QR code for queue reference ${referenceNo}`}
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
        >
          Save as PNG
        </button>
      )}
    </div>
  );
}
