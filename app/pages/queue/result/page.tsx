import React from "react";
import { Navbar } from "../../../components/Navbar";
import { Footer } from "../../../components/Footer";
import { BackToHome } from "../components/BackToHome";
import { QueueInfoCards } from "../components/QueueInfoCards";
import { Instructions } from "../components/Instructions";
import { QueueStatusProgress } from "../components/QueueStatusProgress";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

/** Dummy result for any searched queue number */
const dummyResult = {
  queueNumber: "T1265",
  assignedDepartment: "Radiology",
  estimatedWaitTime: "2 hrs 45 mins",
  status: "waiting" as const,
};

export default async function QueueResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const queueNumber = params.q?.trim() || dummyResult.queueNumber;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <div className="mt-8">
          <QueueInfoCards
            queueNumber={queueNumber}
            assignedDepartment={dummyResult.assignedDepartment}
            estimatedWaitTime={dummyResult.estimatedWaitTime}
          />
        </div>

        <Instructions />
        <QueueStatusProgress currentStep={dummyResult.status} />
      </main>

      <Footer />
    </div>
  );
}
