import React from "react";
import Link from "next/link";

type Props = {
  onConfirm: () => void;
};

export function Step2ActionButtons({ onConfirm }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
      <Link
        href="/pages/book/step-1"
        className="order-2 rounded-lg border border-[#dee2e6] bg-white px-6 py-3 text-center font-semibold text-[#333333] hover:bg-[#f8f9fa] sm:order-1"
      >
        Back
      </Link>
      <button
        type="button"
        onClick={onConfirm}
        className="order-1 rounded-lg bg-[#007bff] px-6 py-3 text-center font-semibold text-white hover:bg-[#0069d9] sm:order-2"
      >
        Confirm Appointment
      </button>
    </div>
  );
}
