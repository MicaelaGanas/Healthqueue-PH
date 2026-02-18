-- Add department to admin_users so staff (nurse, doctor, receptionist) can be assigned to a department.
-- Nullable: admin and laboratory may have no department; doctor/nurse/receptionist get their queue by this.

alter table public.admin_users
  add column if not exists department text;

comment on column public.admin_users.department is 'Department/specialty this staff works in (e.g. OB-GYN, Pediatrics). Used to scope queue for nurse/doctor.';
