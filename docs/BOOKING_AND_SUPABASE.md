# Booking management & Supabase

This guide describes the booking flow and the tables you need so that:
- Patients submit **booking requests** (for themselves or for a dependent: child, elder, etc.).
- Requests stay **pending** until a doctor/staff confirms.
- After confirmation you can use the booking info and add the patient to the queue.

---

## Tables overview

| Table | Purpose |
|-------|--------|
| **booking_requests** (new) | All requests from patients. Status: `pending` → wait for confirmation; `confirmed` / `rejected` / `cancelled`. Supports "for self" vs "for another" (dependent). |
| **booked_queue** (existing) | Confirmed bookings that are in the system for the nurse (ready for queue). You can keep using it when a request is **confirmed** by inserting a row here (or into queue). |
| **queue_rows** (existing) | Live queue (in progress, completed, etc.). Nurse/doctor dashboards use this (and/or sync from booked_queue). |
| **patient_users** (existing) | Patient accounts. For "booking for self", the patient’s details come from here. |

You do **not** need to change `booked_queue` or `queue_rows` for the new flow. When a **booking_request** is set to `confirmed`, your app can build one row (patient name, department, time, etc.) and insert it into `booked_queue` (and/or whatever you use to feed the queue).

---

## New table: `booking_requests`

Created by migration: `supabase/migrations/20260219000000_add_booking_requests.sql`.

### Columns

- **reference_no** – Unique reference for the request (e.g. `APT-20260219-ABC`). Patient and staff use this to look up the booking.
- **patient_user_id** – Who made the booking (FK to `patient_users`). Must be a logged-in patient.
- **booking_type** – `'self'` or `'dependent'`.
  - **self** – Appointment is for the account holder. Patient name/DOB/gender come from `patient_users` when you confirm and add to queue.
  - **dependent** – Appointment is for someone else (e.g. child, elder). Use the beneficiary columns.
- **Beneficiary (only for `booking_type = 'dependent'`)**  
  - beneficiary_first_name, beneficiary_last_name  
  - beneficiary_date_of_birth, beneficiary_gender  
  - relationship: `'child' | 'parent' | 'spouse' | 'other'`
- **Appointment**  
  - department, preferred_doctor (optional)  
  - requested_date, requested_time  
  - notes (optional)
- **Status**  
  - `pending` – default; waiting for staff/doctor.  
  - `confirmed` – approved; app can then add to `booked_queue` / queue.  
  - `rejected` – declined (optional: set rejection_reason).  
  - `cancelled` – cancelled by patient or staff.
- **Confirmation**  
  - confirmed_at, confirmed_by (FK to admin_users), rejection_reason  

Constraints and indexes are in the migration (e.g. unique `reference_no`, indexes on `patient_user_id`, `status`, `requested_date`).

---

## Flow summary

1. **Patient books (for self or dependent)**  
   - If **self**: submit with `booking_type = 'self'`; no beneficiary fields.  
   - If **dependent**: submit with `booking_type = 'dependent'` and beneficiary_* + relationship.  
   - Insert into `booking_requests` with `status = 'pending'`.

2. **Staff/doctor sees pending requests**  
   - Query `booking_requests` where `status = 'pending'` (e.g. in booking management or nurse dashboard).  
   - Show full info: for self use `patient_users`; for dependent use beneficiary_*.

3. **Confirm**  
   - Set `status = 'confirmed'`, set `confirmed_at`, `confirmed_by`.  
   - Then in your app: build one row (patient name = from patient_users for self, or beneficiary name for dependent; department, requested_date, requested_time, preferred_doctor) and insert into `booked_queue` (and/or your queue table). So the nurse can see it and add to the live queue as you do today.

4. **Reject**  
   - Set `status = 'rejected'`, optionally set `rejection_reason`.  
   - No row is added to `booked_queue` or queue.

5. **Patient sees their bookings**  
   - Query `booking_requests` where `patient_user_id = current_user_id` (and optionally filter by status).  
   - You can “revive” and show all details from this table (and from `patient_users` when booking_type is self).

---

## What to run in Supabase

1. Run the new migration in the Supabase SQL Editor (or via CLI):
   - File: `supabase/migrations/20260219000000_add_booking_requests.sql`
2. No need to **alter** `booked_queue` or `queue_rows` unless you want an optional FK from `booked_queue` back to `booking_requests` (e.g. `booking_request_id uuid references booking_requests(id)`). That’s optional for traceability.

---

## Optional: link `booked_queue` to a request

If you want each confirmed booking to point back to the request:

```sql
alter table public.booked_queue
  add column if not exists booking_request_id uuid references public.booking_requests(id) on delete set null;
create index if not exists idx_booked_queue_booking_request_id on public.booked_queue (booking_request_id);
```

Then when you insert into `booked_queue` after confirming, set `booking_request_id` to the `booking_requests.id`. This is optional; the flow above works without it.

---

## Next steps in the app

- **Patient booking UI**  
  - Add step or toggle: “Booking for yourself” vs “Booking for someone else (e.g. child, elder)”.  
  - For “someone else”, collect beneficiary first/last name, DOB, gender, relationship.  
  - Submit to a new API that inserts into `booking_requests` (not directly into `booked_queue`).

- **API**  
  - `POST /api/booking-requests` – create request (patient_user_id from auth, body: booking_type, beneficiary_* if dependent, department, preferred_doctor, requested_date, requested_time, notes).  
  - `GET /api/booking-requests` – list for current patient (by patient_user_id) or for staff (all or by status).  
  - `PATCH /api/booking-requests/[id]` – staff only: set status to confirmed/rejected/cancelled, set confirmed_at, confirmed_by, rejection_reason.  
  - On confirm: in the same handler or a small service, insert the corresponding row into `booked_queue` (and optionally set `booking_request_id` if you added that column).

- **Booking management (staff)**  
  - Page or section that lists `booking_requests` with `status = 'pending'`, shows full details (self vs dependent), and has Confirm / Reject actions that call the PATCH API and, on confirm, add to `booked_queue`.

Once this is in place, you have “revived” booking information in `booking_requests` and can show it to both patient and staff, and only add to the queue after doctor confirmation.
