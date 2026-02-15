"use client";

import { useState } from "react";

const INITIAL_ALERTS = [
  {
    id: "1",
    type: "Missed Patient",
    icon: "person-x",
    detail: "Carlos Mendoza (TRG-002) did not respond to queue call. 3 attempts made.",
    time: "2 mins ago",
    unread: true,
  },
  {
    id: "2",
    type: "Gadget Disconnected",
    icon: "wifi-off",
    detail: "GDG-004 has gone offline. Last connected patient: Pedro Garcia.",
    time: "5 mins ago",
    unread: true,
  },
  {
    id: "3",
    type: "Reassessment Due",
    icon: "clock",
    detail: "Maria Santos (TRG-001) needs vital signs reassessment. Last check: 30 mins ago.",
    time: "8 mins ago",
    unread: true,
  },
];

export function AlertsNotifications() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const markRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, unread: false } : a)));
  };
  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })));
  };

  const newCount = alerts.filter((a) => a.unread).length;

  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#007bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6v0a6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="text-lg font-bold text-[#333333]">Alerts & Notifications</h2>
        </div>
        {newCount > 0 && (
          <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            {newCount} New
          </span>
        )}
      </div>
      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`flex items-start gap-4 rounded-lg border p-4 ${a.unread ? "border-[#007bff]/30 bg-blue-50/50" : "border-[#e9ecef] bg-[#f8f9fa]"}`}
          >
            <div className="shrink-0">
              {a.icon === "person-x" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {a.icon === "wifi-off" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                </div>
              )}
              {a.icon === "clock" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#333333]">{a.type}</p>
              <p className="mt-0.5 text-sm text-[#6C757D]">{a.detail}</p>
              <p className="mt-1 text-xs text-[#6C757D]">{a.time}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => markRead(a.id)}
                className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-[#007bff]"
                title="Mark as read"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => dismiss(a.id)}
                className="rounded p-1.5 text-[#6C757D] hover:bg-[#e9ecef] hover:text-red-600"
                title="Dismiss"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#e9ecef] pt-4">
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-medium text-[#007bff] hover:underline"
        >
          Mark All as Read
        </button>
        <button type="button" className="text-sm font-medium text-[#007bff] hover:underline">
          View All Alerts
        </button>
      </div>
    </div>
  );
}
