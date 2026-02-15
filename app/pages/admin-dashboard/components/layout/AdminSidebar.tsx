"use client";

import { useState } from "react";
import Link from "next/link";

const navItems: { href: string; label: string; icon: string; tabId?: string }[] = [
  { href: "#users", label: "Users", icon: "people", tabId: "users" },
  { href: "#reports", label: "Reports", icon: "chart", tabId: "reports" },
  { href: "#records", label: "Records", icon: "folder", tabId: "records" },
  { href: "#settings", label: "Settings", icon: "gear", tabId: "settings" },
];

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
  people: PeopleIcon,
  chart: ChartIcon,
  folder: FolderIcon,
  gear: GearIcon,
};

export type AdminTabId = "users" | "reports" | "records" | "settings";

type AdminSidebarProps = {
  activeTab?: string;
  onTabChange?: (tab: AdminTabId) => void;
};

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
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
        <Link
          href="/"
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full min-w-0 items-center rounded-lg py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
