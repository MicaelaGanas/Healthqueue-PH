"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { Footer } from "../../components/Footer";

function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm font-medium text-[#333333] hover:text-[#007bff] transition-colors"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Home
    </Link>
  );
}

type ProfileData = {
  id?: string;
  email?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  number?: string;
  address?: string;
  avatar_url?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileData>({ first_name: "", last_name: "" });
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const supabase = createSupabaseBrowser();
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error("Failed to get session.");
        if (!session?.access_token) throw new Error("Not signed in.");
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load profile.");
        setProfile(data);
        setForm({ ...data });
        setAvatarUrl(data.avatar_url ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setForm({ ...profile });
      setAvatarUrl(profile.avatar_url ?? null);
    }
    setAvatarFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) throw new Error("Supabase client not initialized.");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error("Failed to get session.");
      if (!session?.access_token) throw new Error("Not signed in.");
      let avatar_url: string | undefined = form.avatar_url ?? undefined;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("type", "patient");
        const uploadRes = await fetch("/api/upload-avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload avatar.");
        avatar_url = uploadData.url ?? undefined;
      }
      const payload = {
        ...form,
        avatar_url: avatar_url ?? form.avatar_url ?? null,
      };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      setProfile(data);
      setForm({ ...data });
      setAvatarUrl(data.avatar_url ?? null);
      setAvatarVersion(Date.now());
      setEditing(false);
      setAvatarFile(null);
      // Update Navbar cache and notify so avatar updates immediately (include version so navbar avatar reloads)
      const now = Date.now();
      const updatedProfile = {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url ?? null,
        _avatarUpdatedAt: now,
      };
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("patient_profile_cache", JSON.stringify(updatedProfile));
          window.dispatchEvent(
            new CustomEvent("patient-profile-updated", { detail: updatedProfile })
          );
        } catch {
          /* ignore */
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#6C757D] text-sm">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <main className="flex-1 mx-auto max-w-2xl px-4 py-8">
          <BackToHome />
          <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-[#E9ECEF] text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-[#6C757D] text-sm mt-2">Please sign in or try again later.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayUrl = avatarUrl ?? profile?.avatar_url ?? null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529] flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <BackToHome />
        <h1 className="mt-6 text-2xl font-bold text-[#333333]">My Profile</h1>
        <p className="mt-1 text-sm text-[#6C757D]">View and update your information</p>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
          {/* Header with avatar and name */}
          <div className="p-6 sm:p-8 border-b border-[#E9ECEF] bg-gradient-to-b from-white to-[#f8f9fa]">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative group">
                <label className="block cursor-pointer">
                  <ProfileAvatar
                    avatarUrl={displayUrl}
                    firstName={profile?.first_name ?? ""}
                    lastName={profile?.last_name}
                    size="lg"
                    className="ring-4 ring-white shadow-md"
                    imageKey={avatarVersion}
                  />
                  {editing && (
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleAvatarChange}
                      title="Change profile picture"
                    />
                  )}
                </label>
                {editing && (
                  <span className="absolute bottom-0 right-0 text-xs font-medium text-[#6C757D] bg-white/90 px-2 py-1 rounded shadow">
                    Change
                  </span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-[#333333]">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                {profile?.email && (
                  <p className="mt-1 text-sm text-[#6C757D]">{profile.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#495057]">First name</label>
                {editing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name ?? ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333] focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none"
                  />
                ) : (
                  <p className="mt-1 text-[#333]">{profile?.first_name || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#495057]">Last name</label>
                {editing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name ?? ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333] focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none"
                  />
                ) : (
                  <p className="mt-1 text-[#333]">{profile?.last_name || "—"}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057]">Email</label>
              <p className="mt-1 text-[#333]">{profile?.email || "—"}</p>
              <p className="mt-0.5 text-xs text-[#6C757D]">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057]">Date of birth</label>
              {editing ? (
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333] focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none"
                />
              ) : (
                <p className="mt-1 text-[#333]">{profile?.date_of_birth || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057]">Gender</label>
              {editing ? (
                <select
                  name="gender"
                  value={form.gender ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333] focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              ) : (
                <p className="mt-1 text-[#333]">{profile?.gender || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057]">Phone number</label>
              {editing ? (
                <input
                  type="text"
                  name="number"
                  value={form.number ?? ""}
                  onChange={handleChange}
                  placeholder="e.g. 09XXXXXXXXX"
                  className="mt-1 block w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333] focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none placeholder:text-[#adb5bd]"
                />
              ) : (
                <p className="mt-1 text-[#333]">{profile?.number || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057]">Address</label>
              {editing ? (
                <input
                  type="text"
                  name="address"
                  value={form.address ?? ""}
                  onChange={handleChange}
                  placeholder="Street, city, province"
                  className="mt-1 block w-full rounded-lg border border-[#dee2e6] px-3 py-2 text-[#333] focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none placeholder:text-[#adb5bd]"
                />
              ) : (
                <p className="mt-1 text-[#333]">{profile?.address || "—"}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 sm:px-8 py-4 bg-[#f8f9fa] border-t border-[#E9ECEF] flex flex-wrap gap-3">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#007bff] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#0056b3] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-[#dee2e6] bg-white text-[#333] px-5 py-2.5 text-sm font-medium hover:bg-[#f8f9fa] disabled:opacity-60 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-lg bg-[#1e3a5f] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#274472] transition-colors"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
