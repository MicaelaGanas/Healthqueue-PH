"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { ROLE_LABELS, type StaffRole } from "../../../../lib/api/auth";

function initials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] || "";
  return local.slice(0, 2).toUpperCase() || "?";
}

export function AdminHeader() {
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [email, setEmail] = useState<string>("");
  const [initialsStr, setInitialsStr] = useState("??");

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

  const displayName = (name && name.trim()) || email || "Admin";
  const roleLabel = role ? ROLE_LABELS[role] : "Administrator";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] bg-white px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight text-[#333333] sm:text-lg">
          Admin Dashboard
        </h1>
        <p className="mt-0.5 truncate text-xs leading-tight text-[#6C757D] sm:text-sm">
          User management, reports & records
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="h-8 w-px shrink-0 bg-[#e9ecef]" aria-hidden />
        <div className="flex items-center gap-3 pl-2 sm:pl-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
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
