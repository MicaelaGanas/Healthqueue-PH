/**
 * Laboratory specimens: shared state across nurse, doctor, and laboratory dashboards.
 * Uses localStorage for persistence until backend is connected.
 */

export type LabStatus =
  | "Requested"
  | "Collected"
  | "Processing"
  | "Ready for Review"
  | "Released";

export type LabPriority = "normal" | "urgent";

export type LabItemSync = {
  sampleId: string;
  patientName: string;
  testName: string;
  requestedBy: string;
  priority: LabPriority;
  status: LabStatus;
};

const LAB_ITEMS_STORAGE_KEY = "healthqueue_lab_items";

const DEFAULT_ITEMS: LabItemSync[] = [
  { sampleId: "LAB-2401", patientName: "Maria Santos", testName: "CBC", requestedBy: "Dr. Gonzales", priority: "normal", status: "Requested" },
  { sampleId: "LAB-2402", patientName: "Juan Dela Cruz", testName: "Urinalysis", requestedBy: "Dr. Reyes", priority: "urgent", status: "Collected" },
  { sampleId: "LAB-2403", patientName: "Liza Bautista", testName: "Blood Chemistry", requestedBy: "Dr. Fernandez", priority: "normal", status: "Processing" },
  { sampleId: "LAB-2404", patientName: "Noel Ramirez", testName: "Lipid Profile", requestedBy: "Dr. Lim", priority: "normal", status: "Ready for Review" },
];

export function getLabItemsFromStorage(): LabItemSync[] {
  if (typeof window === "undefined") return DEFAULT_ITEMS;
  try {
    const raw = localStorage.getItem(LAB_ITEMS_STORAGE_KEY);
    if (!raw) return DEFAULT_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ITEMS;
  } catch {
    return DEFAULT_ITEMS;
  }
}

export function setLabItemsInStorage(items: LabItemSync[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAB_ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function updateLabItemStatusInStorage(sampleId: string, status: LabStatus): void {
  const items = getLabItemsFromStorage();
  const idx = items.findIndex((r) => r.sampleId === sampleId);
  if (idx === -1) return;
  const next = [...items];
  next[idx] = { ...next[idx], status };
  setLabItemsInStorage(next);
}
