"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { useDepartments } from "../../../../lib/useDepartments";
import { AdminSectionHeader } from "../layout/AdminSectionHeader";

export type UserRole = "admin" | "nurse" | "doctor" | "receptionist" | "laboratory";

export type AdminUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  employeeId: string;
  department: string | null;
  createdAt: string;
};

type PatientAccount = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  createdAt: string;
};

function splitName(input: string): { firstName: string; lastName: string } {
  const clean = input.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "", lastName: "" };
  const parts = clean.split(" ");
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function UsersManagement() {
  const { departments } = useDepartments();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [patientAccounts, setPatientAccounts] = useState<PatientAccount[]>([]);
  const [activeView, setActiveView] = useState<"staff" | "patients">("staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<"all" | UserRole>("all");
  const [staffStatusFilter, setStaffStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState<string>("all");
  const [patientGenderFilter, setPatientGenderFilter] = useState<"all" | "male" | "female" | "other">("all");
  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<false | "add" | "edit">(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "nurse" as UserRole, employeeId: "", department: "", password: "" });

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

  const loadPatientAccounts = async () => {
    try {
      setPatientLoading(true);
      setError(null);
      const supabase = createSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/admin/patient-users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load patient accounts");
      }

      const data = await res.json();
      setPatientAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patient accounts");
    } finally {
      setPatientLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPatientAccounts();
  }, []);

  const openAdd = () => {
    setForm({ firstName: "", lastName: "", email: "", role: "nurse", employeeId: "", department: "", password: "" });
    setEditingUser(null);
    setError(null);
    setModalOpen("add");
  };

  const openEdit = (u: AdminUser) => {
    const parsed = splitName(u.name);
    setForm({
      firstName: (u.firstName ?? parsed.firstName ?? "").trim(),
      lastName: (u.lastName ?? parsed.lastName ?? "").trim(),
      email: u.email,
      role: u.role,
      employeeId: u.employeeId,
      department: u.department ?? "",
      password: "",
    });
    setEditingUser(u);
    setError(null);
    setModalOpen("edit");
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setError(null);
    setForm({ firstName: "", lastName: "", email: "", role: "nurse", employeeId: "", department: "", password: "" });
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
            firstName: form.firstName,
            lastName: form.lastName,
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
            firstName: form.firstName,
            lastName: form.lastName,
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

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (staffRoleFilter !== "all" && u.role !== staffRoleFilter) return false;
      if (staffStatusFilter !== "all" && u.status !== staffStatusFilter) return false;
      if (staffDepartmentFilter !== "all" && (u.department ?? "") !== staffDepartmentFilter) return false;

      if (!query) return true;
      const haystack = [u.name, u.firstName, u.lastName, u.email, u.employeeId, u.department ?? "", roleLabel[u.role]]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [users, searchTerm, staffRoleFilter, staffStatusFilter, staffDepartmentFilter]);

  const filteredPatientAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return patientAccounts.filter((p) => {
      const genderNorm = (p.gender || "").trim().toLowerCase();
      if (patientGenderFilter !== "all" && genderNorm !== patientGenderFilter) return false;

      if (!query) return true;
      const haystack = [p.name, p.firstName, p.lastName, p.email, p.phone, p.gender, p.address]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [patientAccounts, searchTerm, patientGenderFilter]);

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="User Management"
        description="Manage admin and staff accounts, roles, and account status."
      />

      <div className="rounded-lg border border-[#dee2e6] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dee2e6] px-4 py-3 sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-[#333333]">
            {activeView === "staff" ? "Staff Users" : "Patient Accounts"}
          </h3>
          <div className="mt-2 inline-flex rounded-lg border border-[#dee2e6] bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveView("staff")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeView === "staff" ? "bg-[#1e3a5f] text-white" : "text-[#495057] hover:bg-[#f8f9fa]"
              }`}
            >
              Staff Users
            </button>
            <button
              type="button"
              onClick={() => setActiveView("patients")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeView === "patients" ? "bg-[#1e3a5f] text-white" : "text-[#495057] hover:bg-[#f8f9fa]"
              }`}
            >
              Patient Accounts
            </button>
          </div>
        </div>
        {activeView === "staff" && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a]"
          >
            Add User
          </button>
        )}
      </div>

      {error && !modalOpen && (
        <div className="mx-4 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="border-b border-[#dee2e6] bg-[#f8f9fa] px-4 py-3 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-[#6C757D]">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeView === "staff" ? "Name, email, employee ID..." : "Name, email, phone..."}
              className="mt-1 w-full rounded border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
            />
          </div>

          {activeView === "staff" ? (
            <>
              <div>
                <label className="block text-xs font-medium text-[#6C757D]">Role</label>
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value as "all" | UserRole)}
                  className="mt-1 w-full rounded border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Administrator</option>
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="laboratory">Laboratory</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6C757D]">Status</label>
                <select
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="mt-1 w-full rounded border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6C757D]">Department</label>
                <select
                  value={staffDepartmentFilter}
                  onChange={(e) => setStaffDepartmentFilter(e.target.value)}
                  className="mt-1 w-full rounded border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
                >
                  <option value="all">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#6C757D]">Gender</label>
              <select
                value={patientGenderFilter}
                onChange={(e) => setPatientGenderFilter(e.target.value as "all" | "male" | "female" | "other")}
                className="mt-1 w-full rounded border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#333333]"
              >
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {activeView === "staff" && loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : activeView === "staff" ? (
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6C757D] sm:px-6">
                    No staff users match the current search/filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
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
      ) : patientLoading ? (
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">First Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Last Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Date of Birth</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6] bg-white">
              {filteredPatientAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6C757D] sm:px-6">
                    No patient accounts match the current search/filter.
                  </td>
                </tr>
              ) : (
                filteredPatientAccounts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8f9fa]">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{p.firstName || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{p.lastName || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{p.email || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{p.phone || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{p.gender || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{p.dateOfBirth || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">
                      {p.createdAt ? p.createdAt.slice(0, 10) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#333333]">{modalOpen === "add" ? "Add User" : "Edit User"}</h3>
            
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333333]">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
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
    </div>
  );
}
