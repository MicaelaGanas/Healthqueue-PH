"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { ROLE_LABELS, type StaffRole } from "../../../../lib/api/auth";
import { ProfileAvatar } from "../../../../components/ProfileAvatar";
import { StaffProfileModal } from "../../../../components/StaffProfileModal";

export function LabHeader() {
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUpdatedAt, setAvatarUpdatedAt] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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

  const displayName = (name && name.trim()) || email || "Lab staff";
  const roleLabel = role ? ROLE_LABELS[role] : "Laboratory";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] bg-white px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight text-[#333333] sm:text-lg">
          Laboratory Dashboard
        </h1>
        <p className="mt-0.5 truncate text-xs leading-tight text-[#6C757D] sm:text-sm">
          Specimens, processing & results
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="h-8 w-px shrink-0 bg-[#e9ecef]" aria-hidden />
        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center gap-3 pl-2 sm:pl-3 rounded-lg hover:bg-[#f8f9fa] transition-colors cursor-pointer"
          aria-label="Open profile"
        >
          <ProfileAvatar
            avatarUrl={avatarUrl}
            firstName={firstName || name || "Lab"}
            lastName={lastName}
            size="sm"
            imageKey={avatarUpdatedAt}
          />
          <div className="min-w-0 max-w-[140px] sm:max-w-[180px] text-left">
            <p className="truncate text-sm font-medium leading-tight text-[#333333]">
              {displayName}
            </p>
            <p className="truncate text-xs leading-tight text-[#6C757D]">
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
