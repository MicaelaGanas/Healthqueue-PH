/**
 * Doctors per specialty (for queue "doctor on duty" and booking "Prefer doctor").
 * Departments themselves come from the database (GET /api/departments); this map is still static until a doctors table exists.
 */
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
