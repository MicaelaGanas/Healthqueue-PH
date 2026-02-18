"use client";

import Link from "next/link";
import { LabSpecimensContent } from "./specimens";

type StaffRole = "nurse" | "doctor";

type LaboratoryAdminContentProps = {
  role: StaffRole;
};

export function LaboratoryAdminContent({ role }: LaboratoryAdminContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#333333]">Laboratory Admin</h2>
          <p className="mt-0.5 text-sm text-[#6C757D]">
            {role === "nurse"
              ? "Manage specimen collection and send requests to processing."
              : "Review completed tests and release validated laboratory results."}
          </p>
        </div>
        <Link
          href="/pages/laboratory-dashboard"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#007bff] bg-white px-4 py-2.5 text-sm font-medium text-[#007bff] hover:bg-[#E0EDFF]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Laboratory Dashboard
        </Link>
      </div>

      <LabSpecimensContent mode={role === "nurse" ? "nurse" : "lab"} />
    </div>
  );
}
