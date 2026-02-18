-- Booking requests: patient submits a request; stays pending until staff/doctor confirms.
-- Two types: "self" (account holder is the patient) or "dependent" (e.g. child, elder).
-- After confirmation we can create an entry in booked_queue / queue for the nurse.

-- Booking request status
-- pending   = waiting for doctor/staff confirmation
-- confirmed = approved → can be added to queue / booked_queue
-- rejected  = declined (optional rejection_reason)
-- cancelled = patient or staff cancelled

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null,
  patient_user_id uuid not null references public.patient_users(id) on delete cascade,
  booking_type text not null check (booking_type in ('self', 'dependent')),

  -- For booking_type = 'self': patient info comes from patient_users. No beneficiary fields used.
  -- For booking_type = 'dependent': who the appointment is for (child, elder, etc.)
  beneficiary_first_name text,
  beneficiary_last_name text,
  beneficiary_date_of_birth date,
  beneficiary_gender text,
  relationship text check (relationship is null or relationship in ('child', 'parent', 'spouse', 'other')),

  department text not null,
  preferred_doctor text,
  requested_date date not null,
  requested_time text not null,
  notes text,

  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  confirmed_at timestamptz,
  confirmed_by uuid references public.admin_users(id) on delete set null,
  rejection_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint beneficiary_required_for_dependent check (
    booking_type <> 'dependent' or (
      beneficiary_first_name is not null and
      beneficiary_last_name is not null and
      beneficiary_date_of_birth is not null and
      beneficiary_gender is not null
    )
  )
);

create unique index if not exists idx_booking_requests_reference_no on public.booking_requests (reference_no);
create index if not exists idx_booking_requests_patient_user_id on public.booking_requests (patient_user_id);
create index if not exists idx_booking_requests_status on public.booking_requests (status);
create index if not exists idx_booking_requests_requested_date on public.booking_requests (requested_date);
create index if not exists idx_booking_requests_created_at on public.booking_requests (created_at desc);

-- Optional: keep updated_at in sync
create or replace function public.set_booking_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists booking_requests_updated_at on public.booking_requests;
create trigger booking_requests_updated_at
  before update on public.booking_requests
  for each row execute function public.set_booking_requests_updated_at();

-- RLS
alter table public.booking_requests enable row level security;

drop policy if exists "Allow all for booking_requests" on public.booking_requests;
create policy "Allow all for booking_requests" on public.booking_requests for all using (true) with check (true);

comment on table public.booking_requests is 'Patient booking requests (pending until staff confirms). Types: self = for account holder; dependent = for child/elder/other.';
comment on column public.booking_requests.booking_type is 'self = appointment for the logged-in patient; dependent = for another person (use beneficiary_* fields).';
comment on column public.booking_requests.relationship is 'When booking_type = dependent: child, parent, spouse, other.';
