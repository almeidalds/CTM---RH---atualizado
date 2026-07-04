/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  FileCheck2,
  FileWarning,
  ShieldCheck,
  Languages,
  Calendar,
  MapPin,
  Clock,
  Briefcase,
  Mail,
  AlertTriangle,
  Edit3
} from "lucide-react";
import { RhEmployee } from "../types/rh";
import { calcularQualidadeDados } from "../utils/dataQualityUtils";
import { identificarPendencias } from "../utils/riskUtils";
import { DataIssueBadge } from "../components/DataIssueBadge";

interface PendingPageProps {
  employees: RhEmployee[];
  onEditEmployee: (emp: RhEmployee) => void;
}

export const PendingPage: React.FC<PendingPageProps> = ({ employees, onEditEmployee }) => {
  const stats = calcularQualidadeDados(employees);

  // Filtrar apenas quem possui alguma pendência cadastral
  const employeesWithIssues = employees
    .map((e) => ({
      ...e,
      issues: identificarPendencias(e)
    }))
    .filter((e) => e.issues.length > 0)
    .sort((a, b) => {
      // Ordena de forma que registros com problemas de maior gravidade fiquem no topo
      const severityWeight = { "Crítica": 4, "Alta": 3, "Média": 2, "Baixa": 1 };
      const maxA = Math.max(...a.issues.map((i) => severityWeight[i.severity] || 0), 0);
      const maxB = Math.max(...b.issues.map((i) => severityWeight[i.severity] || 0), 0);
      return maxB - maxA;
    });

  const MiniKpi = ({ title, value, icon: Icon, colorClass, highlight }: { title: string; value: number | string; icon: any; colorClass: string; highlight?: boolean }) => (
    <div className={`p-4 rounded-2xl border bg-white shadow-[0_4px_12px_rgba(109,40,217,0.02)] flex items-center justify-between transition-all duration-300 ${highlight ? "border-purple-200 bg-purple-50/30" : "border-purple-100/40"}`}>
      <div className="min-w-0 pr-2">
        <span className="text-[10px] uppercase font-black text-slate-400 block truncate tracking-wider">{title}</span>
        <span className={`text-lg font-extrabold mt-1 block ${colorClass}`}>{value}</span>
      </div>
      <div className={`p-2.5 rounded-xl shrink-0 ${highlight ? "bg-purple-100 text-purple-600" : "bg-slate-50 text-slate-400"}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="border-b border-purple-100/30 pb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1A2C] flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-purple-600" />
          <span>Saneamento de Pendências Cadastrais</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Identifique e corrija omissões e lacunas de dados cruciais nos cadastros. Registros completos garantem relatórios e análises de risco precisas.
        </p>
      </div>

      {/* Mini KPIs Quality Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <MiniKpi title="Total" value={stats.total} icon={Briefcase} colorClass="text-[#1F1A2C]" />
        <MiniKpi title="Completos" value={stats.completos} icon={ShieldCheck} colorClass="text-emerald-600" highlight={stats.percentualQualidade === 100} />
        <MiniKpi title="Pendentes" value={stats.comPendencia} icon={FileWarning} colorClass="text-rose-600" />
        <MiniKpi title="Sem Idioma" value={stats.semIdioma} icon={Languages} colorClass="text-amber-600" />
        <MiniKpi title="Sem Término" value={stats.semDataTermino} icon={Calendar} colorClass="text-rose-600" />
        <MiniKpi title="Sem Zona" value={stats.semZona} icon={MapPin} colorClass="text-amber-600" />
        <MiniKpi title="Sem Turno" value={stats.semTurno} icon={Clock} colorClass="text-amber-600" />
        <MiniKpi title="Sem Cargo" value={stats.semCargo} icon={Briefcase} colorClass="text-amber-600" />
        <MiniKpi title="Sem E-mail" value={stats.semEmail} icon={Mail} colorClass="text-purple-600" />
      </div>

      {/* Main Remediator Section */}
      <div className="bg-white p-6 rounded-2xl border border-purple-50/70 shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#1F1A2C]">Registros Pendentes de Correção</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Clique em editar para suprir dados faltantes e recalcular conformidade do sistema</p>
          </div>
          
          <div className="text-xs font-black text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-100/30 flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Qualidade Global: {stats.percentualQualidade}%</span>
          </div>
        </div>

        {/* Datagrid of Issues */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-purple-50/40 text-slate-400 font-black uppercase text-[10px] bg-[#FAF9FF]">
                <th className="py-3 px-3 text-left">Funcionário</th>
                <th className="py-3 px-3 text-left">ID Funcional</th>
                <th className="py-3 px-3 text-left">Cargo</th>
                <th className="py-3 px-3 text-left">Turno/Zona</th>
                <th className="py-3 px-3 text-left">E-mail Corporativo</th>
                <th className="py-3 px-3 text-left">Lacunas Identificadas</th>
                <th className="py-3 px-3 text-center">Severidade Máxima</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50/45">
              {employeesWithIssues.map((emp) => {
                // Descobrir a gravidade máxima do registro
                const gravidades = emp.issues.map((i) => i.severity);
                const maxSeverity = gravidades.includes("Crítica")
                  ? "Crítica"
                  : gravidades.includes("Alta")
                  ? "Alta"
                  : gravidades.includes("Média")
                  ? "Média"
                  : "Baixa";

                return (
                  <tr key={emp.recordId} className="hover:bg-purple-50/20 transition-colors duration-200">
                    {/* Nome */}
                    <td className="py-3.5 px-3 font-extrabold text-[#1F1A2C]">{emp.nome}</td>
                    
                    {/* ID */}
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-400">
                      {emp.idFuncionario ? emp.idFuncionario : <span className="text-rose-500 font-black bg-rose-50 px-1.5 py-0.5 rounded-md">Pendente</span>}
                    </td>

                    {/* Cargo */}
                    <td className="py-3.5 px-3 text-slate-500 font-semibold">{emp.cargo || <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-extrabold text-[9px] uppercase">Sem cargo</span>}</td>

                    {/* Lotação */}
                    <td className="py-3.5 px-3 text-slate-500 font-semibold">
                      <div>{emp.turno || <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-extrabold text-[9px] uppercase">Sem turno</span>}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{emp.zona || <span className="text-amber-500 text-[9px] font-bold">Sem zona</span>}</div>
                    </td>

                    {/* E-mail */}
                    <td className="py-3.5 px-3 font-semibold text-slate-500">
                      {emp.emailCorporativo || <span className="text-slate-300 italic font-normal">Não fornecido</span>}
                    </td>

                    {/* Lista de Erros */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 max-w-[280px]">
                        {emp.issues.map((iss, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold">
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${iss.severity === "Crítica" ? "text-rose-500" : "text-amber-500"}`} />
                            <span className="truncate">{iss.label}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Severidade */}
                    <td className="py-3.5 px-3 text-center">
                      <DataIssueBadge severity={maxSeverity} />
                    </td>

                    {/* Editar */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="inline-flex items-center gap-1.5 bg-[#FAF9FF] hover:bg-purple-50 text-slate-500 hover:text-purple-600 font-bold px-3 py-1.5 rounded-xl border border-purple-100/30 transition-all duration-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {employeesWithIssues.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h4 className="text-base font-extrabold text-[#1F1A2C]">Base de dados 100% sã!</h4>
                      <p className="text-xs text-slate-400 font-semibold">Todos os cadastros estão devidamente preenchidos e válidos.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
