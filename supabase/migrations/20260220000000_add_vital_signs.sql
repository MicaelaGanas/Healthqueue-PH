-- Vital signs recorded by nursing staff (Vitals & Triage)
create table if not exists public.vital_signs (
  id uuid primary key default gen_random_uuid(),
  ticket text not null,
  patient_name text not null,
  department text not null,
  systolic int,
  diastolic int,
  heart_rate int,
  temperature decimal(4,1),
  o2_sat int,
  resp_rate int,
  severity text,
  recorded_at timestamptz not null default now(),
  recorded_by text,
  created_at timestamptz default now()
);

create index if not exists idx_vital_signs_ticket on public.vital_signs (ticket);
create index if not exists idx_vital_signs_recorded_at on public.vital_signs (recorded_at desc);

alter table public.vital_signs enable row level security;
drop policy if exists "Allow all for vital_signs" on public.vital_signs;
create policy "Allow all for vital_signs" on public.vital_signs for all using (true) with check (true);
