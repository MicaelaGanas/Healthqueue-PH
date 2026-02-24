-- booking_requests.confirmed_by references admin_users; nurses/receptionists are in staff_users.
-- Add confirmed_by_staff_id so staff can confirm without FK violation.
-- staff_activity_log.staff_id references admin_users; add staff_staff_id for non-admin staff.

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS confirmed_by_staff_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.booking_requests.confirmed_by_staff_id IS 'Staff user (nurse, etc.) who confirmed; use when confirmer is in staff_users. confirmed_by is for admin_users.';

ALTER TABLE public.staff_activity_log
  ADD COLUMN IF NOT EXISTS staff_staff_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL;

ALTER TABLE public.staff_activity_log
  ALTER COLUMN staff_id DROP NOT NULL;

COMMENT ON COLUMN public.staff_activity_log.staff_staff_id IS 'Staff user (nurse, etc.) who performed the action; use when actor is in staff_users. staff_id is for admin_users.';
