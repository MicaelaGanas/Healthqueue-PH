"use client";

import { useState } from "react";
import { StaffSidebar } from "./components/layout/StaffSidebar";
import { StaffHeader } from "./components/layout/StaffHeader";
import { MetricCards } from "./components/dashboard/MetricCards";
import { WalkInRegistration } from "./components/dashboard/registration/WalkInRegistration";
import { IoTGadgetAssignment } from "./components/dashboard/registration/IoTGadgetAssignment";
import { VitalSignsForm } from "./components/dashboard/vitals-triage/VitalSignsForm";
import { EmergencyEscalationPanel } from "./components/dashboard/vitals-triage/EmergencyEscalationPanel";
import { QueueManagementContent } from "./components/queue-management/QueueManagementContent";
import { AppointmentsContent } from "./components/appointments/AppointmentsContent";
import { AlertsNotifications } from "./components/dashboard/alerts/AlertsNotifications";
import { AccessRestrictionsFooter } from "./components/AccessRestrictionsFooter";

const TABS = [
  { id: "registration", label: "Registration" },
  { id: "vitals", label: "Vitals & Triage" },
  { id: "queue", label: "Queue Management" },
  { id: "alerts", label: "Alerts" },
] as const;

type ActiveView = (typeof TABS)[number]["id"] | "appointments";

export default function NurseDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveView>("registration");

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[#f8f9fa]">
      <StaffSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
      <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
        <StaffHeader />
        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full min-w-0 max-w-[1920px]">
            {activeTab === "appointments" ? (
              <>
                <div className="mt-0 sm:mt-0">
                  <AppointmentsContent />
                </div>
                <AccessRestrictionsFooter />
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#333333] sm:text-xl">Triage / Staff Nurse Dashboard</h2>
                <p className="mt-0.5 text-xs text-[#6C757D] sm:mt-1 sm:text-sm">
                  Monitor patients, record vitals, manage triage, and coordinate care
                </p>

                <div className="mt-4 sm:mt-6">
                  <MetricCards />
                </div>

                <div className="mt-4 overflow-hidden border-b border-[#dee2e6] bg-[#e9ecef] sm:mt-6">
                  <nav className="flex gap-0.5 overflow-x-auto overflow-y-hidden px-0.5 pt-0.5 sm:gap-1 sm:px-1 sm:pt-1" aria-label="Dashboard tabs">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 rounded-t-md px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:py-3 sm:text-sm ${
                          activeTab === tab.id
                            ? "border border-b-0 border-[#dee2e6] bg-white text-[#333333] shadow-sm"
                            : "text-[#6C757D] hover:text-[#333333]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {activeTab === "registration" && (
                  <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">
                    <WalkInRegistration />
                    <IoTGadgetAssignment />
                  </div>
                )}

                {activeTab === "vitals" && (
                  <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <VitalSignsForm />
                    </div>
                    <div className="w-full min-w-0 shrink-0 sm:w-[340px] lg:w-[380px]">
                      <EmergencyEscalationPanel />
                    </div>
                  </div>
                )}

                {activeTab === "queue" && (
                  <div className="mt-4 sm:mt-6">
                    <QueueManagementContent />
                  </div>
                )}

                {activeTab === "alerts" && (
                  <div className="mt-4 sm:mt-6">
                    <AlertsNotifications />
                  </div>
                )}

                <AccessRestrictionsFooter />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
