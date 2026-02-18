-- Add 'laboratory' to allowed staff roles (admin_users.role).
-- Run after initial_schema; safe to run if already applied.

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('admin', 'nurse', 'doctor', 'receptionist', 'laboratory'));
