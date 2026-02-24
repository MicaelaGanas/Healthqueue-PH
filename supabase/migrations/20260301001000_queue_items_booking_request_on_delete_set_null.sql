-- Fix existing FK behavior for queue_items.booking_request_id.
-- Some databases were created before 20260229000000_normalized_schema.sql, and because that migration
-- uses CREATE TABLE IF NOT EXISTS, an older FK could remain as NO ACTION/RESTRICT.
-- This migration force-recreates the FK with ON DELETE SET NULL so booking_requests can be deleted.

ALTER TABLE public.queue_items
  DROP CONSTRAINT IF EXISTS queue_items_booking_request_id_fkey;

ALTER TABLE public.queue_items
  ADD CONSTRAINT queue_items_booking_request_id_fkey
  FOREIGN KEY (booking_request_id) REFERENCES public.booking_requests(id) ON DELETE SET NULL;

