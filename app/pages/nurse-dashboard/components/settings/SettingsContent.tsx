"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "healthqueue-staff-settings";

type StaffSettings = {
  notifyOnConfirm: boolean;
  notifyOnNewBooking: boolean;
  timeFormat12h: boolean;
  defaultBookingFilter: "today" | "week" | "all";
  facilityName: string;
};

const defaultSettings: StaffSettings = {
  notifyOnConfirm: true,
  notifyOnNewBooking: true,
  timeFormat12h: true,
  defaultBookingFilter: "today",
  facilityName: "",
};

function loadSettings(): StaffSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<StaffSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: StaffSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function SettingsContent() {
  const [settings, setSettings] = useState<StaffSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = (patch: Partial<StaffSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Settings</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          Configure notifications, display, and default options for the staff dashboard.
        </p>
      </div>

      <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
        <div className="border-b border-[#e9ecef] px-4 py-3">
          <h3 className="text-base font-bold text-[#333333]">Notifications</h3>
          <p className="text-sm text-[#6C757D]">Choose when to see in-app notifications or reminders.</p>
        </div>
        <div className="space-y-4 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#333333]">Notify when a booking is confirmed</span>
            <input
              type="checkbox"
              checked={settings.notifyOnConfirm}
              onChange={(e) => update({ notifyOnConfirm: e.target.checked })}
              className="h-4 w-4 rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]"
            />
          </label>
          <p className="text-xs text-[#6C757D]">Show the &quot;Go to Vitals & Triage&quot; message after confirming a booking in Manage bookings.</p>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#333333]">Notify on new booking request</span>
            <input
              type="checkbox"
              checked={settings.notifyOnNewBooking}
              onChange={(e) => update({ notifyOnNewBooking: e.target.checked })}
              className="h-4 w-4 rounded border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]"
            />
          </label>
          <p className="text-xs text-[#6C757D]">When a patient books online, show a reminder in the dashboard (e.g. Alerts).</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
        <div className="border-b border-[#e9ecef] px-4 py-3">
          <h3 className="text-base font-bold text-[#333333]">Display</h3>
          <p className="text-sm text-[#6C757D]">Time format and default filters.</p>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#333333]">Time format</label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="timeFormat"
                  checked={settings.timeFormat12h}
                  onChange={() => update({ timeFormat12h: true })}
                  className="border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]"
                />
                <span className="text-sm text-[#333333]">12-hour (e.g. 2:30 PM)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="timeFormat"
                  checked={!settings.timeFormat12h}
                  onChange={() => update({ timeFormat12h: false })}
                  className="border-[#dee2e6] text-[#007bff] focus:ring-[#007bff]"
                />
                <span className="text-sm text-[#333333]">24-hour (e.g. 14:30)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#333333]">Default date filter (Manage bookings)</label>
            <select
              value={settings.defaultBookingFilter}
              onChange={(e) => update({ defaultBookingFilter: e.target.value as StaffSettings["defaultBookingFilter"] })}
              className="rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="all">All dates</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#e9ecef] bg-white shadow-sm">
        <div className="border-b border-[#e9ecef] px-4 py-3">
          <h3 className="text-base font-bold text-[#333333]">Facility</h3>
          <p className="text-sm text-[#6C757D]">Optional name for reports and headers.</p>
        </div>
        <div className="p-4">
          <label className="mb-2 block text-sm font-medium text-[#333333]">Facility / clinic name</label>
          <input
            type="text"
            value={settings.facilityName}
            onChange={(e) => update({ facilityName: e.target.value })}
            placeholder="e.g. Main Health Center"
            className="w-full max-w-md rounded-lg border border-[#dee2e6] px-3 py-2 text-sm text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
        >
          Save settings
        </button>
        {saved && (
          <span className="text-sm font-medium text-green-600">Saved.</span>
        )}
      </div>
    </div>
  );
}
