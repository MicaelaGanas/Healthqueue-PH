"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

/** Paths where the Navbar is hidden (auth pages and dashboards). */
const HIDE_NAVBAR_PATHS = [
  "/pages/admin-dashboard",
  "/pages/nurse-dashboard",
  "/pages/doctor-dashboard",
  "/pages/queue-display",
  "/pages/patient-signup",
  "/pages/patient-login",
  "/pages/employee-login",
];

export function ConditionalNavbar() {
  const pathname = usePathname();
  const hide =
    pathname &&
    HIDE_NAVBAR_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  if (hide) return null;
  return <Navbar />;
}
