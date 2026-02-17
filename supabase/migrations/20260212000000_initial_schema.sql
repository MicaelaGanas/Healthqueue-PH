-- HealthQueue PH – initial Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) or via Supabase CLI.

-- Queue rows (nurse/doctor dashboard sync)
create table if not exists public.queue_rows (
  ticket text primary key,
  patient_name text not null,
  department text not null,
  priority text not null default 'normal',
  status text not null default 'waiting',
  wait_time text default '',
  source text not null check (source in ('booked', 'walk-in')),
  added_at timestamptz,
  appointment_time text,
  assigned_doctor text,
  appointment_date text,
  created_at timestamptz default now()
);

-- Booked appointments (public book flow → nurse dashboard)
create table if not exists public.booked_queue (
  reference_no text primary key,
  patient_name text not null,
  department text not null,
  appointment_time text not null,
  added_at timestamptz not null,
  preferred_doctor text,
  appointment_date text,
  created_at timestamptz default now()
);

-- Admin-managed staff users
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'nurse', 'doctor', 'receptionist')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  employee_id text not null,
  created_at timestamptz default now()
);

create index if not exists idx_admin_users_email on public.admin_users (email);
create unique index if not exists idx_admin_users_employee_id_unique on public.admin_users (employee_id);

-- Add unique constraint to ensure each employee has a unique ID
alter table public.admin_users
  add constraint if not exists unique_employee_id unique (employee_id);

comment on constraint unique_employee_id on public.admin_users is 'Ensures each employee has a unique employee ID';

-- Patient users (sign-up from patient portal, linked to Supabase Auth)
create table if not exists public.patient_users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text not null,
  number text not null,
  address text not null,
  email text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_patient_users_email on public.patient_users (email);

-- Alerts (nurse dashboard)
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  icon text,
  detail text not null,
  time text,
  unread boolean default true,
  created_at timestamptz default now()
);

-- Optional: enable Row Level Security (RLS) and policies for multi-tenant or role-based access.
-- For now, API routes use the service role key, so RLS can be added later.
alter table public.queue_rows enable row level security;
alter table public.booked_queue enable row level security;
alter table public.admin_users enable row level security;
alter table public.patient_users enable row level security;
alter table public.alerts enable row level security;

-- Allow service role and anon to read/write (restrict later with real auth)
-- Drop first so this migration can be re-run safely.
drop policy if exists "Allow all for queue_rows" on public.queue_rows;
drop policy if exists "Allow all for booked_queue" on public.booked_queue;
drop policy if exists "Allow all for admin_users" on public.admin_users;
drop policy if exists "Allow all for patient_users" on public.patient_users;
drop policy if exists "Allow all for alerts" on public.alerts;

create policy "Allow all for queue_rows" on public.queue_rows for all using (true) with check (true);
create policy "Allow all for booked_queue" on public.booked_queue for all using (true) with check (true);
create policy "Allow all for admin_users" on public.admin_users for all using (true) with check (true);
create policy "Allow all for patient_users" on public.patient_users for all using (true) with check (true);
create policy "Allow all for alerts" on public.alerts for all using (true) with check (true);
