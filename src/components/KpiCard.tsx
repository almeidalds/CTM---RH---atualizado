/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";

type KpiColorType = "green" | "blue" | "orange" | "red" | "gray";

interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorType: KpiColorType;
  trend?: string;
  subtitle?: string;
  onClick?: () => void;
  isFirst?: boolean; // Highlight first card with deep slate/blue gradient like the image
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  colorType,
  trend = "Estável este mês",
  subtitle,
  onClick,
  isFirst = false
}) => {
  if (isFirst) {
    return (
      <div
        id={id}
        onClick={onClick}
        className={`p-6 rounded-xl bg-gradient-to-br from-yinmn to-cadet text-white shadow-[0_15px_35px_rgba(16,42,67,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,42,67,0.25)] relative overflow-hidden group ${
          onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
        }`}
      >
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
        
        {/* Top Header Row of Card */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-black uppercase tracking-widest text-jordy">
            {title}
          </span>
          <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Display Value */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {value}
          </span>
        </div>

        {/* Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/5 text-[10px] font-bold text-white/95">
          <div className="w-1.5 h-1.5 rounded-full bg-jordy animate-pulse" />
          <span>{subtitle || trend}</span>
        </div>
      </div>
    );
  }

  // Normal Card (White, clean minimalist with light borders)
  const iconColorClasses: Record<KpiColorType, string> = {
    green: "text-emerald-600 bg-emerald-50",
    blue: "text-cadet bg-sky-50",
    orange: "text-amber-600 bg-amber-50",
    red: "text-rose-600 bg-rose-50",
    gray: "text-slate-500 bg-slate-50"
  };

  const selectedColorClass = iconColorClasses[colorType] || iconColorClasses.blue;

  return (
    <div
      id={id}
      onClick={onClick}
      className={`p-6 rounded-xl bg-white border border-sky-100 shadow-[0_10px_30px_rgba(16,42,67,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(23,105,170,0.10)] relative overflow-hidden group ${
        onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
      }`}
    >
      {/* Top Header Row of Card */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 group-hover:bg-sky-50 group-hover:border-jordy/50 flex items-center justify-center transition-all">
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-yinmn" />
        </div>
      </div>

      {/* Display Value */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-oxford">
          {value}
        </span>
      </div>

      {/* Indicator Pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-[10px] font-bold text-slate-500">
        <div className={`w-1.5 h-1.5 rounded-full ${colorType === "red" ? "bg-red-500 animate-pulse" : "bg-[#22C55E]"}`} />
        <span>{subtitle || trend}</span>
      </div>
    </div>
  );
};

