
import React from "react";
import { Footer } from "../../components/Footer";
import { HeroBanner } from "./components/HeroBanner";
import { FeatureCards } from "./components/FeatureCards";
import { LiveQueue } from "./components/LiveQueue";
import { Announcements } from "./components/Announcements";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <main>
        <HeroBanner />
        <FeatureCards />
        <LiveQueue />
        <Announcements />
      </main>

      <Footer />
    </div>
  );
}
