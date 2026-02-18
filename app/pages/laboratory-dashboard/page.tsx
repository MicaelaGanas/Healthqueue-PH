"use client";

import { useState } from "react";
import { AuthGuard } from "../../components/AuthGuard";
import { LabSidebar, type LabTabId } from "./components/layout/LabSidebar";
import { LabHeader } from "./components/layout/LabHeader";
import { LabSpecimensContent } from "./components/specimens";
import { SettingsContent } from "../nurse-dashboard/components/settings/SettingsContent";

export default function LaboratoryDashboardPage() {
  const [activeTab, setActiveTab] = useState<LabTabId>("specimens");

  return (
    <AuthGuard allowedRoles={["nurse", "admin", "laboratory"]}>
      <div className="flex h-screen min-h-0 overflow-hidden bg-[#f8f9fa]">
        <LabSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
        <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
          <LabHeader />
          <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
            <div className="w-full min-w-0 max-w-[1920px]">
              <h2 className="text-lg font-bold text-[#333333] sm:text-xl">
                Laboratory Dashboard
              </h2>
              <p className="mt-0.5 text-xs text-[#6C757D] sm:mt-1 sm:text-sm">
                Manage specimens, processing, and release results
              </p>

              {activeTab === "specimens" && (
                <div className="mt-4 sm:mt-6">
                  <LabSpecimensContent mode="lab" />
                </div>
              )}

              {activeTab === "settings" && (
                <div className="mt-4 sm:mt-6">
                  <SettingsContent />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
