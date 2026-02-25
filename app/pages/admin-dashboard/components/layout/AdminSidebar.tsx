"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";

const navItems: { href: string; label: string; icon: string; tabId?: string }[] = [
  { href: "#overview", label: "Overview", icon: "overview", tabId: "overview" },
  { href: "#insights", label: "AI Insights", icon: "insights", tabId: "insights" },
  { href: "#announcements", label: "Announcements", icon: "announcements", tabId: "announcements" },
  { href: "#queue-display", label: "Queue Display", icon: "queue", tabId: "queue-display" },
  { href: "#users", label: "Users", icon: "people", tabId: "users" },
  { href: "#reports", label: "Reports", icon: "chart", tabId: "reports" },
  { href: "#records", label: "Records", icon: "folder", tabId: "records" },
  { href: "#settings", label: "Settings", icon: "gear", tabId: "settings" },
];

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function InsightsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}
function AnnouncementsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}
function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: OverviewIcon,
  insights: InsightsIcon,
  announcements: AnnouncementsIcon,
  queue: QueueIcon,
  people: PeopleIcon,
  chart: ChartIcon,
  folder: FolderIcon,
  gear: GearIcon,
};

export type AdminTabId = "overview" | "insights" | "announcements" | "queue-display" | "users" | "reports" | "records" | "settings";

type AdminSidebarProps = {
  activeTab?: string;
  onTabChange?: (tab: AdminTabId) => void;
};

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;

    setIsLoggingOut(true);

    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Small delay to ensure logout completes
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirect to landing page after logout
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[#333333] font-medium">Logging out...</p>
          </div>
        </div>
      )}
      <aside
        className={`flex shrink-0 flex-col overflow-hidden bg-[#1e3a5f] text-white transition-[width] duration-200 ${
          collapsed ? "w-[4.5rem]" : "w-56"
        }`}
      >
      <div
        className={`flex h-14 items-center border-b border-white/10 ${
          collapsed ? "justify-center px-0" : "justify-between px-3"
        }`}
      >
        {!collapsed && <span className="truncate font-semibold">HealthQueue PH</span>}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex shrink-0 items-center justify-center rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className={`flex-1 space-y-1 ${collapsed ? "flex flex-col items-center px-0 py-3" : "p-3"}`}>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] ?? PeopleIcon;
          const isActive = item.tabId && activeTab === item.tabId;
          const baseClass = `flex w-full min-w-0 items-center rounded-lg py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          } ${isActive ? "bg-white/10 text-white" : ""}`;
          if (item.tabId && onTabChange) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => onTabChange(item.tabId as AdminTabId)}
                title={collapsed ? item.label : undefined}
                className={baseClass}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={baseClass}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={`border-t border-white/10 ${collapsed ? "flex flex-col items-center px-0 py-3" : "p-3"}`}>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full min-w-0 items-center rounded-lg py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
