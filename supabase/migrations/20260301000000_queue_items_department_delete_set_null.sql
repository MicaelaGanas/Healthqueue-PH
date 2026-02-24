-- Allow deleting departments: queue_items.department_id currently uses ON DELETE RESTRICT,
-- so deleting a department failed when any queue item referenced it. Switch to SET NULL
-- so those queue items stay but lose the department reference (app shows "General Medicine" when null).

ALTER TABLE public.queue_items
  DROP CONSTRAINT IF EXISTS queue_items_department_id_fkey;

ALTER TABLE public.queue_items
  ALTER COLUMN department_id DROP NOT NULL;

ALTER TABLE public.queue_items
  ADD CONSTRAINT queue_items_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
