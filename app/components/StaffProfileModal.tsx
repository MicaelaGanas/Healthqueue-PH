"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "../lib/supabase/client";
import { ProfileAvatar } from "./ProfileAvatar";
import { ROLE_LABELS, type StaffRole } from "../lib/api/auth";

export type StaffProfileData = {
  id: string;
  email: string;
  role: string;
  name: string;
  first_name: string;
  last_name: string;
  employeeId: string;
  department: string | null;
  departmentId: string | null;
  avatar_url?: string | null;
};

type StaffProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Called with (newAvatarUrl, updatedAt) so the header can update and cache-bust. */
  onProfileUpdated?: (avatarUrl: string | null, updatedAt?: number) => void;
};

export function StaffProfileModal({ isOpen, onClose, onProfileUpdated }: StaffProfileModalProps) {
  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) throw new Error("Supabase not configured.");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Not signed in.");
      const res = await fetch("/api/staff-profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load profile.");
      setProfile(data);
      setAvatarUrl(data.avatar_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchProfile();
  }, [isOpen, fetchProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUrl((prev) => {
        if (typeof prev === "string" && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setAvatarFile(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) throw new Error("Supabase not configured.");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Not signed in.");
      let newAvatarUrl: string | null = avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("type", "staff");
        const uploadRes = await fetch("/api/upload-avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload photo.");
        newAvatarUrl = uploadData.url ?? null;
      }
      const res = await fetch("/api/staff-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ avatar_url: newAvatarUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update photo.");
      const updatedAt = Date.now();
      setAvatarUrl(newAvatarUrl);
      setAvatarVersion(updatedAt);
      setAvatarFile(null);
      onProfileUpdated?.(newAvatarUrl, updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update photo.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError("");
    setAvatarFile(null);
    if (profile) setAvatarUrl(profile.avatar_url ?? null);
    onClose();
  };

  if (!isOpen) return null;

  const roleLabel = profile?.role && profile.role in ROLE_LABELS
    ? ROLE_LABELS[profile.role as StaffRole]
    : profile?.role ?? "Staff";
  const displayUrl = avatarUrl ?? profile?.avatar_url ?? null;
  const hasChanges = !!avatarFile;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={handleClose} />
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-[#E9ECEF] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-profile-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E9ECEF] px-6 py-4">
          <h2 id="staff-profile-title" className="text-lg font-bold text-[#333333]">
            Staff Profile
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#6C757D] hover:bg-[#f8f9fa] hover:text-[#333333] transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#6C757D]">Loading profile…</p>
            </div>
          ) : error && !profile ? (
            <p className="text-red-600 text-sm py-4">{error}</p>
          ) : profile ? (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-col items-center gap-4 mb-6">
                <label className="block cursor-pointer">
                  <ProfileAvatar
                    avatarUrl={displayUrl}
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    size="lg"
                    className="ring-4 ring-white shadow-md"
                    imageKey={avatarVersion}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                    aria-label="Change profile picture"
                  />
                </label>
                <p className="text-xs text-[#6C757D]">Click photo to change</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#6C757D]">First name</p>
                    <p className="text-[#333333]">{profile.first_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#6C757D]">Last name</p>
                    <p className="text-[#333333]">{profile.last_name || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6C757D]">Email</p>
                  <p className="text-[#333333]">{profile.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6C757D]">Role</p>
                  <p className="text-[#333333]">{roleLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6C757D]">Employee ID</p>
                  <p className="text-[#333333]">{profile.employeeId || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6C757D]">Department</p>
                  <p className="text-[#333333]">{profile.department || "—"}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {profile && (
          <div className="border-t border-[#E9ECEF] px-6 py-4 bg-[#f8f9fa] flex justify-end gap-2">
            {hasChanges ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={saving}
                  className="rounded-lg bg-[#007bff] text-white px-4 py-2 text-sm font-medium hover:bg-[#0056b3] disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save photo"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarUrl(profile.avatar_url ?? null);
                  }}
                  disabled={saving}
                  className="rounded-lg border border-[#dee2e6] bg-white text-[#333] px-4 py-2 text-sm font-medium hover:bg-[#f8f9fa] disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-[#1e3a5f] text-white px-4 py-2 text-sm font-medium hover:bg-[#274472]"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
