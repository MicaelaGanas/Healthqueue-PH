"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowser, getSessionOrSignOut } from "../lib/supabase/client";
import { Footer } from "./Footer";

export interface PatientProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  /** Set when profile photo is updated (e.g. from profile page) so avatar can be cache-busted. */
  _avatarUpdatedAt?: number;
}

// Context to share profile data with Navbar (avoids duplicate API calls)
const PatientProfileContext = createContext<PatientProfile | null>(null);

export function usePatientProfileFromGuard() {
  // Returns null if not inside PatientAuthGuard (no error thrown)
  return useContext(PatientProfileContext);
}

type PatientAuthGuardProps = {
  children: React.ReactNode;
};

export function PatientAuthGuard({ children }: PatientAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const supabase = createSupabaseBrowser();

  const loginUrl =
    pathname && pathname !== "/pages/patient-login"
      ? `/pages/patient-login?redirect=${encodeURIComponent(pathname)}`
      : "/pages/patient-login";

  useEffect(() => {
    if (!supabase) {
      setStatus("denied");
      setTimeout(() => {
        router.replace(loginUrl);
      }, 500);
      return;
    }

    let cancelled = false;

    const checkAuth = async () => {
      try {
        const { session } = await getSessionOrSignOut(supabase);
        if (cancelled) return;

        if (!session?.access_token) {
          setProfile(null);
          // Keep showing loading animation instead of immediate redirect
          setStatus("denied");
          // Redirect after a brief delay to show loading animation
          setTimeout(() => {
            if (!cancelled) {
              router.replace(loginUrl);
            }
          }, 500);
          return;
        }

        // Verify patient profile exists and store it for Navbar
        const res = await fetch("/api/patient-users", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (cancelled) return;

        if (res.status === 404) {
          setProfile(null);
          setStatus("denied");
          const completeProfileUrl =
            pathname && pathname !== "/pages/patient-login"
              ? `/pages/patient-complete-profile?redirect=${encodeURIComponent(pathname)}`
              : "/pages/patient-complete-profile";
          setTimeout(() => {
            if (!cancelled) {
              router.replace(completeProfileUrl);
            }
          }, 500);
          return;
        }

        if (!res.ok) {
          setProfile(null);
          setStatus("denied");
          setTimeout(() => {
            if (!cancelled) {
              router.replace(loginUrl);
            }
          }, 500);
          return;
        }

        // Store profile data so Navbar can use it immediately (no duplicate API call!)
        const data = await res.json();
        if (!cancelled) {
          setProfile({
            id: data.id,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            avatar_url: data.avatar_url ?? null,
            _avatarUpdatedAt: Date.now(),
          });
          setStatus("allowed");
        }
      } catch (error) {
        if (!cancelled) {
          setProfile(null);
          setStatus("denied");
          setTimeout(() => {
            if (!cancelled) {
              router.replace(loginUrl);
            }
          }, 500);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !cancelled) {
        setProfile(null);
        setStatus("denied");
        setTimeout(() => {
          if (!cancelled) {
            router.replace(loginUrl);
          }
        }, 500);
      } else if (!cancelled) {
        checkAuth();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router, loginUrl, pathname]);

  if (status === "loading" || status === "denied") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <div className="min-h-screen flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[#6C757D]">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Provide profile data via context so Navbar can use it immediately
  return (
    <PatientProfileContext.Provider value={profile}>
      {children}
    </PatientProfileContext.Provider>
  );
}
