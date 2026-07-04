/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GroupCount } from "../utils/groupUtils";
import {
  Globe,
  Languages,
  Clock,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  HelpCircle,
  Sparkles,
  MapPin,
  AlertTriangle,
  UserCheck,
  CalendarClock,
  UserX,
  Info,
  CalendarCheck
} from "lucide-react";

interface ChartCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, description, children }) => (
  <div className="bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)] flex flex-col h-full hover:shadow-[0_15px_35px_rgba(25,35,56,0.035)] hover:-translate-y-1 transition-all duration-300">
    <div className="mb-5">
      <h4 className="text-base font-extrabold text-oxford tracking-tight">{title}</h4>
      <p className="text-[11px] text-slate-400 font-medium mt-1 leading-snug">{description}</p>
    </div>
    <div className="flex-1 flex items-center justify-center min-h-[240px] w-full">
      {children}
    </div>
  </div>
);

// 1. INSTRUTORES POR IDIOMA (Horizontal Bar Chart)
interface IdiomaChartProps {
  data: GroupCount[];
}
export const IdiomaChart: React.FC<IdiomaChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
        <Globe className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">Sem dados de idiomas para exibir</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const themeGradients = [
    "from-indigo-600 to-violet-500",
    "from-violet-600 to-purple-500",
    "from-fuchsia-600 to-pink-500",
    "from-blue-600 to-sky-500",
    "from-teal-600 to-emerald-500",
    "from-amber-500 to-orange-500",
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {data.slice(0, 6).map((item, idx) => {
        const widthPercent = (item.count / maxVal) * 100;
        const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
        const isHovered = hoveredIdx === idx;
        const barGradient = themeGradients[idx % themeGradients.length];
        
        return (
          <div
            key={item.name}
            className={`transition-all duration-300 p-2 rounded-2xl border border-transparent ${
              isHovered ? "bg-lavender/10 border-lavender/50 shadow-sm scale-[1.01] translate-x-1" : ""
            } ${isDimmed ? "opacity-45" : "opacity-100"}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-oxford">
              <div className="flex items-center gap-1.5 min-w-0">
                <Languages className="w-3.5 h-3.5 text-yinmn shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="text-slate-400 font-semibold shrink-0 text-[10px] sm:text-xs">
                {item.count} {item.count === 1 ? "docente" : "docentes"} ({item.percentage}%)
              </span>
            </div>
            
            <div className="h-4 bg-slate-50 rounded-full overflow-hidden relative border border-lavender/40 shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out`}
                style={{
                  width: `${widthPercent}%`,
                  boxShadow: isHovered ? "0 0 8px rgba(109, 40, 217, 0.25)" : "none",
                }}
              />
              {isHovered && (
                <div className="absolute right-3.5 top-0 bottom-0 flex items-center pointer-events-none animate-fadeIn">
                  <span className="text-[8px] text-white font-black uppercase bg-oxford/90 tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                    Destaque
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 2. SAÍDAS POR MÊS (Interactive Columns Chart with Gridlines & Enhanced Visuals)
interface SaidasMesChartProps {
  data: { mes: string; count: number }[];
}
export const SaidasMesChart: React.FC<SaidasMesChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">Nenhuma saída de contrato prevista nos próximos meses</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const totalSaidas = data.reduce((acc, d) => acc + d.count, 0);

  // Generate reference points for grid lines
  const gridLevels = [0.75, 0.5, 0.25];

  return (
    <div className="w-full flex flex-col h-full justify-between gap-5 select-none">
      <div className="relative flex items-end justify-between gap-4 h-40 border-b border-lavender pb-2 pt-6 px-4">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 bottom-2 top-6 flex flex-col justify-between pointer-events-none z-0">
          {gridLevels.map((lvl, index) => {
            const levelVal = Math.round(maxVal * lvl);
            return (
              <div key={index} className="w-full flex items-center gap-2">
                <span className="text-[8px] font-bold text-slate-300 w-4 text-right shrink-0">{levelVal}</span>
                <div className="flex-1 border-b border-dashed border-slate-100" />
              </div>
            );
          })}
        </div>

        {/* Chart Columns */}
        {data.slice(0, 6).map((item, idx) => {
          const heightPercent = (item.count / maxVal) * 100;
          const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
          const isHovered = hoveredIdx === idx;
          const itemPercent = totalSaidas > 0 ? Math.round((item.count / totalSaidas) * 100) : 0;

          return (
            <div
              key={item.mes}
              className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer z-10"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip Card */}
              {isHovered && (
                <div className="absolute bottom-full mb-3.5 bg-oxford/95 backdrop-blur-md text-white text-xs p-3 rounded-2xl shadow-xl z-30 w-36 text-left pointer-events-none border border-slate-700/50 animate-fadeIn">
                  <p className="font-extrabold text-[10px] text-slate-300 border-b border-slate-700/60 pb-1 mb-1.5 uppercase tracking-wider">{item.mes}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-black text-white text-sm">{item.count} saídas</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">{itemPercent}% de todas as saídas</p>
                </div>
              )}

              {/* Floating Counter Bubble on top of Column */}
              {item.count > 0 && (
                <span className={`text-[9px] font-black mb-1.5 px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-lavender transition-all ${
                  isHovered ? "bg-rose-50 text-rose-600 border-rose-200 scale-110 shadow-xs" : "opacity-80"
                }`}>
                  {item.count}
                </span>
              )}

              {/* Column Bar */}
              <div
                className={`w-full sm:w-10 rounded-t-xl transition-all duration-300 bg-gradient-to-t ${
                  isHovered 
                    ? "from-rose-500 via-rose-500 to-pink-500 shadow-[0_4px_15px_rgba(239,68,68,0.25)]" 
                    : "from-yinmn via-jordy to-violet-400 shadow-xs"
                }`}
                style={{
                  height: `${Math.max(heightPercent, 4)}%`,
                  opacity: isDimmed ? 0.35 : 1,
                  transform: isHovered ? "scaleY(1.03)" : "scaleY(1)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X Axis Labels */}
      <div className="flex justify-between text-[10px] font-bold text-slate-400 px-4">
        {data.slice(0, 6).map((item) => (
          <span key={item.mes} className="flex-1 text-center truncate max-w-[70px] uppercase tracking-wider" title={item.mes}>
            {item.mes.split("/")[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

// 3. INSTRUTORES POR ZONA (Donut Chart with Interactive Segments and Legend Cards)
interface ZonaChartProps {
  data: GroupCount[];
}
export const ZonaChart: React.FC<ZonaChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
        <MapPin className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">Sem dados geográficos para exibir</p>
      </div>
    );
  }

  // Modern, highly distinguished coordinate colors
  const colors = ["#4C2B85", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#64748B"];

  return (
    <div className="w-full flex flex-col sm:flex-row items-center gap-8 select-none">
      {/* SVG Donut Circle */}
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 filter drop-shadow-[0_4px_10px_rgba(25,35,56,0.03)]">
          {/* Subtle Outer Track ring */}
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3" />
          
          {(() => {
            let accumulatedPercent = 0;
            return data.map((item, idx) => {
              const strokeWidth = hoveredIdx === idx ? "5" : "3.5";
              const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
              const strokeDashoffset = 100 - accumulatedPercent;
              accumulatedPercent += item.percentage;

              return (
                <circle
                  key={item.name}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer stroke-linecap-round"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            });
          })()}
        </svg>

        {/* Center Typography Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-white rounded-full m-4 shadow-[0_4px_15px_rgba(25,35,56,0.05)] border border-lavender/40 pointer-events-none transition-all">
          {hoveredIdx !== null ? (
            <div className="animate-fadeIn">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate max-w-[85px]">
                {data[hoveredIdx].name}
              </span>
              <span className="text-xl font-black text-oxford block leading-none mt-1">
                {data[hoveredIdx].percentage}%
              </span>
              <span className="text-[8px] font-bold text-slate-500 block leading-none mt-0.5">
                {data[hoveredIdx].count} doc.
              </span>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Total</span>
              <span className="text-xl font-black text-oxford block leading-none mt-1">
                {data.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
              <span className="text-[8px] text-slate-500 font-bold block mt-0.5">Campus Ativos</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend Cards */}
      <div className="flex-1 flex flex-col gap-2.5 w-full">
        {data.slice(0, 5).map((item, idx) => {
          const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
          const isHovered = hoveredIdx === idx;
          const segmentColor = colors[idx % colors.length];

          return (
            <div
              key={item.name}
              className={`flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl border border-transparent transition-all duration-300 ${
                isHovered 
                  ? "bg-slate-50 border-lavender shadow-xs translate-x-1.5" 
                  : "bg-slate-50/50 hover:bg-slate-50"
              } ${isDimmed ? "opacity-35" : "opacity-100"}`}
              style={{ borderLeftColor: isHovered ? segmentColor : "transparent", borderLeftWidth: isHovered ? "4px" : "1px" }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: segmentColor }}
                />
                <span className="font-extrabold text-oxford truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="font-semibold text-slate-500 text-[10px]">{item.count} doc.</span>
                <span className="font-black text-oxford bg-white border border-lavender px-1.5 py-0.5 rounded-md text-[9px] shadow-2xs">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. INSTRUTORES POR TURNO (Vertical Column Comparison Chart with Dashboard Metrics)
interface TurnoChartProps {
  data: GroupCount[];
}
export const TurnoChart: React.FC<TurnoChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
        <Clock className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">Sem dados de turnos para exibir</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const colors = ["from-indigo-600 to-indigo-500", "from-purple-600 to-purple-500", "from-teal-600 to-teal-500"];

  return (
    <div className="w-full flex flex-col h-full justify-between gap-5 select-none">
      <div className="relative flex items-end justify-center gap-8 h-40 border-b border-lavender pb-2 pt-6">
        {/* Background dotted reference gridlines */}
        <div className="absolute inset-x-0 bottom-2 top-6 flex flex-col justify-between pointer-events-none z-0">
          <div className="w-full border-b border-dotted border-slate-100" />
          <div className="w-full border-b border-dotted border-slate-100" />
          <div className="w-full border-b border-dotted border-slate-100" />
        </div>

        {data.map((item, idx) => {
          const barHeight = (item.count / maxCount) * 100;
          const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
          const isHovered = hoveredIdx === idx;
          const barGradient = colors[idx % colors.length];

          return (
            <div
              key={item.name}
              className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer z-10"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Floating Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-3 bg-oxford/95 backdrop-blur-md text-white text-xs p-2.5 rounded-2xl shadow-xl z-20 w-32 text-center border border-slate-700/50 animate-fadeIn">
                  <p className="font-extrabold text-[10px] text-slate-300 uppercase tracking-widest mb-0.5">{item.name}</p>
                  <p className="font-black text-sm">{item.count} ativos</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{item.percentage}% do quadro</p>
                </div>
              )}

              {/* Floating Count indicator */}
              <span className={`text-[10px] font-black text-slate-400 mb-1.5 transition-all ${
                isHovered ? "text-indigo-600 scale-110" : "opacity-85"
              }`}>
                {item.count}
              </span>

              {/* Column Bar */}
              <div
                className={`w-14 rounded-t-xl bg-gradient-to-t ${barGradient} transition-all duration-300`}
                style={{
                  height: `${Math.max(barHeight, 5)}%`,
                  opacity: isDimmed ? 0.35 : 1,
                  boxShadow: isHovered ? "0 4px 15px rgba(109, 40, 217, 0.2)" : "none",
                  transform: isHovered ? "scaleY(1.02)" : "scaleY(1)",
                }}
              />
              <span className="text-[10px] font-black text-slate-400 mt-2.5 truncate max-w-[80px] uppercase tracking-wider">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. DISTRIBUIÇÃO POR STATUS (Glossy Horizontal Stacked Bar with Enhanced KPI legend cards)
interface StatusChartProps {
  data: GroupCount[];
}
export const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
        <Info className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">Sem dados de status de funcionários</p>
      </div>
    );
  }

  const colors: Record<string, string> = {
    Ativo: "#6D28D9",
    "A começar": "#3B82F6",
    Encerrado: "#FDA4AF", // Rose/pink for closed
  };

  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Ativo: UserCheck,
    "A começar": CalendarClock,
    Encerrado: UserX,
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* Glossy Multi-Segment Stacked Progress Bar */}
      <div className="h-6 w-full rounded-full overflow-hidden flex shadow-inner border border-lavender bg-slate-50 p-0.5 relative group">
        {data.map((item, idx) => {
          const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
          const bg = colors[item.name] || "#C084FC";
          
          if (item.count === 0) return null;

          return (
            <div
              key={item.name}
              style={{
                width: `${item.percentage}%`,
                backgroundColor: bg,
                opacity: isDimmed ? 0.35 : 1,
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 cursor-pointer flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm relative overflow-hidden"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              title={`${item.name}: ${item.count} (${item.percentage}%)`}
            >
              {/* Glossy sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-60 pointer-events-none" />
              {item.percentage > 12 && (
                <span className="relative z-10 drop-shadow-sm">{item.percentage}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Segment Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {data.map((item, idx) => {
          const bg = colors[item.name] || "#C084FC";
          const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
          const isHovered = hoveredIdx === idx;
          const IconComponent = icons[item.name] || Info;

          return (
            <div
              key={item.name}
              className={`flex flex-col p-3 rounded-2xl border transition-all duration-300 cursor-pointer bg-slate-50/50 ${
                isHovered 
                  ? "bg-slate-50 border-lavender shadow-md scale-[1.03]" 
                  : "border-transparent"
              } ${isDimmed ? "opacity-35" : "opacity-100"}`}
              style={{ borderLeftColor: bg, borderLeftWidth: "4px" }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bg }} />
                  <span className="text-[11px] font-extrabold text-oxford truncate">{item.name}</span>
                </div>
                <IconComponent className="w-3.5 h-3.5 text-slate-400" />
              </div>
              
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-oxford leading-none">{item.count}</span>
                <span className="text-[10px] text-slate-400 font-bold">docentes</span>
              </div>
              
              <span className="text-[9px] text-slate-400 font-semibold mt-1 bg-white border border-lavender rounded-md px-1.5 py-0.5 w-max shadow-2xs">
                {item.percentage}% do quadro geral
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 6. CONTRATOS POR FAIXA DE RISCO (Advanced Dashboard Heatmap with Icons and Status indicators)
interface RiscoChartProps {
  data: { name: string; count: number; percentage: number }[];
}
export const RiscoChart: React.FC<RiscoChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
        <ShieldAlert className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold">Sem dados de análise de riscos</p>
      </div>
    );
  }

  const colors: Record<string, string> = {
    Crítico: "#EF4444",
    Alto: "#F59E0B",
    Médio: "#3B82F6",
    Baixo: "#8B5CF6",
    "Sem risco": "#10B981",
    "Cadastro incompleto": "#64748B",
  };

  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Crítico: ShieldAlert,
    Alto: AlertTriangle,
    Médio: Info,
    Baixo: Info,
    "Sem risco": CheckCircle,
    "Cadastro incompleto": HelpCircle,
  };

  const bgBackdrops: Record<string, string> = {
    Crítico: "bg-red-50/70 border-red-100 hover:bg-red-50",
    Alto: "bg-amber-50/70 border-amber-100 hover:bg-amber-50",
    Médio: "bg-blue-50/70 border-blue-100 hover:bg-blue-50",
    Baixo: "bg-purple-50/70 border-purple-100 hover:bg-purple-50",
    "Sem risco": "bg-emerald-50/70 border-emerald-100 hover:bg-emerald-50",
    "Cadastro incompleto": "bg-slate-50 border-slate-200/60 hover:bg-slate-100",
  };

  return (
    <div className="w-full flex flex-col gap-3.5 select-none">
      {data.map((item, idx) => {
        const bg = colors[item.name] || "#8B5CF6";
        const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
        const isHovered = hoveredIdx === idx;
        const IconComponent = icons[item.name] || Info;
        const backdropClass = bgBackdrops[item.name] || "bg-slate-50";

        return (
          <div
            key={item.name}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-300 ${backdropClass} ${
              isHovered ? "shadow-md scale-[1.01] translate-x-1" : "border-transparent"
            } ${isDimmed ? "opacity-35" : "opacity-100"}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Left Header Info */}
            <div className="flex items-center gap-2.5 sm:w-44 shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: bg }}
              >
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-black text-oxford truncate uppercase tracking-wider">
                {item.name}
              </span>
            </div>

            {/* Glowing Indicator bar */}
            <div className="flex-1 h-3.5 bg-white/80 rounded-full overflow-hidden relative border border-lavender/40 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: bg,
                  boxShadow: isHovered ? `0 0 10px ${bg}44` : "none",
                }}
              />
            </div>

            {/* Stats Label */}
            <div className="flex items-center gap-1.5 sm:w-20 justify-end text-right shrink-0">
              <span className="text-[11px] font-black text-oxford">
                {item.count} doc.
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 bg-white border border-lavender/40 px-1.5 py-0.5 rounded shadow-2xs">
                {item.percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
