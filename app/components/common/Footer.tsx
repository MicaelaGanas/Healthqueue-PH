import Link from "next/link";
import { Logo } from "./Logo";

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#E9ECEF] bg-white text-[#6C757D]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo variant="footer" />
            <p className="mt-3 text-sm text-[#333333]">
              Smart queue management for public hospitals in the Philippines.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#333333]">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/pages/queue" className="hover:text-[#333333]">Check Queue</Link>
              </li>
              <li>
                <Link href="#book-appointment" className="hover:text-[#333333]">Book Appointment</Link>
              </li>
              <li>
                <Link href="#about" className="hover:text-[#333333]">About Us</Link>
              </li>
              <li>
                <Link href="/patient-login" className="hover:text-[#333333]">Patient Login</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#333333]">Hospital Staff</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/staff-login" className="hover:text-[#333333]">Staff Login</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#333333]">Dashboard</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#333333]">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-[#333333]">
                <PhoneIcon className="h-4 w-4 text-[#007bff]" />
                (02) 8911-1111
              </li>
              <li className="flex items-center gap-2 text-[#333333]">
                <MailIcon className="h-4 w-4 text-[#007bff]" />
                support@healthqueue.ph
              </li>
              <li className="flex items-center gap-2 text-[#333333]">
                <LocationIcon className="h-4 w-4 text-[#007bff]" />
                Manila, Philippines
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[#E9ECEF] pt-6 text-center text-sm text-[#6C757D]">
          © 2026 HealthQueue PH. All rights reserved. | SDG 3: Good Health and Well-being
        </div>
      </div>
    </footer>
  );
}
