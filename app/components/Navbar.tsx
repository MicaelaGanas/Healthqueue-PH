"use client";

import Link from "next/link";
import {useState, useEffect, useRef} from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { LoginModal } from "./LoginModal";
import { ProfileAvatar } from "./ProfileAvatar";
import { createSupabaseBrowser, getSessionOrSignOut } from "../lib/supabase/client";
import { usePatientProfileFromGuard, type PatientProfile } from "./PatientAuthGuard";

const PROFILE_CACHE_KEY = "patient_profile_cache";
const USER_TYPE_CACHE_KEY = "user_type_cache"; // Cache to avoid repeated staff checks

export function Navbar() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Always start as null so server and client match (avoids hydration mismatch).
  // Cache is restored in useEffect so login/profile doesn't "pop in" after hydration.
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get profile from PatientAuthGuard context if available (instant - no API call!)
  // Returns null if not inside PatientAuthGuard provider
  const profileFromGuard = usePatientProfileFromGuard();

  // Helper to update profile and cache (clearing both keys on logout so login always fetches fresh profile)
  const updateProfile = (newProfile: PatientProfile | null) => {
    setProfile(newProfile);
    if (typeof window !== "undefined") {
      if (newProfile) {
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(newProfile));
        sessionStorage.setItem(USER_TYPE_CACHE_KEY, "patient");
      } else {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
        sessionStorage.removeItem(USER_TYPE_CACHE_KEY);
      }
    }
  };

  useEffect(() => {
    // If we have profile from guard, use it but prefer cached avatar_url (user may have updated photo on profile page)
    if (profileFromGuard) {
      let merged = profileFromGuard;
      if (typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw) as PatientProfile;
            if (cached?.id === profileFromGuard.id) {
              merged = {
                ...profileFromGuard,
                avatar_url: cached.avatar_url ?? profileFromGuard.avatar_url,
                _avatarUpdatedAt: cached._avatarUpdatedAt ?? profileFromGuard._avatarUpdatedAt,
              };
            }
          }
        } catch {
          /* ignore */
        }
      }
      updateProfile(merged);
      setIsLoading(false);
      return;
    }

    // Only fetch if not inside PatientAuthGuard (e.g., on landing page)
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Quick session check first (handles invalid refresh token by signing out)
        const { session } = await getSessionOrSignOut(supabase);
        if (cancelled) return;

        if (!session?.access_token) {
          updateProfile(null);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem(USER_TYPE_CACHE_KEY);
            } catch {
              // Ignore cache errors
            }
          }
          setIsLoading(false);
          return;
        }

        // Check cached user type first to avoid unnecessary API calls on every page visit
        let cachedUserType: "patient" | "staff" | null = null;
        let cachedProfile: PatientProfile | null = null;
        if (typeof window !== "undefined") {
          try {
            cachedUserType = sessionStorage.getItem(USER_TYPE_CACHE_KEY) as "patient" | "staff" | null;
            const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
            if (raw) cachedProfile = JSON.parse(raw) as PatientProfile;
          } catch {
            // Ignore cache errors
          }
        }

        // If we know user is staff from cache, skip patient check.
        if (cachedUserType === "staff") {
          updateProfile(null);
          setIsLoading(false);
          return;
        }

        // Resolve staff first when user type is unknown to avoid expected patient 404s on employee accounts.
        if (!cachedUserType) {
          const staffRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (cancelled) {
            setIsLoading(false);
            return;
          }

          if (staffRes.ok) {
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem(USER_TYPE_CACHE_KEY, "staff");
              } catch {
                // Ignore cache errors
              }
            }
            updateProfile(null);
            setIsLoading(false);
            return;
          }
        }

        // Patient profile lookup (for known/suspected patient sessions).
        const res = await fetch("/api/patient-users", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (cancelled) {
          setIsLoading(false);
          return;
        }

        if (res.ok) {
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(USER_TYPE_CACHE_KEY, "patient");
            } catch {
              // Ignore cache errors
            }
          }
          const data = await res.json();
          if (!cancelled) {
            const now = Date.now();
            updateProfile({
              id: data.id,
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              avatar_url: data.avatar_url ?? null,
              _avatarUpdatedAt: now,
            });
          }
          setIsLoading(false);
          return;
        }

        // If we reached here with unknown user type, cache as staff to avoid repeated patient lookups.
        if (!cachedUserType && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(USER_TYPE_CACHE_KEY, "staff");
          } catch {
            // Ignore cache errors
          }
        }

        // If we get here, user is neither patient nor staff (or error occurred)
        if (!cancelled) {
          updateProfile(null);
        }
      } catch (error) {
        // Silently handle errors - don't log expected 404s
        if (!cancelled) {
          updateProfile(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // Run auth check in background without blocking UI
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!cancelled) {
        if (event === "SIGNED_OUT") {
          // Immediately clear profile and cache - no API calls needed
          updateProfile(null);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem(USER_TYPE_CACHE_KEY);
            } catch {
              // Ignore cache errors
            }
          }
          setIsLoading(false);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Clear all profile/user-type cache so we always fetch fresh data after login (avoids old avatar/profile)
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem(PROFILE_CACHE_KEY);
              sessionStorage.removeItem(USER_TYPE_CACHE_KEY);
            } catch {
              // Ignore cache errors
            }
          }
          // Only check auth on sign in or token refresh, not on every change
          checkAuth();
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [profileFromGuard]);

  // When patient updates profile (e.g. avatar) on profile page, update navbar immediately
  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const next = (e as CustomEvent<PatientProfile>).detail;
      if (next?.id) updateProfile(next);
    };
    window.addEventListener("patient-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("patient-profile-updated", handleProfileUpdated);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      const insideMobile = mobileMenuRef.current?.contains(target) || mobileDropdownRef.current?.contains(target);
      if (!insideMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isDropdownOpen || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;

    // Immediately clear profile and cache for instant UI feedback
    updateProfile(null);
    setIsDropdownOpen(false);
    
    // Sign out from Supabase (no API call needed - just clears local session)
    await supabase.auth.signOut();
    
    // Redirect to landing page after logout
    router.push("/");
  };

  const checkQueueHref = profile ? "/pages/patient-dashboard?tab=queue" : "/pages/queue";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E9ECEF] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-4 sm:px-6 relative">
          <div className="absolute left-4 mt-1 sm:left-6 sm:mt-1">
            <Logo />
          </div>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link href={checkQueueHref} className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
              Check Queue
            </Link>
            <Link href="/pages/book" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
              Book Appointment
            </Link>
            <Link href="/pages/about" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
              About
            </Link>
          </nav>
          {/* Desktop: profile/Login. Mobile: burger button (ref wraps this + mobile dropdown for outside-click) */}
          <div className="absolute right-4 sm:right-6 flex items-center gap-3" ref={mobileMenuRef}>
            {/* Mobile burger button (replaces profile/avatar area on small screens) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer touch-manipulation"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6 text-[#333333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-[#333333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            {/* Desktop only: profile avatar + dropdown or Login */}
            <div className="hidden md:block">
              {isLoading ? (
                profile ? (
                  <div className="flex items-center gap-2 px-2 py-1">
                    <ProfileAvatar avatarUrl={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="sm" imageKey={profile._avatarUpdatedAt} />
                    <span className="text-sm font-medium text-[#333333]">
                      {profile.first_name} {profile.last_name}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-lg border border-[#CCCCCC] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5]"
                  >
                    Login
                  </button>
                )
              ) : profile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                  >
                    <ProfileAvatar avatarUrl={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="sm" imageKey={profile._avatarUpdatedAt} />
                    <span className="text-sm font-medium text-[#333333]">
                      {profile.first_name} {profile.last_name}
                    </span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#E9ECEF] py-1 z-50">
                      <Link
                        href="/pages/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] rounded-t-lg transition-colors cursor-pointer border-b border-[#E9ECEF]"
                      >
                        <ProfileAvatar avatarUrl={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="md" imageKey={profile._avatarUpdatedAt} />
                        <div className="flex flex-col">
                          <span className="font-medium text-[#333333] text-sm">{profile.first_name} {profile.last_name}</span>
                          <span className="text-xs text-[#888888]">View Profile</span>
                        </div>
                      </Link>
                      <Link
                        href="/pages/patient-dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-[#F5F5F5] transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-[#F5F5F5] transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg border border-[#CCCCCC] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5]"
                >
                  Login
                </button>
              )}
            </div>
          </div>
          {/* Mobile dropdown: all nav links + profile dropdown items (or Login) */}
          {isMobileMenuOpen && (
            <div ref={mobileDropdownRef} className="absolute left-0 right-0 top-full mt-0 bg-white border-b border-[#E9ECEF] shadow-lg z-40 md:hidden">
              <nav className="px-4 py-4 flex flex-col gap-1" aria-label="Mobile navigation">
                <Link
                  href={checkQueueHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-3 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  Check Queue
                </Link>
                <Link
                  href="/pages/book"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-3 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  Book Appointment
                </Link>
                <Link
                  href="/pages/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-3 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  About
                </Link>
                {profile ? (
                  <>
                    <div className="border-t border-[#E9ECEF] my-2" />
                    <Link
                      href="/pages/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-[#F5F5F5] rounded-lg transition-colors"
                    >
                      <ProfileAvatar avatarUrl={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="md" imageKey={profile._avatarUpdatedAt} />
                      <div className="flex flex-col">
                        <span className="font-medium text-[#333333] text-sm">{profile.first_name} {profile.last_name}</span>
                        <span className="text-xs text-[#888888]">View Profile</span>
                      </div>
                    </Link>
                    <Link
                      href="/pages/patient-dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-3 text-sm text-[#333333] hover:bg-[#F5F5F5] rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-3 text-sm text-[#333333] hover:bg-[#F5F5F5] rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-[#E9ECEF] my-2" />
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-3 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5] rounded-lg border border-[#CCCCCC] bg-white transition-colors"
                    >
                      Login
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
