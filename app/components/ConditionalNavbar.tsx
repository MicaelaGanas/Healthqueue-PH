"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

/** Paths where the Navbar is hidden (admin and staff dashboards). */
const HIDE_NAVBAR_PATHS = [
  "/pages/admin-dashboard",
  "/pages/nurse-dashboard",
  "/pages/doctor-dashboard",
  "/pages/laboratory-dashboard",
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
