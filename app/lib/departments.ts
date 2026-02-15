/**
 * Doctor / specialty options used for queue management, booking, and walk-in.
 * Each item is a department or specialty (e.g. OB-GYN, Cardiology).
 */
export const DEPARTMENTS = [
  "OB-GYN",
  "Cardiology",
  "General Medicine",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "Pulmonology",
  "Gastroenterology",
  "Dental",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Doctors per specialty (for booking "Prefer doctor" dropdown). Replace with API when backend has departments/doctors. */
export const DOCTORS_BY_DEPARTMENT: Record<string, string[]> = {
  "OB-GYN": ["Dr. Ana Reyes - OB-GYN", "Dr. Sofia Lim - OB-GYN"],
  "Cardiology": ["Dr. Ricardo Tan - Cardiology", "Dr. Carmen Lopez - Cardiology"],
  "General Medicine": ["Dr. Maria Santos - General Medicine", "Dr. Carlos Gomez - Internal Medicine"],
  "Pediatrics": ["Dr. Juan Dela Cruz - Pediatrics", "Dr. Liza Mendoza - Pediatrics"],
  "Orthopedics": ["Dr. Miguel Torres - Orthopedics"],
  "Dermatology": ["Dr. Elena Cruz - Dermatology"],
  "Pulmonology": ["Dr. Jose Ramos - Pulmonology"],
  "Gastroenterology": ["Dr. Patricia Ong - Gastroenterology"],
  "Dental": ["Dr. Elena Torres - Dental"],
};
