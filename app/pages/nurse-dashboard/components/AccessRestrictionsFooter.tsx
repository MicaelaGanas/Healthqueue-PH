"use client";

const restrictions = [
  "View hospital-wide reports",
  "Change system rules",
  "Override admin decisions",
  "Diagnose or prescribe medication",
];

export function AccessRestrictionsFooter() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 text-sm text-[#6C757D]">
      <span className="font-medium text-[#333333]">Access Restrictions:</span>
      {restrictions.map((r) => (
        <span key={r} className="inline-flex items-center gap-1">
          <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {r}
        </span>
      ))}
    </div>
  );
}
