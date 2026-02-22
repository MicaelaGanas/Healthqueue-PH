"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { ROLE_LABELS, type StaffRole } from "../../../../lib/api/auth";

type PendingNotification = {
  id: string;
  referenceNo: string;
  patientName: string;
  department: string;
  requestedDate: string;
  requestedTime: string;
  createdAt: string;
};

function initials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] || "";
  return local.slice(0, 2).toUpperCase() || "?";
}

export function DoctorHeader() {
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [email, setEmail] = useState<string>("");
  const [initialsStr, setInitialsStr] = useState("??");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<PendingNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) return;
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (cancelled || !res.ok) return;
      const body = await res.json().catch(() => ({}));
      const r = body.role in ROLE_LABELS ? (body.role as StaffRole) : null;
      const em = body.email ?? "";
      setName(body.name ?? null);
      setRole(r);
      setEmail(em);
      setInitialsStr(initials(body.name ?? null, em));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) return;
      setNotificationsLoading(true);
      try {
        const res = await fetch("/api/booking-requests?status=pending", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled || !res.ok) {
          setPendingNotifications([]);
          return;
        }
        const list = await res.json().catch(() => []);
        if (!Array.isArray(list)) {
          setPendingNotifications([]);
          return;
        }
        const mapped: PendingNotification[] = list.map((r: {
          id: string;
          referenceNo: string;
          patientFirstName?: string;
          patientLastName?: string;
          beneficiaryFirstName?: string;
          beneficiaryLastName?: string;
          department: string;
          requestedDate: string;
          requestedTime: string;
          createdAt: string;
        }) => {
          const patientName = r.patientFirstName != null || r.patientLastName != null
            ? [r.patientFirstName, r.patientLastName].filter(Boolean).join(" ").trim() || "—"
            : [r.beneficiaryFirstName, r.beneficiaryLastName].filter(Boolean).join(" ").trim() || "—";
          return {
            id: r.id,
            referenceNo: r.referenceNo ?? "—",
            patientName,
            department: r.department ?? "—",
            requestedDate: r.requestedDate ?? "—",
            requestedTime: r.requestedTime ?? "—",
            createdAt: r.createdAt ?? "",
          };
        });
        setPendingNotifications(mapped);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [notificationsOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [notificationsOpen]);

  const displayName = (name && name.trim()) || email || "Doctor";
  const roleLabel = role ? ROLE_LABELS[role] : "Doctor";
  const pendingCount = pendingNotifications.length;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] bg-white px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight text-[#333333] sm:text-lg">
          Hospital Dashboard
        </h1>
        <p className="mt-0.5 truncate text-xs leading-tight text-[#6C757D] sm:text-sm">
          SPMC General Hospital
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6C757D] transition-colors hover:bg-[#e9ecef] hover:text-[#333333] sm:h-10 sm:w-10"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6v0a6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {pendingCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-[#dee2e6] bg-white py-2 shadow-lg">
              <div className="border-b border-[#e9ecef] px-4 py-2">
                <p className="text-sm font-bold text-[#333333]">Notifications</p>
                <p className="text-xs text-[#6C757D]">Pending booking requests</p>
              </div>
              <div className="max-h-64 overflow-auto">
                {notificationsLoading ? (
                  <p className="px-4 py-3 text-sm text-[#6C757D]">Loading…</p>
                ) : pendingCount === 0 ? (
                  <p className="px-4 py-3 text-sm text-[#6C757D]">No pending requests.</p>
                ) : (
                  <ul className="py-1">
                    {pendingNotifications.slice(0, 10).map((n) => (
                      <li key={n.id} className="border-b border-[#e9ecef] px-4 py-2 last:border-b-0">
                        <p className="text-sm font-medium text-[#333333]">{n.referenceNo}</p>
                        <p className="text-xs text-[#6C757D]">{n.patientName} · {n.department}</p>
                        <p className="text-xs text-[#6C757D]">{n.requestedDate} {n.requestedTime}</p>
                      </li>
                    ))}
                    {pendingCount > 10 && (
                      <li className="px-4 py-2 text-xs text-[#6C757D]">+{pendingCount - 10} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-px shrink-0 bg-[#e9ecef]" aria-hidden />
        <div className="flex items-center gap-3 pl-2 sm:pl-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-sm font-bold text-white">
            {initialsStr}
          </div>
          <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
            <p className="truncate text-sm font-medium leading-tight text-[#333333]">
              {displayName}
            </p>
            <p className="truncate text-xs leading-tight text-[#6C757D]">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
