-- Link existing queue_items to patient_users via booking_requests
-- This fixes queue items that were created without patient_user_id populated

UPDATE queue_items qi
SET patient_user_id = br.patient_user_id
FROM booking_requests br
WHERE qi.booking_request_id = br.id
  AND qi.patient_user_id IS NULL
  AND br.patient_user_id IS NOT NULL;
