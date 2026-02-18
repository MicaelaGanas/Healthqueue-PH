"use client";

import React from "react";

export type BookingType = "self" | "dependent";

/** DB values match booking_requests.relationship. "elder" maps to "other". */
export type RelationshipChoice = "child" | "parent" | "spouse" | "elder" | "other";

const RELATIONSHIP_OPTIONS: { value: RelationshipChoice; label: string }[] = [
  { value: "child", label: "My child" },
  { value: "parent", label: "My parent" },
  { value: "spouse", label: "My spouse" },
  { value: "elder", label: "Elder (e.g. grandparent)" },
  { value: "other", label: "Other" },
];

type Props = {
  value: BookingType;
  onChange: (v: BookingType) => void;
  /** When "dependent", who they are. Required to continue. */
  relationship?: RelationshipChoice | "";
  onRelationshipChange?: (v: RelationshipChoice | "") => void;
};

export function BookingTypeCard({ value, onChange, relationship = "", onRelationshipChange }: Props) {
  return (
    <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-[#333333]">Who is this appointment for?</h3>
      <p className="mt-1 text-sm text-[#6C757D]">
        For yourself or for someone else (e.g. your child or an elder).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            onChange("self");
            onRelationshipChange?.("");
          }}
          className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            value === "self"
              ? "border-[#007bff] bg-[#e7f1ff] text-[#007bff]"
              : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f8f9fa]"
          }`}
        >
          For myself
        </button>
        <button
          type="button"
          onClick={() => onChange("dependent")}
          className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            value === "dependent"
              ? "border-[#007bff] bg-[#e7f1ff] text-[#007bff]"
              : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f8f9fa]"
          }`}
        >
          For someone else (child, elder, etc.)
        </button>
      </div>

      {value === "dependent" && (
        <div className="mt-5 border-t border-[#e9ecef] pt-5">
          <p className="mb-2 text-sm font-medium text-[#333333]">Who is this person?</p>
          <p className="mb-3 text-xs text-[#6C757D]">Specify so we can record the correct relationship.</p>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onRelationshipChange?.(opt.value)}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  relationship === opt.value
                    ? "border-[#007bff] bg-[#e7f1ff] text-[#007bff]"
                    : "border-[#dee2e6] bg-white text-[#333333] hover:border-[#007bff] hover:bg-[#f8f9fa]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
