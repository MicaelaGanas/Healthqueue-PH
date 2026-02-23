import type { Metadata } from "next";
import { Geist, Geist_Mono, Rosario } from "next/font/google";
import "./globals.css";
import { ConditionalNavbar } from "./components/ConditionalNavbar";
import { ScrollToTopOnLoad } from "./components/ScrollToTopOnLoad";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rosario = Rosario({
  variable: "--font-rosario",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HealthQueue PH | Public Hospital Queue Management System",
  description: "Smart queue management for public hospitals in the Philippines. Check queue, book appointments, and view wait times.",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rosario.variable} antialiased`}
        suppressHydrationWarning
      >
        <ScrollToTopOnLoad />
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  );
}
