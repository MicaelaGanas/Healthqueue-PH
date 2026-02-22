-- Store patient name (and optional contact) on booking_requests for "self" bookings
-- so queue_rows get the correct name when confirmed, even if lookup differs.
-- Also allows displaying requester/patient info on pending requests.

alter table public.booking_requests
  add column if not exists patient_first_name text,
  add column if not exists patient_last_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

comment on column public.booking_requests.patient_first_name is 'For self bookings: snapshot of patient first name from form (or from patient_users when not provided).';
comment on column public.booking_requests.patient_last_name is 'For self bookings: snapshot of patient last name from form (or from patient_users when not provided).';
comment on column public.booking_requests.contact_phone is 'Contact phone at time of booking.';
comment on column public.booking_requests.contact_email is 'Contact email at time of booking.';
