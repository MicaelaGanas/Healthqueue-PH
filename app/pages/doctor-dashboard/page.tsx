"use client";

import { useState } from "react";
import { DoctorSidebar } from "./components/layout/DoctorSidebar";
import { DoctorHeader } from "./components/layout/DoctorHeader";
import { DoctorConsultationContent } from "./components/consultation";
import { SettingsContent } from "../nurse-dashboard/components/settings/SettingsContent";
import type { DoctorTabId } from "./components/layout/DoctorSidebar";

export default function DoctorDashboardPage() {
  const [activeTab, setActiveTab] = useState<DoctorTabId>("consultation");

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[#f8f9fa]">
      <DoctorSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
        <DoctorHeader />
        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full min-w-0 max-w-[1920px]">
            {activeTab === "consultation" && (
              <DoctorConsultationContent />
            )}
            {activeTab === "settings" && (
              <SettingsContent />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
