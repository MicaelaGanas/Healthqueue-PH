-- Replace o2_sat and resp_rate with weight and height in vital_signs table
alter table public.vital_signs
  drop column if exists o2_sat,
  drop column if exists resp_rate,
  add column if not exists weight int,
  add column if not exists height float(5,1);
