import React from "react";
import { Navbar } from "../../components/common/Navbar";
import { Footer } from "../../components/common/Footer";
import { BackToHome } from "./components/BackToHome";
import { FindYourQueue } from "./components/FindYourQueue";
import { LiveQueueStatusSection } from "./components/LiveQueueStatusSection";

export default function CheckQueueStatusPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <BackToHome />

        <h1 className="mt-6 text-3xl font-bold text-[#333333]">Check Queue Status</h1>
        <p className="mt-2 text-[#6C757D]">
          Enter your queue number or view live wait times by department
        </p>

        <FindYourQueue />
        <LiveQueueStatusSection />
      </main>

      <Footer />
    </div>
  );
}
