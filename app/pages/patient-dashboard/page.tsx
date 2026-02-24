"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Footer } from "../../components/Footer";
import { PatientAuthGuard } from "../../components/PatientAuthGuard";
import { QueueStatus } from "./components/QueueStatus";
import { Appointment } from "./components/Appointment";
import { Notification } from "./components/Notification";

export type AppointmentForQueue = {
  referenceNo: string;
  requestedDate: string;
  requestedTime: string;
  department: string;
};

export default function PatientDashboardPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"queue" | "appointment" | "notification">("queue");
  const [selectedAppointmentForQueue, setSelectedAppointmentForQueue] = useState<AppointmentForQueue | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "appointment" || tab === "appointments") {
      setActiveTab("appointment");
    } else if (tab === "notification") {
      setActiveTab("notification");
    } else if (tab === "queue") {
      setActiveTab("queue");
    }
  }, [searchParams]);

  const handleViewQueueStatus = useCallback((appointment: AppointmentForQueue) => {
    setSelectedAppointmentForQueue(appointment);
    setActiveTab("queue");
  }, []);

  const clearQueueSelection = useCallback(() => {
    setSelectedAppointmentForQueue(null);
  }, []);

  return (
    <PatientAuthGuard>
      <div className="min-h-[80vh] bg-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          {/* Back to Home */}
          <div className="pt-8 px-4 sm:px-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="px-4 sm:px-6 py-8">
            {/* Tabs */}
            <div className="flex border-b border-gray-300 mb-8 bg-white rounded-t-lg">
              <button
                onClick={() => setActiveTab("queue")}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === "queue"
                    ? "text-[#333333] border-b-2 border-[#007bff] bg-gray-50"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Queue Status
              </button>
              <button
                onClick={() => setActiveTab("appointment")}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === "appointment"
                    ? "text-[#333333] border-b-2 border-[#007bff] bg-gray-50"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Appointment
              </button>
              <button
                onClick={() => setActiveTab("notification")}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === "notification"
                    ? "text-[#333333] border-b-2 border-[#007bff] bg-gray-50"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Notification
              </button>
            </div>

            {/* Queue Status Tab Content */}
            {activeTab === "queue" && (
              <QueueStatus
                selectedAppointment={selectedAppointmentForQueue}
                onClearSelection={clearQueueSelection}
              />
            )}

            {/* Appointment Tab Content */}
            {activeTab === "appointment" && (
              <Appointment onViewQueueStatus={handleViewQueueStatus} />
            )}

            {/* Notification Tab Content */}
            {activeTab === "notification" && <Notification />}
          </div>
        </div>
      </div>
      <Footer />
    </PatientAuthGuard>
  );
}
