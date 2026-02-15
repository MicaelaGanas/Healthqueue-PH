"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../lib/supabase/client";

type Role = "admin" | "nurse" | "doctor" | "receptionist";

type AuthGuardProps = {
  children: React.ReactNode;
  /** Allowed roles for this dashboard (e.g. ["nurse"] or ["admin"]) */
  allowedRoles: Role[];
};

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");
  const supabase = createSupabaseBrowser();

  const rolesKey = allowedRoles.join(",");
  useEffect(() => {
    if (!supabase) {
      setStatus("allowed");
      return;
    }
    let cancelled = false;
    const roles = rolesKey.split(",");
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        router.replace("/pages/employee-login");
        setStatus("denied");
        return;
      }
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelled) return;
      if (!res.ok) {
        router.replace("/pages/employee-login");
        setStatus("denied");
        return;
      }
      const body = await res.json().catch(() => ({}));
      const role = body.role as Role | undefined;
      if (!role || !roles.includes(role)) {
        router.replace("/pages/employee-login");
        setStatus("denied");
        return;
      }
      setStatus("allowed");
    })();
    return () => { cancelled = true; };
  }, [supabase, router, rolesKey]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[#6C757D]">Checking access…</p>
      </div>
    );
  }
  if (status === "denied") return null;
  return <>{children}</>;
}
