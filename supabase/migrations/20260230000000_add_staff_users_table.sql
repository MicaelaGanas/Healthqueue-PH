-- staff_users: non-admin staff (nurse, doctor, receptionist, laboratory).
-- Admins go in admin_users; all other roles go in staff_users.
-- Run after normalized_schema so admin_users has first_name, last_name, department_id.

CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('nurse', 'doctor', 'receptionist', 'laboratory')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  employee_id text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_users_employee_id ON public.staff_users (employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_users_auth_user_id ON public.staff_users (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_users_department_id ON public.staff_users (department_id);

COMMENT ON TABLE public.staff_users IS 'Non-admin staff (nurse, doctor, receptionist, laboratory). Admins are in admin_users.';

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for staff_users" ON public.staff_users;
CREATE POLICY "Allow all for staff_users" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);

-- Point queue_items.assigned_doctor_id to staff_users (doctors live here)
UPDATE public.queue_items SET assigned_doctor_id = NULL WHERE assigned_doctor_id IS NOT NULL;
ALTER TABLE public.queue_items
  DROP CONSTRAINT IF EXISTS queue_items_assigned_doctor_id_fkey;
ALTER TABLE public.queue_items
  ADD CONSTRAINT queue_items_assigned_doctor_id_fkey
  FOREIGN KEY (assigned_doctor_id) REFERENCES public.staff_users(id) ON DELETE SET NULL;

-- Point booking_requests.preferred_doctor_id to staff_users
UPDATE public.booking_requests SET preferred_doctor_id = NULL WHERE preferred_doctor_id IS NOT NULL;
ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_preferred_doctor_id_fkey;
ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_preferred_doctor_id_fkey
  FOREIGN KEY (preferred_doctor_id) REFERENCES public.staff_users(id) ON DELETE SET NULL;

-- vital_signs.recorded_by_id and guidance_messages.sent_by_id: nurses/doctors are in staff_users
UPDATE public.vital_signs SET recorded_by_id = NULL WHERE recorded_by_id IS NOT NULL;
ALTER TABLE public.vital_signs
  DROP CONSTRAINT IF EXISTS vital_signs_recorded_by_id_fkey;
ALTER TABLE public.vital_signs
  ADD CONSTRAINT vital_signs_recorded_by_id_fkey
  FOREIGN KEY (recorded_by_id) REFERENCES public.staff_users(id) ON DELETE SET NULL;

UPDATE public.guidance_messages SET sent_by_id = NULL WHERE sent_by_id IS NOT NULL;
ALTER TABLE public.guidance_messages
  DROP CONSTRAINT IF EXISTS guidance_messages_sent_by_id_fkey;
ALTER TABLE public.guidance_messages
  ADD CONSTRAINT guidance_messages_sent_by_id_fkey
  FOREIGN KEY (sent_by_id) REFERENCES public.staff_users(id) ON DELETE SET NULL;
