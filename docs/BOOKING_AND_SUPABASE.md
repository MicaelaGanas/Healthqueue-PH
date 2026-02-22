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
| **queue_rows** (existing) | **Single source of truth** for the live queue. Nurse/doctor dashboards use this. Confirmed bookings are added here with `source = 'booked'` and `ticket = reference_no`. Walk-ins use `source = 'walk-in'`. |
| **patient_users** (existing) | Patient accounts. For "booking for self", the patient’s details come from here. |

**Note:** The app no longer writes to `booked_queue`. When a **booking_request** is set to `confirmed`, the app inserts one row into **queue_rows** only (with `source = 'booked'`). The `booked_queue` table is legacy and can be deprecated or dropped in a future migration if desired.

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
  - `confirmed` – approved; app adds one row to `queue_rows` with `source = 'booked'`.  
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
   - The app inserts one row into `queue_rows` (patient name, department, requested_date/time, preferred_doctor as `assigned_doctor`, `source = 'booked'`, `ticket = reference_no`). The nurse sees it in the live queue.

4. **Reject**  
   - Set `status = 'rejected'`, optionally set `rejection_reason`.  
   - No row is added to the queue.

5. **Patient sees their bookings**  
   - Query `booking_requests` where `patient_user_id = current_user_id` (and optionally filter by status).  
   - You can “revive” and show all details from this table (and from `patient_users` when booking_type is self).

---

## What to run in Supabase

1. Run the new migration in the Supabase SQL Editor (or via CLI):
   - File: `supabase/migrations/20260219000000_add_booking_requests.sql`
2. The app uses **queue_rows** only for the queue; no changes to that table are required for the booking flow. That’s 
---

## Next steps in the app

- **Patient booking UI**  
  - Add step or toggle: “Booking for yourself” vs “Booking for someone else (e.g. child, elder)”.  
  - For “someone else”, collect beneficiary first/last name, DOB, gender, relationship.  
  - Submit to a new API that inserts into `booking_requests` (not directly into `booked_queue`).

- **API**  
  - `POST /api/booking-requests` – create request (patient_user_id from auth, body: booking_type, beneficiary_* if dependent, department, preferred_doctor, requested_date, requested_time, notes).  
  - `GET /api/booking-requests` – list for current patient (by patient_user_id) or for staff (all or by status).  
  - `PATCH /api/booking-requests/[id]` – staff only: set status to confirmed/rejected/cancelled, set confirmed_at, confirmed_by, rejection_reason. On confirm, the handler inserts one row into `queue_rows` with `source = 'booked'`.

- **Booking management (staff)**  
  - Page or section that lists `booking_requests` with `status = 'pending'`, shows full details (self vs dependent), and has Confirm / Reject actions that call the PATCH API and, on confirm, add the patient to the queue (`queue_rows`).

Once this is in place, you have “revived” booking information in `booking_requests` and can show it to both patient and staff, and only add to the queue after doctor confirmation.
