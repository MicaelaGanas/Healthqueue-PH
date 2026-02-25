import React from "react";
import Link from "next/link";
import { Footer } from "../../../components/Footer";
import { BackToHome } from "../components/BackToHome";
import { QueueInfoCards } from "../components/QueueInfoCards";
import { Instructions } from "../components/Instructions";
import { QueueStatusProgress } from "../components/QueueStatusProgress";
import { getSupabaseServer } from "../../../lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function QueueResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const queueNumber = params.q?.trim() ?? "";

  if (!queueNumber) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
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

  // Fetch actual queue data from Supabase
  const supabase = getSupabaseServer();
  let queueData = null;
  let departmentName = "—";
  let waitTime = "—";
  let currentStep: "waiting" | "almost" | "proceed" = "waiting";

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("queue_items")
        .select(`
          *,
          departments (
            name
          )
        `)
        .eq("ticket", queueNumber)
        .single();

    if (data && !error) {
      queueData = data;
      departmentName = data.departments?.name || "—";
      waitTime = data.wait_time || "—";
      
      // Map status to progress step
      if (data.status === "in_consultation" || data.status === "scheduled") {
        currentStep = "proceed";
      } else if (data.status === "waiting") {
        // Could add logic here to check position in queue
        currentStep = "waiting";
      } else {
        currentStep = "waiting";
      }
    }
  } catch (err) {
    console.error("Error fetching queue data:", err);
  }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <BackToHome />

        <div className="mt-8">
          <QueueInfoCards
            queueNumber={queueNumber}
            assignedDepartment={departmentName}
            estimatedWaitTime={waitTime}
          />
        </div>

        <Instructions />
        <QueueStatusProgress currentStep={currentStep} />
        
        {!queueData && (
          <p className="mt-4 text-center text-sm text-[#e53e3e]">
            Queue number not found. Please check your number and try again.
          </p>
        )}
        
        {queueData && (
          <p className="mt-4 text-center text-sm text-[#22c55e]">
            ✓ Queue information loaded successfully
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
