CREATE TABLE IF NOT EXISTS public.patient_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL REFERENCES public.patient_users(id) ON DELETE CASCADE,
  booking_request_id uuid NULL REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_notifications_patient_user_id
  ON public.patient_notifications (patient_user_id);

CREATE INDEX IF NOT EXISTS idx_patient_notifications_created_at
  ON public.patient_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_notifications_booking_request_id
  ON public.patient_notifications (booking_request_id);

ALTER TABLE public.patient_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for patient_notifications" ON public.patient_notifications;
CREATE POLICY "Allow all for patient_notifications"
  ON public.patient_notifications FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.patient_notifications IS 'Patient-facing account notifications for booking status and appointment updates.';