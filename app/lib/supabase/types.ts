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
