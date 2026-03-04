import React from "react";

function DevicesAvailableIcon() {
  return (
    <svg
      className="h-8 w-8 text-emerald-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  );
}

function DevicesInUseIcon() {
  return (
    <svg
      className="h-8 w-8 text-sky-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4V8z" />
    </svg>
  );
}

function DevicesOfflineIcon() {
  return (
    <svg
      className="h-8 w-8 text-rose-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </svg>
  );
}

export function DeviceStatusPanels() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="flex items-center gap-4 rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
        <DevicesAvailableIcon />
        <div>
          <h3 className="text-3xl font-semibold text-[#333333] sm:text-3xl">3</h3>
          <p className="text-sm text-[#6C757D] sm:text-sm">Devices available</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
        <DevicesInUseIcon />
        <div>
          <h3 className="text-3xl font-semibold text-[#333333] sm:text-3xl">3</h3>
          <p className="text-sm text-[#6C757D] sm:text-sm">Devices In use</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm">
        <DevicesOfflineIcon />
        <div>
          <h3 className="text-3xl font-semibold text-[#333333] sm:text-3xl">3</h3>
          <p className="text-sm text-[#6C757D] sm:text-sm">Devices offline</p>
        </div>
      </div>
    </div>
  );
}