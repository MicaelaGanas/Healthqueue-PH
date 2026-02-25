"use client";

import { useMemo, useState } from "react";

export type DirectoryDepartment = {
  id: string;
  name: string;
  location: string;
};

type PinPosition = {
  left: string;
  top: string;
};

const LOCATION_PIN_BY_DEPARTMENT: Record<string, PinPosition> = {
  "General Medicine": { left: "20%", top: "30%" },
  Pediatrics: { left: "35%", top: "40%" },
  "OB-GYN": { left: "52%", top: "28%" },
  Cardiology: { left: "70%", top: "32%" },
  Orthopedics: { left: "62%", top: "56%" },
  Dermatology: { left: "43%", top: "60%" },
  Pulmonology: { left: "78%", top: "48%" },
  Gastroenterology: { left: "26%", top: "62%" },
  Dental: { left: "15%", top: "50%" },
};

function getFallbackPin(index: number): PinPosition {
  const left = 15 + (index % 5) * 16;
  const top = 24 + Math.floor(index / 5) * 18;
  return { left: `${left}%`, top: `${top}%` };
}

export function DirectoryExplorer({ departments }: { departments: DirectoryDepartment[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(departments[0]?.id ?? null);
  const [floorFilter, setFloorFilter] = useState<"all" | "ground" | "2nd" | "3rd">("all");

  const floorOptions = useMemo(() => {
    const hasGround = departments.some((department) => /ground floor/i.test(department.location));
    const has2nd = departments.some((department) => /2nd floor/i.test(department.location));
    const has3rd = departments.some((department) => /3rd floor/i.test(department.location));
    return {
      hasGround,
      has2nd,
      has3rd,
    };
  }, [departments]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return departments.filter((department) => {
      if (floorFilter === "ground" && !/ground floor/i.test(department.location)) return false;
      if (floorFilter === "2nd" && !/2nd floor/i.test(department.location)) return false;
      if (floorFilter === "3rd" && !/3rd floor/i.test(department.location)) return false;
      if (!keyword) return true;
      const haystack = `${department.name} ${department.location}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [departments, query, floorFilter]);

  const selected = filtered.find((department) => department.id === selectedId) ?? filtered[0] ?? null;

  const visibleDepartments = filtered.slice(0, 20);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-[#E9ECEF] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[#333333]">Departments & locations</h2>
        <p className="mt-1 text-sm text-[#6C757D]">Search and tap a department to highlight it on the map.</p>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search department or location"
          className="mt-4 w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFloorFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${floorFilter === "all" ? "border-[#007bff] bg-[#e7f1ff] text-[#0056b3]" : "border-[#DEE2E6] bg-white text-[#495057]"}`}
          >
            All floors
          </button>
          {floorOptions.hasGround && (
            <button
              type="button"
              onClick={() => setFloorFilter("ground")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${floorFilter === "ground" ? "border-[#007bff] bg-[#e7f1ff] text-[#0056b3]" : "border-[#DEE2E6] bg-white text-[#495057]"}`}
            >
              Ground Floor
            </button>
          )}
          {floorOptions.has2nd && (
            <button
              type="button"
              onClick={() => setFloorFilter("2nd")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${floorFilter === "2nd" ? "border-[#007bff] bg-[#e7f1ff] text-[#0056b3]" : "border-[#DEE2E6] bg-white text-[#495057]"}`}
            >
              2nd Floor
            </button>
          )}
          {floorOptions.has3rd && (
            <button
              type="button"
              onClick={() => setFloorFilter("3rd")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${floorFilter === "3rd" ? "border-[#007bff] bg-[#e7f1ff] text-[#0056b3]" : "border-[#DEE2E6] bg-white text-[#495057]"}`}
            >
              3rd Floor
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-[#E9ECEF] bg-[#f8f9fa] p-3 text-sm text-[#6C757D]">
              No departments found.
            </div>
          ) : (
            filtered.map((department) => {
              const active = selected?.id === department.id;
              return (
                <button
                  type="button"
                  key={department.id}
                  onClick={() => setSelectedId(department.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all duration-200 ${
                    active
                      ? "border-[#007bff] bg-[#e7f1ff] shadow-sm"
                      : "border-[#E9ECEF] bg-white hover:bg-[#f8f9fa] hover:shadow-sm"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#333333]">{department.name}</p>
                  <p className="mt-1 text-xs text-[#6C757D]">{department.location}</p>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#E9ECEF] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#333333]">Facility map</h2>
            <p className="mt-1 text-sm text-[#6C757D]">Tap any pin to view department location details.</p>
          </div>
          {selected && (
            <div className="rounded-lg border border-[#E9ECEF] bg-[#f8f9fa] px-3 py-2 text-right">
              <p className="text-xs text-[#6C757D]">Selected</p>
              <p className="text-sm font-medium text-[#333333]">{selected.name}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E9ECEF] bg-[#f8f9fa] px-3 py-2 text-xs text-[#6C757D]">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#007bff]" />
            Department pin
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#28a745]" />
            Main entrance
          </span>
        </div>

        <div className="relative mt-4 h-[420px] rounded-xl border border-[#DDE2E6] bg-gradient-to-b from-[#fdfefe] to-[#eef3f8] overflow-hidden">
          <div className="absolute left-[8%] top-[12%] h-[18%] w-[30%] rounded-md border border-[#D1D9E0] bg-white/80" />
          <div className="absolute left-[46%] top-[10%] h-[20%] w-[24%] rounded-md border border-[#D1D9E0] bg-white/80" />
          <div className="absolute left-[20%] top-[42%] h-[18%] w-[26%] rounded-md border border-[#D1D9E0] bg-white/80" />
          <div className="absolute left-[56%] top-[44%] h-[24%] w-[32%] rounded-md border border-[#D1D9E0] bg-white/80" />
          <div className="absolute left-[10%] top-[82%] inline-flex items-center gap-1 rounded-full border border-[#28a745]/40 bg-white px-2 py-1 text-[11px] font-medium text-[#2f6f3e]">
            <span className="h-2 w-2 rounded-full bg-[#28a745]" />
            Main Entrance
          </div>

          {visibleDepartments.map((department, index) => {
            const pin = LOCATION_PIN_BY_DEPARTMENT[department.name] ?? getFallbackPin(index);
            const active = selected?.id === department.id;
            return (
              <button
                type="button"
                key={department.id}
                onClick={() => setSelectedId(department.id)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pin.left, top: pin.top }}
                aria-label={`Select ${department.name}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm transition-all duration-200 ${
                    active
                      ? "border-[#007bff] bg-[#007bff] text-white scale-110 ring-4 ring-[#007bff]/20"
                      : "border-[#DEE2E6] bg-white text-[#495057] group-hover:scale-105 group-hover:border-[#007bff]/60"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className="pointer-events-none absolute left-1/2 top-0 z-20 min-w-max -translate-x-1/2 -translate-y-[120%] rounded-md border border-[#007bff]/20 bg-white px-2 py-1 text-[11px] font-medium text-[#1f2937] opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-[130%] group-focus-visible:opacity-100"
                >
                  {department.name}
                  <span className="ml-1 text-[#6C757D]">• {department.location}</span>
                </span>
              </button>
            );
          })}

          {selected && (() => {
            const selectedIndex = visibleDepartments.findIndex((department) => department.id === selected.id);
            const selectedPin =
              selectedIndex >= 0
                ? LOCATION_PIN_BY_DEPARTMENT[selected.name] ?? getFallbackPin(selectedIndex)
                : LOCATION_PIN_BY_DEPARTMENT[selected.name] ?? getFallbackPin(0);
            return (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full transition-all duration-300"
                style={{ left: selectedPin.left, top: selectedPin.top }}
              >
                <div className="mb-2 whitespace-nowrap rounded-md border border-[#007bff]/30 bg-white px-2 py-1 text-[11px] font-semibold text-[#1f2937] shadow-sm animate-pulse">
                  {selected.name}
                </div>
              </div>
            );
          })()}

          <div className="absolute left-[4%] top-[4%] rounded-md border border-[#E9ECEF] bg-white/90 px-2 py-1 text-[11px] text-[#6C757D]">
            Waiting Area A
          </div>
          <div className="absolute left-[74%] top-[6%] rounded-md border border-[#E9ECEF] bg-white/90 px-2 py-1 text-[11px] text-[#6C757D]">
            Waiting Area B
          </div>
          <div className="absolute left-[6%] top-[68%] rounded-md border border-[#E9ECEF] bg-white/90 px-2 py-1 text-[11px] text-[#6C757D]">
            Waiting Area C
          </div>
        </div>

        {selected && (
          <div className="mt-3 rounded-lg border border-[#E9ECEF] bg-white p-3">
            <p className="text-xs text-[#6C757D]">Location details</p>
            <p className="mt-1 text-sm font-semibold text-[#333333]">{selected.name}</p>
            <p className="mt-1 text-sm text-[#6C757D]">{selected.location}</p>
            <p className="mt-2 text-xs text-[#6C757D]">Follow corridor signs from the Main Entrance to reach this clinic.</p>
          </div>
        )}

      </section>
    </div>
  );
}