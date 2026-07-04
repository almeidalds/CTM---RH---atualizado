/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  X,
  Calendar,
  Layers,
  Clock,
  Briefcase,
  AlertTriangle,
  ClipboardCheck,
  Check,
  ShieldCheck,
  Plane,
  BadgeAlert,
  User,
  Tags,
  BadgeCent
} from "lucide-react";
import { RhEmployee } from "../types/rh";
import { formatarDataBR } from "../utils/dateUtils";
import {
  calcularTempoTrabalho,
  calcularStatusFerias,
  calcularDiasFerias,
  calcularDiasVendidos,
  calcularDiasTirados,
  calcularPeriodosFerias,
  identificarAlertaFerias,
  gerarRecomendacaoFerias
} from "../utils/vacationUtils";

interface VacationDetailsPanelProps {
  employee: RhEmployee | null;
  onClose: () => void;
}

export const VacationDetailsPanel: React.FC<VacationDetailsPanelProps> = ({
  employee,
  onClose
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!employee) return null;

  const tempoTrabalho = calcularTempoTrabalho(employee.dataAdmissao);
  const statusFerias = calcularStatusFerias(employee);
  const diasTotais = calcularDiasFerias(employee);
  const diasVendidos = calcularDiasVendidos(employee);
  const diasTirados = calcularDiasTirados(employee);
  const periodosCount = calcularPeriodosFerias(employee);
  const alerta = identificarAlertaFerias(employee);
  const recomendacao = gerarRecomendacaoFerias(employee);

  const handleCopySummary = () => {
    const periodosText = (employee.periodosFerias || [])
      .map((p, idx) => `  - Período ${idx + 1}: De ${formatarDataBR(p.dataInicio)} até ${formatarDataBR(p.dataFim)} (${p.dias} dias)`)
      .join("\n") || "  - Nenhum período programado";

    const resumo = `Resumo de Férias do Instrutor:
Nome: ${employee.nome}
ID Funcional: ${employee.idFuncionario || "ID Pendente"}
Cargo: ${employee.cargo}
Admissão: ${formatarDataBR(employee.dataAdmissao)}
Tempo de Trabalho: ${tempoTrabalho.texto}
Status de Férias: ${statusFerias}
Alerta: ${alerta.label}
Dias de Férias: ${diasTotais}
Dias Vendidos: ${diasVendidos}
Dias Tirados: ${diasTirados}
Períodos Divididos: ${periodosCount}
Períodos Programados:
${periodosText}
Recomendação: ${recomendacao}`;

    navigator.clipboard.writeText(resumo);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-oxford/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Flyout panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-[0_0_50px_rgba(30,46,79,0.15)] flex flex-col z-10 transition-all duration-300 transform">
        {/* Header */}
        <div className="bg-oxford text-white p-6 flex items-center justify-between border-b border-cadet">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cadet rounded-xl flex items-center justify-center border border-yinmn/20">
              <Plane className="w-5 h-5 text-jordy" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight truncate max-w-[280px]">
                Ficha de Férias: {employee.nome}
              </h2>
              <p className="text-[10px] text-jordy font-mono font-bold mt-0.5">
                {employee.idFuncionario || "ID Pendente"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-jordy hover:text-white hover:bg-cadet transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* Alerta Atual & Status Principal */}
          <div className="p-4 rounded-2xl border flex flex-col gap-2.5 bg-lavender/10 border-lavender/35">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Situação Cadastral de Férias</span>
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${alerta.color} flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${alerta.dotColor}`} />
                <span>{alerta.label}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-lavender/35">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Tempo de Trabalho</span>
                <span className="text-xs font-bold text-oxford">{tempoTrabalho.texto}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Admissão</span>
                <span className="text-xs font-bold text-oxford">{formatarDataBR(employee.dataAdmissao)}</span>
              </div>
            </div>
          </div>

          {/* Dados do Cargo e Turno */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Lotação do Instrutor</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-lavender/20">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Cargo</span>
                <p className="text-xs font-extrabold text-oxford truncate">{employee.cargo}</p>
              </div>

              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-lavender/20">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Zona</span>
                <p className="text-xs font-extrabold text-oxford truncate">{employee.zona || "Não cadastrada"}</p>
              </div>

              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-lavender/20">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Turno</span>
                <p className="text-xs font-extrabold text-oxford truncate">{employee.turno || "Não cadastrado"}</p>
              </div>
            </div>
          </div>

          {/* Detalhes de Direito e Saldos */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Métricas e Direitos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-lavender/20">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Direito Adquirido</span>
                </div>
                <p className={`text-xs font-extrabold ${tempoTrabalho.totalMeses >= 12 ? "text-emerald-600" : "text-slate-400"}`}>
                  {tempoTrabalho.totalMeses >= 12 ? "SIM (Apto a gozar)" : "NÃO (Menor de 1 ano)"}
                </p>
              </div>

              <div className="bg-slate-50/50 p-3 rounded-xl border border-lavender/20">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Calendar className="w-4 h-4 text-yinmn" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Férias Programadas</span>
                </div>
                <p className={`text-xs font-extrabold ${employee.feriasMarcadas ? "text-yinmn" : "text-amber-600"}`}>
                  {employee.feriasMarcadas ? "Sim, Registradas" : "Não Marcadas"}
                </p>
              </div>
            </div>

            {/* Balanço de Dias */}
            <div className="bg-white p-4 rounded-2xl border border-lavender shadow-sm grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">Dias Totais</span>
                <span className="text-base font-black text-oxford block mt-0.5">{diasTotais}</span>
                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Saldo padrão</span>
              </div>
              <div className="border-x border-lavender">
                <span className="text-[9px] uppercase font-black text-amber-600 block">Dias Vendidos</span>
                <span className="text-base font-black text-amber-600 block mt-0.5">{diasVendidos}</span>
                <span className="text-[9px] text-amber-500 font-semibold block mt-0.5">Abono pecuniário</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-emerald-600 block">Dias Tirados</span>
                <span className="text-base font-black text-emerald-600 block mt-0.5">{diasTirados}</span>
                <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">Dias de gozo</span>
              </div>
            </div>
          </div>

          {/* Detalhamento dos Períodos de Férias */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Períodos de Férias ({periodosCount})
              </h3>
              {employee.feriasVendidas && (
                <span className="text-[9px] uppercase font-black bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  Abono Solicitado
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {employee.periodosFerias && employee.periodosFerias.map((period, i) => (
                <div key={i} className="p-3 bg-lavender/10 border border-lavender/35 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lavender text-yinmn rounded-lg flex items-center justify-center font-black text-xs">
                      {i + 1}º
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-yinmn uppercase block">Período de Gozo</span>
                      <p className="text-xs font-bold text-oxford mt-0.5">
                        De {formatarDataBR(period.dataInicio)} até {formatarDataBR(period.dataFim)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-yinmn bg-lavender/30 px-2.5 py-1 rounded-lg border border-lavender">
                      {period.dias} dias
                    </span>
                  </div>
                </div>
              ))}

              {(!employee.periodosFerias || employee.periodosFerias.length === 0) && (
                <div className="p-6 border border-dashed border-lavender/50 rounded-xl text-center text-slate-400 bg-slate-50/20">
                  <Calendar className="w-8 h-8 mx-auto text-jordy mb-1.5" />
                  <p className="text-xs font-semibold">Nenhuma escala de férias programada para este instrutor.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recomendação Automática */}
          <div className="p-4 rounded-xl bg-oxford text-white border border-cadet space-y-2">
            <div className="flex items-center gap-2 text-jordy">
              <BadgeAlert className="w-4 h-4 text-jordy" />
              <h4 className="text-xs font-black uppercase tracking-wider text-jordy">Recomendação de Gestão</h4>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-lavender">
              {recomendacao}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-lavender/40 flex gap-2">
          <button
            onClick={handleCopySummary}
            className="flex-1 text-xs bg-white hover:bg-lavender/10 text-slate-500 hover:text-yinmn font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-lavender active:scale-[0.98]"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600">Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                <span>Copiar Ficha de Férias</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
