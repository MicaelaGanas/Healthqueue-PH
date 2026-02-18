"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getLabItemsFromStorage,
  updateLabItemStatusInStorage,
  type LabItemSync,
  type LabStatus,
} from "../../../../lib/labSyncStorage";
import { LabSummaryCards } from "./LabSummaryCards";
import { LabFilters, type LabFiltersState } from "./LabFilters";
import { LabSpecimenTable } from "./LabSpecimenTable";

const DEFAULT_FILTERS: LabFiltersState = {
  search: "",
  status: "all",
  priority: "all",
};

/** "nurse" = collection workflow (Requested → Collected → Processing). "lab" = review/release (Processing → Ready → Released). */
type LabSpecimensContentProps = {
  mode: "nurse" | "lab";
};

export function LabSpecimensContent({ mode }: LabSpecimensContentProps) {
  const [items, setItems] = useState<LabItemSync[]>([]);
  const [filters, setFilters] = useState<LabFiltersState>(DEFAULT_FILTERS);

  useEffect(() => {
    setItems(getLabItemsFromStorage());
  }, []);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.sampleId.toLowerCase().includes(q) ||
          i.patientName.toLowerCase().includes(q) ||
          i.testName.toLowerCase().includes(q)
      );
    }
    if (filters.status !== "all") list = list.filter((i) => i.status === filters.status);
    if (filters.priority !== "all") list = list.filter((i) => i.priority === filters.priority);
    return list;
  }, [items, filters]);

  const handleUpdateStatus = (sampleId: string, status: LabStatus) => {
    updateLabItemStatusInStorage(sampleId, status);
    setItems(getLabItemsFromStorage());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Specimens</h2>
        <p className="mt-0.5 text-sm text-[#6C757D]">
          {mode === "nurse"
            ? "Manage specimen collection and send to processing."
            : "Review completed tests and release validated results."}
        </p>
      </div>

      <LabSummaryCards items={items} />

      <LabFilters filters={filters} onFiltersChange={setFilters} />

      <LabSpecimenTable
        items={filteredItems}
        onUpdateStatus={handleUpdateStatus}
        mode={mode}
      />
    </div>
  );
}
