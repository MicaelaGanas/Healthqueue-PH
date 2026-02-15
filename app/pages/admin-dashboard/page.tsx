"use client";

import { useState } from "react";
import { AdminSidebar, type AdminTabId } from "./components/layout/AdminSidebar";
import { AdminHeader } from "./components/layout/AdminHeader";
import { UsersManagement } from "./components/users/UsersManagement";
import { ReportsContent } from "./components/reports/ReportsContent";
import { RecordsContent } from "./components/records/RecordsContent";
import { AdminSettingsContent } from "./components/settings/AdminSettingsContent";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("users");

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[#f8f9fa]">
      <AdminSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
      <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full min-w-0 max-w-[1920px]">
            <h2 className="text-lg font-bold text-[#333333] sm:text-xl">Admin Dashboard</h2>
            <p className="mt-0.5 text-xs text-[#6C757D] sm:mt-1 sm:text-sm">
              Manage users, view reports, and browse records
            </p>

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
  );
}
