-- Daily snapshots for ML: one row per day, used to train simple regression and predict tomorrow.
create table if not exists public.daily_insights_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  completed_count int not null default 0,
  booked_count int not null default 0,
  waiting_max int not null default 0,
  urgent_count int not null default 0,
  in_consultation_max int not null default 0,
  staff_actions int not null default 0,
  top_dept_name text,
  top_dept_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_daily_insights_snapshots_date on public.daily_insights_snapshots (date desc);

alter table public.daily_insights_snapshots enable row level security;
drop policy if exists "Allow all for daily_insights_snapshots" on public.daily_insights_snapshots;
create policy "Allow all for daily_insights_snapshots" on public.daily_insights_snapshots for all using (true) with check (true);

comment on table public.daily_insights_snapshots is 'One row per day: aggregates for training simple ML (linear regression) predictions.';
