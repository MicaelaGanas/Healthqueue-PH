import React from "react";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { Footer } from "../../../components/Footer";
import { BackToHome } from "../components/BackToHome";
import { QueueInfoCards } from "../components/QueueInfoCards";
import { Instructions } from "../components/Instructions";
import { QueueStatusProgress } from "../components/QueueStatusProgress";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function QueueResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const queueNumber = params.q?.trim() ?? "";

  if (!queueNumber) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <BackToHome />
          <div className="mt-8 rounded-lg border border-[#dee2e6] bg-white p-8 text-center shadow-sm">
            <p className="text-[#333333]">Enter your queue number to check your status.</p>
            <Link href="/pages/queue" className="mt-4 inline-block text-[#007bff] hover:underline">
              Go to queue lookup →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <div className="mt-8">
          <QueueInfoCards
            queueNumber={queueNumber}
            assignedDepartment="—"
            estimatedWaitTime="—"
          />
        </div>

        <Instructions />
        <QueueStatusProgress currentStep="waiting" />
        <p className="mt-4 text-center text-sm text-[#6C757D]">
          Queue status will be loaded from the server when the backend is connected.
        </p>
      </main>

      <Footer />
    </div>
  );
}
