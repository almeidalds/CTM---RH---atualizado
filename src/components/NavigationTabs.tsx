/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  BarChart3,
  Users2,
  AlertTriangle,
  Calendar,
  LifeBuoy,
  Settings,
  RotateCcw,
  X,
  Sparkles
} from "lucide-react";

export type TabId =
  | "dashboard"
  | "team"
  | "schedule"
  | "risks";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeColor?: "red" | "amber" | "blue" | "gray" | "purple";
}

interface NavigationTabsProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  pendingCount: number;
  criticalRiskCount: number;
  criticalVacationCount: number;
  systemAlertCount: number;
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  criticalRiskCount,
  criticalVacationCount,
  systemAlertCount,
  isOpen,
  onClose,
  onResetData,
}) => {
  const tabs: TabItem[] = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: BarChart3 
    },
    { 
      id: "team", 
      label: "Equipe & Integridade", 
      icon: Users2,
      badgeCount: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: "amber"
    },
    { 
      id: "schedule", 
      label: "Escala & Ausências", 
      icon: Calendar,
      badgeCount: criticalVacationCount > 0 ? criticalVacationCount : undefined,
      badgeColor: "purple"
    },
    {
      id: "risks",
      label: "Riscos & Contratos",
      icon: AlertTriangle,
      badgeCount: systemAlertCount > 0 ? systemAlertCount : undefined,
      badgeColor: "red"
    }
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-oxford border-r border-lavender p-6 justify-between">
      <div>
        {/* Brand Logo & Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yinmn to-oxford rounded-xl flex items-center justify-center shadow-md shadow-jordy/20">
              <Sparkles className="w-5 h-5 text-jordy animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-oxford leading-none flex items-center gap-0.5">
                fuse<span className="text-jordy font-black">.</span>
              </h1>
              <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1 block">
                CTM RH Brasil
              </span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation Menu */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3 px-3">
            MENU
          </p>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 select-none group relative cursor-pointer ${
                    isActive
                      ? "bg-lavender/30 text-oxford"
                      : "text-slate-400 hover:text-oxford hover:bg-lavender/10"
                  }`}
                >
                  {/* Left accent bar for active tab, matching the image */}
                  {isActive && (
                    <div className="absolute left-0 top-[25%] h-1/2 w-1.5 bg-yinmn rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-yinmn" : "text-slate-400 group-hover:text-jordy"}`} />
                    <span className={isActive ? "font-extrabold" : "font-semibold"}>{tab.label}</span>
                  </div>
                  
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-black leading-none ${
                        tab.badgeColor === "red"
                          ? "bg-rose-500 text-white animate-pulse"
                          : tab.badgeColor === "purple"
                          ? "bg-yinmn text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 overflow-y-auto no-scrollbar">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Body */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF9FF] focus:outline-none transition-transform duration-300 ease-in-out transform translate-x-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
