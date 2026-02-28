"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { ROLE_LABELS, type StaffRole } from "../../../../lib/api/auth";
import { ProfileAvatar } from "../../../../components/ProfileAvatar";
import { StaffProfileModal } from "../../../../components/StaffProfileModal";

type AdminNotificationItem = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

type AdminOverviewSnapshot = {
  pendingBookingsCount: number;
  pendingWalkInsCount: number;
  liveQueueByDepartment: Array<{
    department: string;
    inQueue: number;
    avgWaitMins: number;
    status: "Normal" | "Delayed" | "Critical";
  }>;
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export function AdminHeader() {
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUpdatedAt, setAvatarUpdatedAt] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) return;
      const res = await fetch("/api/staff-profile", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (cancelled || !res.ok) return;
      const body = await res.json().catch(() => ({}));
      const r = body.role in ROLE_LABELS ? (body.role as StaffRole) : null;
      setName(body.name ?? null);
      setRole(r);
      setEmail(body.email ?? "");
      setFirstName(body.first_name ?? "");
      setLastName(body.last_name ?? "");
      setAvatarUrl(body.avatar_url ?? null);
      setAvatarUpdatedAt(Date.now());
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setNotificationsLoading(false);
      return;
    }
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token || cancelled) {
          setNotificationsLoading(false);
          return;
        }
        const res = await fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok || cancelled) {
          setNotificationsLoading(false);
          return;
        }
        const data = (await res.json().catch(() => ({}))) as Partial<AdminOverviewSnapshot>;
        const pendingBookingsCount = Number(data.pendingBookingsCount ?? 0);
        const pendingWalkInsCount = Number(data.pendingWalkInsCount ?? 0);
        const liveQueueByDepartment = Array.isArray(data.liveQueueByDepartment) ? data.liveQueueByDepartment : [];

        const nowIso = new Date().toISOString();
        const nextNotifications: AdminNotificationItem[] = [];

        if (pendingBookingsCount > 0) {
          nextNotifications.push({
            id: "pending-bookings",
            title: "Pending booking requests",
            description: `${pendingBookingsCount} request${pendingBookingsCount === 1 ? "" : "s"} waiting for confirmation.`,
            created_at: nowIso,
          });
        }

        if (pendingWalkInsCount > 0) {
          nextNotifications.push({
            id: "pending-walkins",
            title: "Pending walk-ins",
            description: `${pendingWalkInsCount} walk-in${pendingWalkInsCount === 1 ? "" : "s"} not yet added to queue.`,
            created_at: nowIso,
          });
        }

        const criticalDepartments = liveQueueByDepartment.filter((d) => d.status === "Critical");
        if (criticalDepartments.length > 0) {
          nextNotifications.push({
            id: "critical-queue",
            title: "Critical queue status",
            description: `${criticalDepartments.length} department${criticalDepartments.length === 1 ? "" : "s"} currently critical.`,
            created_at: nowIso,
          });
        }

        const delayedDepartments = liveQueueByDepartment.filter((d) => d.status === "Delayed");
        if (criticalDepartments.length === 0 && delayedDepartments.length > 0) {
          nextNotifications.push({
            id: "delayed-queue",
            title: "Delayed queue status",
            description: `${delayedDepartments.length} department${delayedDepartments.length === 1 ? "" : "s"} currently delayed.`,
            created_at: nowIso,
          });
        }

        setNotifications(nextNotifications);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = (name && name.trim()) || email || "Admin";
  const roleLabel = role ? ROLE_LABELS[role] : "Administrator";
  const notificationCount = notifications.length;

  const formatNotificationDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-end border-b border-[#dee2e6] bg-white px-4 sm:px-6">
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative rounded-lg p-2 text-[#495057] hover:bg-[#f8f9fa] hover:text-[#1e3a5f]"
            aria-label="Toggle notifications"
          >
            <BellIcon className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#dc3545] px-1 text-[10px] font-semibold leading-none text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-lg">
              <div className="border-b border-[#e9ecef] px-4 py-3">
                <p className="text-sm font-semibold text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
                  Admin Alerts
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading ? (
                  <p className="px-4 py-4 text-sm text-[#6C757D]">Loading notifications...</p>
                ) : notificationCount === 0 ? (
                  <p className="px-4 py-4 text-sm text-[#6C757D]">No notifications yet.</p>
                ) : (
                  <ul className="divide-y divide-[#f1f3f5]">
                    {notifications.map((item) => (
                      <li key={item.id} className="px-4 py-3">
                        <p className="line-clamp-1 text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#6C757D]">{item.description}</p>
                        <p className="mt-1 text-[11px] text-[#adb5bd]">{formatNotificationDate(item.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px shrink-0 bg-[#e9ecef]" aria-hidden />
        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center gap-3 pl-2 sm:pl-3 rounded-lg hover:bg-[#f8f9fa] transition-colors cursor-pointer"
          aria-label="Open profile"
        >
          <ProfileAvatar
            avatarUrl={avatarUrl}
            firstName={firstName || name || "Admin"}
            lastName={lastName}
            size="sm"
            imageKey={avatarUpdatedAt}
          />
          <div className="min-w-0 max-w-[140px] sm:max-w-[180px] text-left">
            <p className="truncate text-sm font-medium leading-tight text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
              {displayName}
            </p>
            <p className="truncate text-xs leading-tight text-[#6C757D]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
              {roleLabel}
            </p>
          </div>
        </button>
      </div>
      <StaffProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdated={(url, updatedAt) => {
          setAvatarUrl(url);
          if (updatedAt != null) setAvatarUpdatedAt(updatedAt);
        }}
      />
    </header>
  );
}
