-- Normalized schema: enums, admin_users first/last name + department_id, queue_items, booking_requests FKs, vitals/guidance FKs.
-- Run after existing migrations. Migrates data from queue_rows into queue_items then drops queue_rows.

-- Enums for queue and (optional) future use
DO $$ BEGIN
  CREATE TYPE public.queue_source AS ENUM ('booked', 'walk_in');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.queue_priority AS ENUM ('normal', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.queue_status AS ENUM ('waiting', 'scheduled', 'in_consultation', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) Normalize admin_users: first_name, last_name, department_id
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

UPDATE public.admin_users
SET
  first_name = COALESCE(NULLIF(TRIM(SPLIT_PART(name, ' ', 1)), ''), name),
  last_name  = COALESCE(NULLIF(TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1)), ''), '')
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

UPDATE public.admin_users au
SET department_id = d.id
FROM public.departments d
WHERE d.name = au.department AND au.department IS NOT NULL AND au.department_id IS NULL;

ALTER TABLE public.admin_users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.admin_users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS name;
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS department;

-- 2) queue_items (replaces queue_rows)
CREATE TABLE IF NOT EXISTS public.queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket text NOT NULL UNIQUE,
  source public.queue_source NOT NULL,
  priority public.queue_priority NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'scheduled', 'in_consultation', 'completed', 'cancelled', 'no_show')),
  wait_time text NOT NULL DEFAULT '',
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  patient_user_id uuid NULL REFERENCES public.patient_users(id) ON DELETE SET NULL,
  walk_in_first_name text NULL,
  walk_in_last_name text NULL,
  walk_in_age_years int NULL,
  walk_in_sex text NULL,
  walk_in_phone text NULL,
  walk_in_email text NULL,
  booking_request_id uuid NULL REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  assigned_doctor_id uuid NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  appointment_at timestamptz NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queue_items_department_id ON public.queue_items (department_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_added_at ON public.queue_items (added_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON public.queue_items (status);
CREATE INDEX IF NOT EXISTS idx_queue_items_source ON public.queue_items (source);

-- Ensure wait_time exists (idempotent if table was created without it)
ALTER TABLE public.queue_items ADD COLUMN IF NOT EXISTS wait_time text NOT NULL DEFAULT '';

-- Migrate queue_rows -> queue_items (resolve department by name).
-- Map status to enum; use 'waiting' when value is 'scheduled' and enum has no 'scheduled' (safe for all DBs).
INSERT INTO public.queue_items (
  ticket, source, priority, status, wait_time, department_id,
  walk_in_first_name, walk_in_last_name, added_at, appointment_at, created_at
)
SELECT
  qr.ticket,
  CASE WHEN qr.source = 'walk-in' THEN 'walk_in'::public.queue_source ELSE 'booked'::public.queue_source END,
  CASE WHEN qr.priority = 'urgent' THEN 'urgent'::public.queue_priority ELSE 'normal'::public.queue_priority END,
  CASE
    WHEN COALESCE(NULLIF(TRIM(qr.status), ''), 'waiting') IN ('in_consultation', 'completed', 'cancelled', 'no_show') THEN (COALESCE(NULLIF(TRIM(qr.status), ''), 'waiting'))::public.queue_status
    ELSE 'waiting'::public.queue_status
  END,
  COALESCE(NULLIF(TRIM(qr.wait_time), ''), ''),
  (SELECT id FROM public.departments WHERE name = TRIM(qr.department) LIMIT 1),
  TRIM(SPLIT_PART(qr.patient_name, ' ', 1)),
  COALESCE(NULLIF(TRIM(SUBSTRING(qr.patient_name FROM POSITION(' ' IN qr.patient_name) + 1)), ''), ''),
  COALESCE(qr.added_at, now()),
  NULL,
  COALESCE(qr.created_at, now())
FROM public.queue_rows qr
WHERE NOT EXISTS (SELECT 1 FROM public.queue_items qi WHERE qi.ticket = qr.ticket);

-- Assign assigned_doctor_id: match to staff_users (if table exists) else admin_users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_users') THEN
    UPDATE public.queue_items qi
    SET assigned_doctor_id = su.id
    FROM public.queue_rows qr
    JOIN public.staff_users su ON (
      su.role = 'doctor'
      AND (
        qr.assigned_doctor = (su.first_name || ' ' || su.last_name)
        OR (qr.assigned_doctor LIKE 'Dr. %' AND (qr.assigned_doctor LIKE 'Dr. ' || su.first_name || ' %' OR qr.assigned_doctor LIKE '%' || su.first_name || ' ' || su.last_name || '%'))
      )
    )
    WHERE qi.ticket = qr.ticket AND qi.assigned_doctor_id IS NULL;
  ELSE
    UPDATE public.queue_items qi
    SET assigned_doctor_id = au.id
    FROM public.queue_rows qr
    JOIN public.admin_users au ON (
      au.role = 'doctor'
      AND (
        qr.assigned_doctor = (au.first_name || ' ' || au.last_name)
        OR (qr.assigned_doctor LIKE 'Dr. %' AND (qr.assigned_doctor LIKE 'Dr. ' || au.first_name || ' %' OR qr.assigned_doctor LIKE '%' || au.first_name || ' ' || au.last_name || '%'))
      )
    )
    WHERE qi.ticket = qr.ticket AND qi.assigned_doctor_id IS NULL;
  END IF;
END $$;

-- Appointment time/date from queue_rows (text -> timestamptz where possible)
UPDATE public.queue_items qi
SET
  appointment_at = CASE
    WHEN qr.appointment_date IS NOT NULL AND qr.appointment_time IS NOT NULL THEN
      (qr.appointment_date || ' ' || qr.appointment_time)::timestamptz
    ELSE NULL
  END
FROM public.queue_rows qr
WHERE qi.ticket = qr.ticket AND qi.appointment_at IS NULL;

DROP TABLE IF EXISTS public.queue_rows;

ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for queue_items" ON public.queue_items;
CREATE POLICY "Allow all for queue_items" ON public.queue_items FOR ALL USING (true) WITH CHECK (true);

-- 3) booking_requests: department_id, preferred_doctor_id (drop text columns after backfill)
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS preferred_doctor_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;

UPDATE public.booking_requests br
SET department_id = d.id
FROM public.departments d
WHERE d.name = TRIM(br.department) AND br.department IS NOT NULL AND br.department_id IS NULL;

UPDATE public.booking_requests br
SET department_id = (SELECT id FROM public.departments ORDER BY sort_order, name LIMIT 1)
WHERE br.department_id IS NULL;

ALTER TABLE public.booking_requests ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS department;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS preferred_doctor;

-- 4) vital_signs: queue_item_id, recorded_by (staff uuid)
ALTER TABLE public.vital_signs
  ADD COLUMN IF NOT EXISTS queue_item_id uuid REFERENCES public.queue_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recorded_by_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;

UPDATE public.vital_signs vs
SET queue_item_id = qi.id
FROM public.queue_items qi
WHERE qi.ticket = vs.ticket AND vs.queue_item_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_vital_signs_queue_item_id ON public.vital_signs (queue_item_id);

-- 5) guidance_messages: queue_item_id, sent_by (staff uuid)
ALTER TABLE public.guidance_messages
  ADD COLUMN IF NOT EXISTS queue_item_id uuid REFERENCES public.queue_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_by_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;

UPDATE public.guidance_messages gm
SET queue_item_id = qi.id
FROM public.queue_items qi
WHERE qi.ticket = gm.ticket AND gm.queue_item_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_guidance_messages_queue_item_id ON public.guidance_messages (queue_item_id);

-- staff_activity_log already has staff_id; entity_id remains text for flexibility
COMMENT ON TABLE public.queue_items IS 'Single queue table: booked and walk-in. Replaces queue_rows.';
COMMENT ON TABLE public.admin_users IS 'Staff users; first_name/last_name, department_id for normalization.';
COMMENT ON TABLE public.booking_requests IS 'Booking requests; department_id and preferred_doctor_id reference normalized tables.';
