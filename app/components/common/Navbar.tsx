"use client";

import Link from "next/link";
import { Logo } from "./Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E9ECEF] bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          <Link href="#check-queue" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
            Check Queue
          </Link>
          <Link href="#book-appointment" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
            Book Appointment
          </Link>
          <Link href="#about" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/patient-login"
            className="rounded-lg border border-[#CCCCCC] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5]"
          >
            Patient Login
          </Link>
          <Link
            href="/staff-login"
            className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9]"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </header>
  );
}
