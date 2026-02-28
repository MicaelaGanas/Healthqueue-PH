ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS consultation_started_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS consultation_completed_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_queue_items_consultation_started_at
  ON public.queue_items (consultation_started_at);

CREATE INDEX IF NOT EXISTS idx_queue_items_consultation_completed_at
  ON public.queue_items (consultation_completed_at);

CREATE INDEX IF NOT EXISTS idx_queue_items_eta_lookup
  ON public.queue_items (department_id, assigned_doctor_id, status, consultation_completed_at DESC);

COMMENT ON COLUMN public.queue_items.consultation_started_at IS
  'Timestamp when consultation starts (status enters in_consultation).';

COMMENT ON COLUMN public.queue_items.consultation_completed_at IS
  'Timestamp when consultation completes (status enters completed).';
