/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  RotateCcw,
  AlertTriangle,
  FolderSync,
  X,
  ShieldAlert,
  CalendarDays,
  Bell
} from "lucide-react";
import { TabId } from "./NavigationTabs";

interface FloatingActionBarProps {
  systemAlertCount: number;
  pendingCount: number;
  criticalVacationCount: number;
  onGenerateReportClick: () => void;
  onResetData: () => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  setTeamSubTab: (subTab: "list" | "pending") => void;
  setScheduleSubTab: (subTab: "vacations" | "substitutions" | "replacement") => void;
  setRisksSubTab: (subTab: "heatmap" | "contracts" | "alerts") => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  systemAlertCount,
  pendingCount,
  criticalVacationCount,
  onGenerateReportClick,
  onResetData,
  activeTab,
  setActiveTab,
  setTeamSubTab,
  setScheduleSubTab,
  setRisksSubTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const totalAlerts = systemAlertCount + pendingCount + criticalVacationCount;

  const navigateToAlerts = () => {
    setActiveTab("risks");
    setRisksSubTab("alerts");
    setIsOpen(false);
  };

  const navigateToPending = () => {
    setActiveTab("team");
    setTeamSubTab("pending");
    setIsOpen(false);
  };

  const navigateToVacations = () => {
    setActiveTab("schedule");
    setScheduleSubTab("vacations");
    setIsOpen(false);
  };

  const handleReset = () => {
    onResetData();
    setIsOpen(false);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-40 select-none font-sans sm:bottom-6 sm:right-6"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click away */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            {/* Expanded Menu */}
            <motion.div
              id={panelId}
              role="region"
              aria-label="Notificações de RH"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-[4.5rem] right-0 z-40 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-7rem)] overflow-y-auto bg-white rounded-2xl border border-sky-100 shadow-[0_12px_40px_rgba(16,42,67,0.12)] p-5 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-100 text-yinmn rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-oxford uppercase tracking-wider">
                      Notificações
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Controle Rápido
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar notificações" className="p-2 rounded-lg text-slate-500 hover:text-yinmn hover:bg-sky-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yinmn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator Bar */}
              {totalAlerts > 0 ? (
                <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100/60 text-[11px] text-amber-800 font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Alerta do Quadro de Pessoal</span>
                    <span className="text-[10px] text-amber-700/90 mt-0.5 block">
                      Existem {systemAlertCount} alertas críticos de contratos/substituições e {pendingCount} cadastros inconsistentes.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100/60 text-[11px] text-emerald-800 font-semibold flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Conformidade Ideal</span>
                    <span className="text-[10px] text-emerald-700/90 mt-0.5 block">
                      Todos os prazos contratuais e dados do CTM estão saudáveis.
                    </span>
                  </div>
                </div>
              )}

              {/* Shortcut Workflow Targets */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block px-1">
                  Atalhos
                </span>

                {/* Critical Alerts Target */}
                <button
                  onClick={navigateToAlerts}
                  className="w-full text-left p-2.5 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block leading-none">Prazos e Alertas Críticos</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">Classificação de risco em contratos</span>
                    </div>
                  </div>
                  {systemAlertCount > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {systemAlertCount}
                    </span>
                  )}
                </button>

                {/* Saneamento Cadastral Target */}
                <button
                  onClick={navigateToPending}
                  className="w-full text-left p-2.5 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderSync className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block leading-none">Saneamento Cadastral</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">Inconsistências e dados em falta</span>
                    </div>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* Férias Críticas Target */}
                <button
                  onClick={navigateToVacations}
                  className="w-full text-left p-2.5 hover:bg-sky-50 rounded-xl border border-transparent hover:border-sky-100 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-yinmn group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block leading-none">Controle de Férias & Ausências</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">Passivo de folgas adquiridas</span>
                    </div>
                  </div>
                  {criticalVacationCount > 0 && (
                    <span className="bg-yinmn text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {criticalVacationCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Global Utility Actions */}
              <div className="space-y-1.5 pt-1.5 border-t border-sky-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block px-1">
                  Ações de Escrita e Banco
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onGenerateReportClick();
                      setIsOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/50 hover:bg-sky-50 border border-sky-100 transition-all text-center gap-1.5 group active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-yinmn group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Relatórios</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF9F9] hover:bg-rose-50 border border-rose-100/30 transition-all text-center gap-1.5 group active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Resetar Dados</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={`${isOpen ? "Fechar" : "Abrir"} notificações${totalAlerts > 0 ? `: ${totalAlerts} ocorrências` : ": sem pendências"}`}
        title={isOpen ? "Fechar notificações" : "Abrir notificações"}
        className={`relative z-40 flex h-14 items-center gap-3 rounded-2xl border px-3 shadow-[0_4px_18px_rgba(16,42,67,0.10)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yinmn focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer ${
          isOpen
            ? "border-yinmn bg-yinmn text-white"
            : "border-sky-100 bg-white text-oxford hover:border-sky-200 hover:bg-sky-50"
        }`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isOpen ? "bg-white/15 text-white" : "bg-sky-50 text-yinmn"}`}>
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Bell className="h-5 w-5" aria-hidden="true" />}
        </span>
        <span className="hidden text-xs font-semibold sm:block">Notificações</span>
        {totalAlerts > 0 && (
          <span aria-hidden="true" className={`flex h-6 min-w-6 items-center justify-center rounded-lg px-1.5 text-[10px] font-bold tabular-nums ${isOpen ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800"}`}>
            {totalAlerts > 99 ? "99+" : totalAlerts}
          </span>
        )}
      </button>
    </div>
  );
};
