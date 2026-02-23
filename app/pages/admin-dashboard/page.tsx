"use client";

import { useState } from "react";
import { AuthGuard } from "../../components/AuthGuard";
import { AdminSidebar, type AdminTabId } from "./components/layout/AdminSidebar";
import { AdminHeader } from "./components/layout/AdminHeader";
import { AdminOverviewContent } from "./components/overview/AdminOverviewContent";
import { UsersManagement } from "./components/users/UsersManagement";
import { ReportsContent } from "./components/reports/ReportsContent";
import { RecordsContent } from "./components/records/RecordsContent";
import { AdminSettingsContent } from "./components/settings/AdminSettingsContent";
import { InsightsContent } from "./components/insights/InsightsContent";
import { AnnouncementsContent } from "./components/announcements/AnnouncementsContent";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");

  return (
    <AuthGuard allowedRoles={["admin"]}>
    <div className="flex h-screen min-h-0 overflow-hidden bg-[#f8f9fa]">
      <AdminSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
      <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full min-w-0 max-w-[1920px]">
            {activeTab === "overview" && (
              <div className="mt-4 sm:mt-6">
                <AdminOverviewContent onNavigateToTab={(tab) => setActiveTab(tab)} />
              </div>
            )}

            {activeTab === "insights" && (
              <div className="mt-4 sm:mt-6">
                <InsightsContent />
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="mt-4 sm:mt-6">
                <AnnouncementsContent />
              </div>
            )}

            {activeTab === "users" && (
              <div className="mt-4 sm:mt-6">
                <UsersManagement />
              </div>
            )}

            {activeTab === "reports" && (
              <div className="mt-4 sm:mt-6">
                <ReportsContent />
              </div>
            )}

            {activeTab === "records" && (
              <div className="mt-4 sm:mt-6">
                <RecordsContent />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="mt-4 sm:mt-6">
                <AdminSettingsContent />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
