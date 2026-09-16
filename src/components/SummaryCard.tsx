/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Languages,
  AlertCircle,
  FileText,
  User,
  ShieldAlert,
  Info,
  ChevronDown,
  X,
  Edit2,
  Eye,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { RhEmployee, RiskLevel, Substitution, ContractRenewal } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";
import { StatusBadge } from "./StatusBadge";
import { RiskBadge } from "./RiskBadge";

// Click Outside Hook
function useClickOutside(ref: React.RefObject<HTMLDivElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

// ==========================================
// 1. EMPLOYEE SUMMARY CARD
// ==========================================
interface EmployeeSummaryCardProps {
  employee: RhEmployee;
  onSelect: (emp: RhEmployee) => void;
  onEdit: (emp: RhEmployee) => void;
}

export const EmployeeSummaryCard: React.FC<EmployeeSummaryCardProps> = ({
  employee,
  onSelect,
  onEdit
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, () => setIsPopoverOpen(false));

  const risk = calcularRisco(employee);
  const pendencias = identificarPendencias(employee);
  const dias = calcularDiasRestantes(employee.dataTerminoReal);

  const isCritical = risk === "Crítico";
  const hasCriticalIssues = pendencias.some((p) => p.severity === "Crítica");

  let cardBorder = "border-sky-100";
  let cardBg = "bg-white";
  if (isCritical) {
    cardBorder = "border-rose-200 ring-1 ring-rose-100";
    cardBg = "bg-rose-50/10";
  } else if (hasCriticalIssues) {
    cardBorder = "border-amber-200 ring-1 ring-amber-50";
    cardBg = "bg-amber-50/5";
  }

  return (
    <div className={`relative p-5 rounded-xl border ${cardBorder} ${cardBg} shadow-[0_4px_16px_rgba(23,105,170,0.04)] hover:shadow-[0_8px_24px_rgba(23,105,170,0.08)] transition-all duration-300 flex flex-col justify-between min-h-[220px]`}>
      
      {/* Crucial Info 1: Header (Nome & Cargo) */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-oxford truncate" title={employee.nome}>
              {employee.nome}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">{employee.cargo || "Não definido"}</p>
          </div>
          <StatusBadge status={employee.statusFuncionario} />
        </div>
      </div>

      {/* Crucial Info 2: Idiomas */}
      <div className="my-3 py-2 border-t border-b border-sky-100">
        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Idiomas</span>
        <div className="flex gap-1.5 flex-wrap">
          {employee.idiomas && employee.idiomas.length > 0 ? (
            employee.idiomas.map((l) => (
              <span key={l} className="bg-sky-50 text-yinmn px-2.5 py-0.5 rounded-lg text-[9px] font-black">
                {l}
              </span>
            ))
          ) : (
            <span className="text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg text-[9px] font-extrabold">Nenhum</span>
          )}
        </div>
      </div>

      {/* Crucial Info 3: Próximo Término */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Término de Contrato</span>
          <p className="text-xs font-bold text-oxford mt-0.5">
            {employee.dataTerminoReal ? (
              `${formatarDataBR(employee.dataTerminoReal)} (${dias !== null && dias >= 0 ? `${dias}d` : "expirado"})`
            ) : (
              <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold">Não informada</span>
            )}
          </p>
        </div>

        {/* Actions row with Popover trigger */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <button
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Ver Detalhes</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isPopoverOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Popover Bubble */}
          {isPopoverOpen && (
            <div
              ref={popoverRef}
              className="absolute right-0 bottom-full mb-2 z-30 w-72 bg-white rounded-2xl border border-sky-100 shadow-[0_12px_32px_rgba(16,42,67,0.15)] p-4 text-xs animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-sky-100 pb-2 mb-3">
                <span className="font-black uppercase tracking-wider text-yinmn text-[9px]">Ficha Técnica Adicional</span>
                <button onClick={() => setIsPopoverOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">ID Funcionário</span>
                    <span className="font-mono font-bold text-oxford">{employee.idFuncionario || "Ausente"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Admissão</span>
                    <span className="font-bold text-slate-500">{formatarDataBR(employee.dataAdmissao)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Zona de Atuação</span>
                    <span className="font-bold text-slate-600">{employee.zona || "Não vinculada"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Turno</span>
                    <span className="font-bold text-slate-600">{employee.turno || "Não definido"}</span>
                  </div>
                </div>

                <div className="border-t border-sky-100/50 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block mb-0.5">Risco de Escala</span>
                    <RiskBadge level={risk} />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block mb-0.5">Consistência Cadastral</span>
                    {pendencias.length > 0 ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-md font-bold text-[9px]">
                        {pendencias.length} Erros
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md font-bold text-[9px]">
                        Conforme
                      </span>
                    )}
                  </div>
                </div>

                {pendencias.length > 0 && (
                  <div className="bg-rose-50/40 p-2 rounded-xl border border-rose-100 text-[9px] text-rose-700 font-bold space-y-0.5">
                    <span className="uppercase block tracking-wider text-[8px]">Inconsistências Cadastrais:</span>
                    {pendencias.slice(0, 2).map((p, i) => (
                      <p key={i} className="truncate">&bull; {p.label}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-sky-100 flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    onSelect(employee);
                    setIsPopoverOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-yinmn bg-sky-50 hover:bg-sky-100 transition-colors"
                  title="Ficha Completa"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onEdit(employee);
                    setIsPopoverOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-yinmn bg-sky-50 hover:bg-sky-100 transition-colors"
                  title="Editar Ficha"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 2. SUBSTITUTION SUMMARY CARD
// ==========================================
interface SubstitutionSummaryCardProps {
  substitution: Substitution;
  onOpenRecommender: (sub: Substitution) => void;
  onEdit: (sub: Substitution) => void;
  onDelete: (id: string) => void;
  risco: { label: string; color: string; bg: string };
}

export const SubstitutionSummaryCard: React.FC<SubstitutionSummaryCardProps> = ({
  substitution,
  onOpenRecommender,
  onEdit,
  onDelete,
  risco
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, () => setIsPopoverOpen(false));

  const isCritical = risco.label === "Crítico";

  let cardBorder = "border-sky-100";
  let cardBg = "bg-white";
  if (isCritical) {
    cardBorder = "border-rose-200 ring-1 ring-rose-100";
    cardBg = "bg-rose-50/10";
  }

  return (
    <div className={`relative p-5 rounded-2xl border ${cardBorder} ${cardBg} shadow-[0_4px_16px_rgba(23,105,170,0.02)] hover:shadow-[0_8px_24px_rgba(23,105,170,0.06)] transition-all duration-300 flex flex-col justify-between min-h-[220px]`}>
      
      {/* Crucial Info 1: Header (Ausente & Motivo) */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-oxford truncate" title={substitution.instrutorAusente}>
              {substitution.instrutorAusente}
            </h4>
            <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-yinmn text-[9px] font-black uppercase mt-1">
              {substitution.motivo}
            </span>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
            substitution.status === "Substituto definido" || substitution.status === "Concluída"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : substitution.status === "Sem substituto"
              ? "bg-red-50 text-red-600 border-red-100"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}>
            {substitution.status}
          </span>
        </div>
      </div>

      {/* Crucial Info 2: Período de Ausência */}
      <div className="my-3 py-2 border-t border-b border-sky-100 flex justify-between items-center text-xs">
        <div>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Período</span>
          <p className="font-extrabold text-slate-600">{formatarDataBR(substitution.dataInicio)} - {formatarDataBR(substitution.dataFim)}</p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Duração</span>
          <p className="font-black text-yinmn">{substitution.dias} dias</p>
        </div>
      </div>

      {/* Crucial Info 3: Substituto Cobertura */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Substituto</span>
          {substitution.substituto ? (
            <div className="font-extrabold text-yinmn flex items-center gap-1 mt-0.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{substitution.substituto}</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenRecommender(substitution)}
              className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-black transition-all mt-0.5"
            >
              Indicar Cobertura
            </button>
          )}
        </div>

        {/* Actions row with Popover trigger */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <button
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Detalhes</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isPopoverOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Popover Bubble */}
          {isPopoverOpen && (
            <div
              ref={popoverRef}
              className="absolute right-0 bottom-full mb-2 z-30 w-72 bg-white rounded-2xl border border-sky-100 shadow-[0_12px_32px_rgba(16,42,67,0.15)] p-4 text-xs animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-sky-100 pb-2 mb-3">
                <span className="font-black uppercase tracking-wider text-yinmn text-[9px]">Fatores Técnicos de Cobertura</span>
                <button onClick={() => setIsPopoverOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Idioma</span>
                    <span className="font-extrabold text-oxford">{substitution.idioma || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Risco Operacional</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black border ${risco.color} ${risco.bg}`}>
                      {risco.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Campus / Local</span>
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {substitution.zona || "Não vinculada"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Turno</span>
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {substitution.turno || "Não definido"}
                    </span>
                  </div>
                </div>

                {substitution.observacoes && (
                  <div className="bg-slate-50 p-2.5 border border-sky-100 rounded-xl space-y-1">
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Notas Internas:</span>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                      "{substitution.observacoes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-sky-100 flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    onOpenRecommender(substitution);
                    setIsPopoverOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-yinmn bg-sky-50 hover:bg-sky-100 transition-colors"
                  title="Sugerir Substituto com Inteligência"
                >
                  <Languages className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onEdit(substitution);
                    setIsPopoverOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-yinmn bg-sky-50 hover:bg-sky-100 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onDelete(substitution.recordId);
                    setIsPopoverOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 3. CONTRACT SUMMARY CARD
// ==========================================
interface ContractSummaryCardProps {
  contract: ContractRenewal;
  risco: { label: string; color: string; bg: string };
  onSelect: (emp: RhEmployee) => void;
  onUpdateStatus: (c: ContractRenewal, newStatus: any) => void;
  onOpenParecer: (c: ContractRenewal) => void;
  employees: RhEmployee[];
}

export const ContractSummaryCard: React.FC<ContractSummaryCardProps> = ({
  contract,
  risco,
  onSelect,
  onUpdateStatus,
  onOpenParecer,
  employees
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, () => setIsPopoverOpen(false));

  const isCritical = risco.label === "Crítico";

  let cardBorder = "border-sky-100";
  let cardBg = "bg-white";
  if (isCritical) {
    cardBorder = "border-rose-200 ring-1 ring-rose-100";
    cardBg = "bg-rose-50/10";
  }

  const originalEmployee = employees.find((e) => e.recordId === contract.recordId);

  return (
    <div className={`relative p-5 rounded-2xl border ${cardBorder} ${cardBg} shadow-[0_4px_16px_rgba(23,105,170,0.02)] hover:shadow-[0_8px_24px_rgba(23,105,170,0.06)] transition-all duration-300 flex flex-col justify-between min-h-[220px]`}>
      
      {/* Crucial Info 1: Header (Nome & Cargo) */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4
              onClick={() => originalEmployee && onSelect(originalEmployee)}
              className="text-sm font-extrabold text-oxford hover:text-yinmn cursor-pointer truncate"
              title={contract.nome}
            >
              {contract.nome}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">{contract.cargo}</p>
          </div>
          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
            contract.statusRenovacao === "Renovado"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : contract.statusRenovacao === "Não renovar" || contract.statusRenovacao === "Encerrado"
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : contract.statusRenovacao === "Urgente"
              ? "bg-red-50 text-red-600 border border-red-100 animate-pulse"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}>
            {contract.statusRenovacao}
          </span>
        </div>
      </div>

      {/* Crucial Info 2: Término & Dias Restantes */}
      <div className="my-3 py-2 border-t border-b border-sky-100 flex justify-between items-center text-xs">
        <div>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Data Término</span>
          <p className="font-extrabold text-slate-700">
            {contract.dataTerminoReal ? formatarDataBR(contract.dataTerminoReal) : "Não cadastrada"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Janela Legal</span>
          <p className={`font-black ${contract.diasRestantes !== null && contract.diasRestantes <= 30 ? "text-rose-600" : "text-slate-600"}`}>
            {contract.diasRestantes !== null ? `${contract.diasRestantes} dias` : "--"}
          </p>
        </div>
      </div>

      {/* Crucial Info 3: Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Risco Legal</span>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase mt-0.5 ${risco.color} ${risco.bg}`}>
            {risco.label}
          </span>
        </div>

        {/* Actions row with Popover trigger */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <button
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Ver Detalhes</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isPopoverOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Popover Bubble */}
          {isPopoverOpen && (
            <div
              ref={popoverRef}
              className="absolute right-0 bottom-full mb-2 z-30 w-72 bg-white rounded-2xl border border-sky-100 shadow-[0_12px_32px_rgba(16,42,67,0.15)] p-4 text-xs animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-sky-100 pb-2 mb-3">
                <span className="font-black uppercase tracking-wider text-yinmn text-[9px]">Ficha Contratual</span>
                <button onClick={() => setIsPopoverOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Admissão</span>
                    <span className="font-bold text-slate-500">{formatarDataBR(contract.dataAdmissao)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Lotação / Campus</span>
                    <span className="font-bold text-slate-600">{contract.zona || "Não vinculada"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Responsável</span>
                    <span className="font-bold text-slate-600 truncate block">{contract.responsavelAnalise || "RH Coordenação"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Data Limite</span>
                    <span className="font-bold text-rose-600 font-mono">{contract.dataLimiteDecisao ? formatarDataBR(contract.dataLimiteDecisao) : "--"}</span>
                  </div>
                </div>

                {contract.observacoes && (
                  <div className="bg-slate-50 p-2 border border-sky-100 rounded-xl space-y-0.5 text-[9px]">
                    <span className="uppercase font-black text-slate-400 block tracking-wider">Parecer/Opinião:</span>
                    <p className="text-slate-500 leading-relaxed font-semibold italic">"{contract.observacoes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Popover */}
              <div className="mt-4 pt-2.5 border-t border-sky-100 flex flex-wrap gap-1 justify-end">
                <button
                  onClick={() => {
                    onUpdateStatus(contract, "Em análise");
                    setIsPopoverOpen(false);
                  }}
                  className="text-[8px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 font-bold"
                >
                  Analisar
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(contract, "Aguardando aprovação");
                    setIsPopoverOpen(false);
                  }}
                  className="text-[8px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200 font-bold"
                >
                  Aprovação
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(contract, "Renovado");
                    setIsPopoverOpen(false);
                  }}
                  className="text-[8px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200 font-bold"
                >
                  Renovar
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(contract, "Não renovar");
                    setIsPopoverOpen(false);
                  }}
                  className="text-[8px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded border border-rose-200 font-bold"
                >
                  Negar
                </button>
                <button
                  onClick={() => {
                    onOpenParecer(contract);
                    setIsPopoverOpen(false);
                  }}
                  className="text-[8px] bg-sky-50 hover:bg-sky-100 text-yinmn px-2 py-1 rounded border border-sky-200 font-black"
                >
                  Opinião
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
