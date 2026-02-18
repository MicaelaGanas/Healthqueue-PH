"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";

const navItems: { href: string; label: string; icon: string; tabId?: string }[] = [
  { href: "#specimens", label: "Specimens", icon: "beaker", tabId: "specimens" },
  { href: "#settings", label: "Settings", icon: "gear", tabId: "settings" },
];

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6m-3 0v5l4.5 7.5A2 2 0 0114.78 19H9.22a2 2 0 01-1.72-3.5L12 8V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 14h7" />
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
  beaker: BeakerIcon,
  gear: GearIcon,
};

export type LabTabId = "specimens" | "settings";

type LabSidebarProps = {
  activeTab?: string;
  onTabChange?: (tab: LabTabId) => void;
};

export function LabSidebar({ activeTab, onTabChange }: LabSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    if (!supabase) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      await new Promise((resolve) => setTimeout(resolve, 300));
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
              <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
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
            {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          </button>
        </div>
        <nav className={`flex-1 space-y-1 ${collapsed ? "flex flex-col items-center px-0 py-3" : "p-3"}`}>
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] ?? GearIcon;
            const isActive = item.tabId && activeTab === item.tabId;
            const baseClass = `flex w-full min-w-0 items-center rounded-lg py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white ${
              collapsed ? "justify-center px-0" : "gap-3 px-3"
            } ${isActive ? "bg-white/10 text-white" : ""}`;
            if (item.tabId && onTabChange) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => onTabChange(item.tabId as LabTabId)}
                  title={collapsed ? item.label : undefined}
                  className={baseClass}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            }
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={baseClass}>
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
