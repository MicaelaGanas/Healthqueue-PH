"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useDepartments } from "../../../../lib/useDepartments";

export type UserRole = "admin" | "nurse" | "doctor" | "receptionist" | "laboratory";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  employeeId: string;
  department: string | null;
  createdAt: string;
};

export function UsersManagement() {
  const { departments } = useDepartments();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<false | "add" | "edit">(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "nurse" as UserRole, employeeId: "", department: "", password: "" });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load users");
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAdd = () => {
    setForm({ name: "", email: "", role: "nurse", employeeId: "", department: "", password: "" });
    setEditingUser(null);
    setError(null);
    setModalOpen("add");
  };

  const openEdit = (u: AdminUser) => {
    setForm({ name: u.name, email: u.email, role: u.role, employeeId: u.employeeId, department: u.department ?? "", password: "" });
    setEditingUser(u);
    setError(null);
    setModalOpen("edit");
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setError(null);
    setForm({ name: "", email: "", role: "nurse", employeeId: "", department: "", password: "" });
  };

  const rolesWithDepartment: UserRole[] = ["nurse", "doctor", "receptionist"];
  const showDepartment = rolesWithDepartment.includes(form.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showDepartment && !form.department.trim()) {
      setError("Please select the department this staff member belongs to.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      if (editingUser) {
        // Update existing user (employeeId is not included - it cannot be changed)
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            department: showDepartment ? (form.department.trim() || null) : null,
            // employeeId is intentionally omitted - it cannot be changed
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to update user");
        }
      } else {
        // Create new user
        if (!form.password) {
          throw new Error("Password is required for new users");
        }

        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            employeeId: modalOpen === "add" ? undefined : form.employeeId,
            department: showDepartment ? (form.department.trim() || null) : null,
            password: form.password,
            status: "active",
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to create user");
        }
      }

      await loadUsers();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: AdminUser) => {
    try {
      setError(null);
      const supabase = createSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const next = u.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update status");
      }

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const roleLabel: Record<UserRole, string> = {
    admin: "Administrator",
    nurse: "Nurse",
    doctor: "Doctor",
    receptionist: "Receptionist",
    laboratory: "Laboratory",
  };

  return (
    <div className="rounded-lg border border-[#dee2e6] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dee2e6] px-4 py-3 sm:px-6">
        <h3 className="text-base font-semibold text-[#333333]">Users</h3>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a]"
        >
          Add User
        </button>
      </div>

      {error && !modalOpen && (
        <div className="mx-4 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#dee2e6]">
            <thead className="bg-[#f8f9fa]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Department they belong to</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Employee ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#6C757D] sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6] bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6C757D] sm:px-6">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f8f9fa]">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{u.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{roleLabel[u.role]}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{u.department ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{u.employeeId}</td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-[#007bff] hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={u.status === "active" ? "text-amber-600 hover:underline" : "text-green-600 hover:underline"}
                      >
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#333333]">{modalOpen === "add" ? "Add User" : "Edit User"}</h3>
            
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333333]">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm"
                  required
                  disabled={submitting || modalOpen === "edit"}
                />
                {modalOpen === "edit" && (
                  <p className="mt-1 text-xs text-[#6C757D]">Email cannot be changed</p>
                )}
              </div>
              {modalOpen === "edit" && (
                <div>
                  <label className="block text-sm font-medium text-[#333333]">Employee ID</label>
                  <input
                    type="text"
                    value={form.employeeId}
                    className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm bg-gray-100"
                    disabled
                  />
                  <p className="mt-1 text-xs text-[#6C757D]">Employee ID cannot be changed</p>
                </div>
              )}
              {modalOpen === "add" && (
                <div>
                  <label className="block text-sm font-medium text-[#333333]">Employee ID</label>
                  <input
                    type="text"
                    value="Auto-generated"
                    className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm bg-gray-100"
                    disabled
                  />
                  <p className="mt-1 text-xs text-[#6C757D]">Employee ID will be automatically generated (e.g., EMP - 0001)</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#333333]">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm bg-white"
                  disabled={submitting}
                >
                  <option value="admin">Administrator</option>
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="laboratory">Laboratory</option>
                </select>
              </div>
              {showDepartment && (
                <div>
                  <label className="block text-sm font-medium text-[#333333]">Department they belong to</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm bg-white"
                    disabled={submitting}
                    required
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[#6C757D]">Set which department this staff member belongs to. Their queue view will be scoped to this department.</p>
                </div>
              )}
              {modalOpen === "add" && (
                <div>
                  <label className="block text-sm font-medium text-[#333333]">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm"
                    required
                    disabled={submitting}
                    minLength={6}
                    placeholder="Minimum 6 characters"
                  />
                  <p className="mt-1 text-xs text-[#6C757D]">Password must be at least 6 characters</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="rounded border border-[#dee2e6] px-4 py-2 text-sm hover:bg-[#f8f9fa] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : modalOpen === "add" ? "Add" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
