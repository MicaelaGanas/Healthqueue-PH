import React from "react";
import Link from "next/link";

export function ConfirmationActions() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        href="/"
        className="w-full rounded-lg border-2 border-[#007bff] bg-white px-6 py-3 text-center font-semibold text-[#007bff] hover:bg-[#f8f9fa] sm:w-auto"
      >
        Back to Home
      </Link>
      <Link
        href="/pages/queue"
        className="w-full rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-6 py-3 text-center font-semibold text-[#333333] hover:bg-[#e9ecef] sm:w-auto"
      >
        Check Queue Status
      </Link>
    </div>
  );
}
