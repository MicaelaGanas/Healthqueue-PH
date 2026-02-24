"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser, getSessionOrSignOut } from "../lib/supabase/client";
import { Footer } from "./Footer";

type Role = "admin" | "nurse" | "doctor" | "receptionist" | "laboratory";

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
    (async () => {
      const { session } = await getSessionOrSignOut(supabase);
      if (cancelled) return;
      if (!session?.access_token) {
        setStatus("denied");
        setTimeout(() => {
          if (!cancelled) router.replace("/pages/employee-login");
        }, 500);
        return;
      }
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelled) return;
      if (!res.ok) {
        setStatus("denied");
        setTimeout(() => {
          if (!cancelled) router.replace("/pages/employee-login");
        }, 500);
        return;
      }
      const body = await res.json().catch(() => ({}));
      const role = body.role as Role | undefined;
      if (!role || !allowedRoles.includes(role)) {
        setStatus("denied");
        setTimeout(() => {
          if (!cancelled) router.replace("/pages/employee-login");
        }, 500);
        return;
      }
      setStatus("allowed");
    })();
    return () => { cancelled = true; };
  }, [supabase, router, rolesKey]);

  if (status === "loading" || status === "denied") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <div className="min-h-screen flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[#6C757D]">Loading…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  return <>{children}</>;
}
