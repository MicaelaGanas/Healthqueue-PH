/** Supabase table row types (snake_case). API routes map these to app camelCase. */

export type DbQueueRow = {
  ticket: string;
  patient_name: string;
  department: string;
  priority: string;
  status: string;
  wait_time: string;
  source: "booked" | "walk-in";
  added_at: string | null;
  appointment_time: string | null;
  assigned_doctor: string | null;
  appointment_date: string | null;
  created_at?: string;
};

export type DbBookedEntry = {
  reference_no: string;
  patient_name: string;
  department: string;
  appointment_time: string;
  added_at: string;
  preferred_doctor: string | null;
  appointment_date: string | null;
  created_at?: string;
};

export type DbAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  employee_id: string;
  department: string | null;
  created_at: string;
};

export type DbAlert = {
  id: string;
  type: string;
  icon: string | null;
  detail: string;
  time: string | null;
  unread: boolean;
  created_at?: string;
};

export type DbPatientUser = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  number: string;
  address: string;
  email: string;
  created_at: string;
};

export type DbVitalSign = {
  id: string;
  ticket: string;
  patient_name: string;
  department: string;
  systolic: number | null;
  diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  o2_sat: number | null;
  resp_rate: number | null;
  severity: string | null;
  recorded_at: string;
  recorded_by: string | null;
  created_at?: string;
};

export type DbBookingRequest = {
  id: string;
  reference_no: string;
  patient_user_id: string;
  booking_type: "self" | "dependent";
  patient_first_name: string | null;
  patient_last_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  beneficiary_first_name: string | null;
  beneficiary_last_name: string | null;
  beneficiary_date_of_birth: string | null;
  beneficiary_gender: string | null;
  relationship: "child" | "parent" | "spouse" | "other" | null;
  department: string;
  preferred_doctor: string | null;
  requested_date: string;
  requested_time: string;
  notes: string | null;
  status: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};
