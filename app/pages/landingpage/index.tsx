import React from "react";
import { Navbar } from "../../components/common/Navbar";
import { Footer } from "../../components/common/Footer";
import { HeroBanner } from "./components/HeroBanner";
import { FeatureCards } from "./components/FeatureCards";
import { LiveQueue } from "./components/LiveQueue";
import { Announcements } from "./components/Announcements";
import { QuickHelp } from "./components/QuickHelp";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Navbar />

      <main>
        <HeroBanner />
        <FeatureCards />
        <LiveQueue />
        <Announcements />
        <QuickHelp />
      </main>

      <Footer />
    </div>
  );
}
