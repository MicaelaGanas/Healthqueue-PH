"use client";

import { useState, useEffect } from "react";
import type { AdminTabId } from "../layout/AdminNav";
import { AdminSectionHeader } from "../layout/AdminSectionHeader";

const STORAGE_KEY = "healthqueue-admin-settings";

type AdminSettings = {
  timeFormat12h: boolean;
  notifyNewUser: boolean;
  notifyQueueAlert: boolean;
  defaultReportsRange: "week" | "month" | "quarter";
};

const defaultSettings: AdminSettings = {
  timeFormat12h: true,
  notifyNewUser: true,
  notifyQueueAlert: true,
  defaultReportsRange: "week",
};

function loadSettings(): AdminSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

type AdminSettingsContentProps = {
  onNavigateToTab?: (tab: AdminTabId) => void;
};

export function AdminSettingsContent({ onNavigateToTab }: AdminSettingsContentProps) {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = (patch: Partial<AdminSettings>) => {
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
      <AdminSectionHeader
        title="Settings"
        description="Configure general options, notifications, and display for the admin dashboard."
      />

      <div className="rounded-lg border border-[#dee2e6] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-[#333333]">General</h3>
        <p className="mt-0.5 text-sm text-[#6C757D]">Display and default options.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#495057]">Time format</label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="adminTimeFormat"
                  checked={settings.timeFormat12h}
                  onChange={() => update({ timeFormat12h: true })}
                  className="border-[#ced4da] text-[#007bff] focus:ring-[#007bff]/20"
                />
                <span className="text-sm text-[#333333]">12-hour (e.g. 2:30 PM)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="adminTimeFormat"
                  checked={!settings.timeFormat12h}
                  onChange={() => update({ timeFormat12h: false })}
                  className="border-[#ced4da] text-[#007bff] focus:ring-[#007bff]/20"
                />
                <span className="text-sm text-[#333333]">24-hour (e.g. 14:30)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#495057]">Default reports date range</label>
            <select
              value={settings.defaultReportsRange}
              onChange={(e) => update({ defaultReportsRange: e.target.value as AdminSettings["defaultReportsRange"] })}
              className="rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-sm text-[#333333] focus:border-[#007bff] focus:outline-none focus:ring-2 focus:ring-[#007bff]/20"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#dee2e6] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-[#333333]">Notifications</h3>
        <p className="mt-0.5 text-sm text-[#6C757D]">Choose when to see admin alerts and reminders.</p>
        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#333333]">Notify when a new user is registered</span>
            <input
              type="checkbox"
              checked={settings.notifyNewUser}
              onChange={(e) => update({ notifyNewUser: e.target.checked })}
              className="h-4 w-4 rounded border-[#ced4da] text-[#007bff] focus:ring-[#007bff]/20"
            />
          </label>
          <p className="text-xs text-[#6C757D]">Show a reminder in the dashboard when someone signs up (e.g. in Overview or Users).</p>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#333333]">Notify on queue / capacity alerts</span>
            <input
              type="checkbox"
              checked={settings.notifyQueueAlert}
              onChange={(e) => update({ notifyQueueAlert: e.target.checked })}
              className="h-4 w-4 rounded border-[#ced4da] text-[#007bff] focus:ring-[#007bff]/20"
            />
          </label>
          <p className="text-xs text-[#6C757D]">When queue length or capacity crosses a threshold, show an alert.</p>
        </div>
      </div>

      {onNavigateToTab && (
        <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-[#333333]">Quick links</h3>
          <p className="mt-0.5 text-sm text-[#6C757D]">Department booking and schedule configuration.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onNavigateToTab("schedule")}
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a]"
            >
              Open Schedule
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a]"
        >
          Save settings
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600">Saved.</span>
        )}
      </div>
    </div>
  );
}
