/**
 * Admin-managed users (staff).
 * Uses localStorage for now; replace with API calls (see lib/api) when backend is ready.
 */

export type UserRole = "admin" | "nurse" | "doctor" | "receptionist";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  employeeId: string;
  createdAt: string;
};

const STORAGE_KEY = "healthqueue_admin_users";

function loadAll(): AdminUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(users: AdminUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getAdminUsers(): AdminUser[] {
  return loadAll();
}

export function addAdminUser(user: Omit<AdminUser, "id" | "createdAt">): AdminUser {
  const users = loadAll();
  const newUser: AdminUser = {
    ...user,
    id: "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveAll(users);
  return newUser;
}

export function updateAdminUser(id: string, patch: Partial<Omit<AdminUser, "id" | "createdAt">>): void {
  const users = loadAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...patch };
  saveAll(users);
}

export function setUserStatus(id: string, status: "active" | "inactive"): void {
  updateAdminUser(id, { status });
}
