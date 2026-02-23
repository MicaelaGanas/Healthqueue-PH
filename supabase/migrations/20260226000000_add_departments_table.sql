-- Departments as a normalized table (id, name) instead of hardcoded lists.
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_departments_name on public.departments (name);
create index if not exists idx_departments_active_order on public.departments (is_active, sort_order);

alter table public.departments enable row level security;
drop policy if exists "Allow all for departments" on public.departments;
create policy "Allow all for departments" on public.departments for all using (true) with check (true);

comment on table public.departments is 'Department/specialty list (e.g. OB-GYN, Pediatrics). Used in booking, queue, and staff assignment.';

-- Seed existing hardcoded departments so current data still matches.
insert into public.departments (name, sort_order) values
  ('OB-GYN', 1),
  ('Cardiology', 2),
  ('General Medicine', 3),
  ('Pediatrics', 4),
  ('Orthopedics', 5),
  ('Dermatology', 6),
  ('Pulmonology', 7),
  ('Gastroenterology', 8),
  ('Dental', 9)
on conflict (name) do nothing;
