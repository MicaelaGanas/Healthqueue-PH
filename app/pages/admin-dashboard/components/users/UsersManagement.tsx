"use client";

import { useState, useEffect } from "react";
import {
  getAdminUsers,
  addAdminUser,
  updateAdminUser,
  setUserStatus,
  type AdminUser,
  type UserRole,
} from "../../../../lib/adminUsersStorage";

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [modalOpen, setModalOpen] = useState<false | "add" | "edit">(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "nurse" as UserRole, employeeId: "" });

  const load = () => setUsers(getAdminUsers());
  useEffect(() => load(), []);

  const openAdd = () => {
    setForm({ name: "", email: "", role: "nurse", employeeId: "" });
    setEditingUser(null);
    setModalOpen("add");
  };
  const openEdit = (u: AdminUser) => {
    setForm({ name: u.name, email: u.email, role: u.role, employeeId: u.employeeId });
    setEditingUser(u);
    setModalOpen("edit");
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateAdminUser(editingUser.id, { name: form.name, email: form.email, role: form.role, employeeId: form.employeeId });
    } else {
      addAdminUser({ name: form.name, email: form.email, role: form.role, status: "active", employeeId: form.employeeId });
    }
    load();
    closeModal();
  };

  const handleToggleStatus = (u: AdminUser) => {
    const next = u.status === "active" ? "inactive" : "active";
    setUserStatus(u.id, next);
    load();
  };

  const roleLabel: Record<UserRole, string> = {
    admin: "Administrator",
    nurse: "Nurse",
    doctor: "Doctor",
    receptionist: "Receptionist",
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#dee2e6]">
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Employee ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#6C757D] sm:px-6">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#6C757D] sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dee2e6] bg-white">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#f8f9fa]">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{u.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{u.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#333333] sm:px-6">{roleLabel[u.role]}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#333333]">{modalOpen === "add" ? "Add User" : "Edit User"}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333333]">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm"
                  required
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]">Employee ID</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  className="mt-1 w-full rounded border border-[#dee2e6] px-3 py-2 text-sm bg-white"
                >
                  <option value="admin">Administrator</option>
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="rounded border border-[#dee2e6] px-4 py-2 text-sm hover:bg-[#f8f9fa]">
                  Cancel
                </button>
                <button type="submit" className="rounded bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a7a]">
                  {modalOpen === "add" ? "Add" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
