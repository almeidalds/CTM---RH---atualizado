/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Menu } from "lucide-react";

interface AppHeaderProps {
  onResetData?: () => void;
  employeeCount: number;
  onMenuToggle: () => void;
  onGenerateReportClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onResetData, employeeCount, onMenuToggle, onGenerateReportClick }) => {
  return (
    <header className="bg-white border-b border-lavender px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile Toggle Menu Button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-oxford hover:bg-lavender/20 transition-colors shrink-0"
          aria-label="Open Menu"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Action Indicators & User profile */}
      <div className="flex items-center gap-5 shrink-0">
        {/* Premium Profile Avatar with name and email exactly as styled in the image */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black text-oxford leading-none">Anderson N. Horvath</p>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block leading-none">a.horvath@ctm.org.br</span>
          </div>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
            alt="Anderson N. Horvath profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-jordy shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};
