-- Quick setup seed: pre-open upcoming department booking weeks.
-- Purpose: make booking immediately usable for the next 4 weeks without manual admin setup.
-- Notes:
--   - Seeds only active departments.
--   - Uses each department's default_slot_interval_minutes.
--   - Starts from next Monday (future weeks only).

WITH next_monday AS (
  SELECT (date_trunc('week', current_date::timestamp) + interval '7 day')::date AS week_start
),
week_offsets AS (
  SELECT generate_series(0, 3) AS offset_weeks
),
target_weeks AS (
  SELECT (nm.week_start + (wo.offset_weeks * 7))::date AS week_start_date
  FROM next_monday nm
  CROSS JOIN week_offsets wo
)
INSERT INTO public.department_booking_weeks (
  department_id,
  week_start_date,
  slot_interval_minutes,
  is_open
)
SELECT
  d.id,
  tw.week_start_date,
  d.default_slot_interval_minutes,
  true
FROM public.departments d
CROSS JOIN target_weeks tw
WHERE d.is_active = true
ON CONFLICT (department_id, week_start_date) DO NOTHING;
