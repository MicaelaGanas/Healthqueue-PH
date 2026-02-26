-- Per-department booking intervals and week-based availability setup.

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS default_slot_interval_minutes int NOT NULL DEFAULT 30;

ALTER TABLE public.departments
  DROP CONSTRAINT IF EXISTS departments_default_slot_interval_minutes_chk;

ALTER TABLE public.departments
  ADD CONSTRAINT departments_default_slot_interval_minutes_chk
  CHECK (default_slot_interval_minutes >= 5 AND default_slot_interval_minutes <= 60 AND (default_slot_interval_minutes % 5 = 0));

CREATE TABLE IF NOT EXISTS public.department_booking_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  slot_interval_minutes int NOT NULL DEFAULT 30,
  is_open boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT department_booking_weeks_unique UNIQUE (department_id, week_start_date),
  CONSTRAINT department_booking_weeks_slot_interval_chk
    CHECK (slot_interval_minutes >= 5 AND slot_interval_minutes <= 60 AND (slot_interval_minutes % 5 = 0))
);

CREATE INDEX IF NOT EXISTS idx_department_booking_weeks_dept_week
  ON public.department_booking_weeks (department_id, week_start_date);

CREATE OR REPLACE FUNCTION public.set_department_booking_weeks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS department_booking_weeks_updated_at ON public.department_booking_weeks;
CREATE TRIGGER department_booking_weeks_updated_at
  BEFORE UPDATE ON public.department_booking_weeks
  FOR EACH ROW EXECUTE FUNCTION public.set_department_booking_weeks_updated_at();

ALTER TABLE public.department_booking_weeks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for department_booking_weeks" ON public.department_booking_weeks;
CREATE POLICY "Allow all for department_booking_weeks"
  ON public.department_booking_weeks FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.department_booking_weeks IS 'Weekly booking setup by department. Future weeks must be opened by admin before patients can book.';
COMMENT ON COLUMN public.department_booking_weeks.week_start_date IS 'Monday of the configured week in YYYY-MM-DD.';
COMMENT ON COLUMN public.department_booking_weeks.slot_interval_minutes IS 'Slot interval for this department/week, in minutes.';
