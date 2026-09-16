import React from "react";
import { Check } from "lucide-react";

export interface SectionTabItem {
  id: string;
  label: string;
  badge?: number;
}

interface SectionTabsProps {
  items: SectionTabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({ items, activeId, onChange }) => {
  return (
    <div className="rounded-xl border border-sky-100 bg-white p-1.5 shadow-[0_4px_16px_rgba(16,42,67,0.04)]">
      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.id)}
              className={`flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-bold transition-colors cursor-pointer sm:px-4 ${
                isActive
                  ? "bg-yinmn text-white shadow-sm"
                  : "text-slate-500 hover:bg-sky-50 hover:text-yinmn"
              }`}
            >
              {isActive && <Check className="h-3.5 w-3.5" />}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none ${isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
