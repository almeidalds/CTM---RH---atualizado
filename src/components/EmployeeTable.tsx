/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit2, AlertCircle, HelpCircle } from "lucide-react";
import { RhEmployee, RiskLevel } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";
import { StatusBadge } from "./StatusBadge";
import { RiskBadge } from "./RiskBadge";

interface EmployeeTableProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
  onEditEmployee: (emp: RhEmployee) => void;
}

type SortField = "idFuncionario" | "nome" | "cargo" | "zona" | "turno" | "statusFuncionario" | "diasRestantes" | "risco";
type SortOrder = "asc" | "desc";

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onSelectEmployee,
  onEditEmployee
}) => {
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Ordenação dos funcionários baseada no estado do cabeçalho
  const sortedEmployees = [...employees].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";

    if (sortField === "diasRestantes") {
      valA = calcularDiasRestantes(a.dataTerminoReal) ?? 9999;
      valB = calcularDiasRestantes(b.dataTerminoReal) ?? 9999;
    } else if (sortField === "risco") {
      const riscoA = calcularRisco(a);
      const riscoB = calcularRisco(b);
      // Ordem lógica de prioridade de risco
      const riscoPrioridade: Record<RiskLevel, number> = {
        "Crítico": 1,
        "Alto": 2,
        "Médio": 3,
        "Baixo": 4,
        "Sem risco": 5,
        "Cadastro incompleto": 6
      };
      valA = riscoPrioridade[riscoA] || 99;
      valB = riscoPrioridade[riscoB] || 99;
    } else {
      valA = (a[sortField as keyof RhEmployee] as string || "").toLowerCase();
      valB = (b[sortField as keyof RhEmployee] as string || "").toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => {
    const isCurrent = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className="py-3.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#FAF9FF] cursor-pointer select-none transition-colors hover:bg-purple-100/50"
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {isCurrent ? (
            sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-60" />
          )}
        </div>
      </th>
    );
  };

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-purple-50/75 p-12 text-center shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)]">
        <HelpCircle className="w-12 h-12 text-purple-200 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-[#1F1A2C] mb-1">Nenhum funcionário encontrado</h3>
        <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
          Não há registros correspondentes aos filtros selecionados. Tente ajustar os parâmetros na barra de pesquisa.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-purple-50/70 shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)] overflow-hidden flex flex-col">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[1100px] border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-purple-50/55">
              <SortHeader field="idFuncionario" label="ID" />
              <SortHeader field="nome" label="Nome" />
              <SortHeader field="cargo" label="Cargo" />
              <SortHeader field="zona" label="Zona" />
              <SortHeader field="turno" label="Turno" />
              <th className="py-3.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#FAF9FF]">Idiomas</th>
              <SortHeader field="statusFuncionario" label="Status" />
              <th className="py-3.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#FAF9FF]">Admissão</th>
              <th className="py-3.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#FAF9FF]">Término</th>
              <SortHeader field="diasRestantes" label="Dias" />
              <SortHeader field="risco" label="Risco" />
              <th className="py-3.5 px-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#FAF9FF]">Pendências</th>
              <th className="py-3.5 px-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#FAF9FF] sticky right-0 shadow-l z-10">Ações</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-purple-50/45">
            {sortedEmployees.map((emp) => {
              const risk = calcularRisco(emp);
              const pendencias = identificarPendencias(emp);
              const dias = calcularDiasRestantes(emp.dataTerminoReal);
              
              // Estilos de destaque para avisos importantes
              const isCritical = risk === "Crítico";
              const hasCriticalIssues = pendencias.some((p) => p.severity === "Crítica");
              
              let rowBg = "hover:bg-purple-50/20";
              if (isCritical) {
                rowBg = "bg-rose-50/30 hover:bg-rose-50/50";
              } else if (hasCriticalIssues) {
                rowBg = "bg-amber-50/20 hover:bg-amber-50/40";
              }

              return (
                <tr key={emp.recordId} className={`transition-colors text-xs font-semibold text-slate-600 ${rowBg}`}>
                  {/* ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400 whitespace-nowrap">
                    {emp.idFuncionario || (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Ausente
                      </span>
                    )}
                  </td>

                  {/* Nome */}
                  <td className="py-3.5 px-4 font-extrabold text-[#1F1A2C] whitespace-nowrap">
                    {emp.nome}
                  </td>

                  {/* Cargo */}
                  <td className="py-3.5 px-4 text-slate-500 font-semibold whitespace-nowrap">{emp.cargo || "Não definido"}</td>

                  {/* Zona */}
                  <td className="py-3.5 px-4 text-slate-500 font-semibold whitespace-nowrap">
                    {emp.zona ? (
                      emp.zona
                    ) : (
                      <span className="text-amber-600 bg-amber-50 border border-amber-100/70 px-2 py-0.5 rounded-md text-[9px] font-extrabold">Sem zona</span>
                    )}
                  </td>

                  {/* Turno */}
                  <td className="py-3.5 px-4 text-slate-500 font-semibold whitespace-nowrap">
                    {emp.turno ? (
                      emp.turno
                    ) : (
                      <span className="text-amber-600 bg-amber-50 border border-amber-100/70 px-2 py-0.5 rounded-md text-[9px] font-extrabold">Sem turno</span>
                    )}
                  </td>

                  {/* Idiomas */}
                  <td className="py-3.5 px-4 whitespace-nowrap max-w-[150px] truncate" title={emp.idiomas?.join(", ")}>
                    {emp.idiomas && emp.idiomas.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {emp.idiomas.slice(0, 2).map((l) => (
                          <span key={l} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                            {l}
                          </span>
                        ))}
                        {emp.idiomas.length > 2 && (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                            +{emp.idiomas.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-600 bg-amber-50 border border-amber-100/70 px-2 py-0.5 rounded-md text-[9px] font-extrabold">Nenhum</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={emp.statusFuncionario} />
                  </td>

                  {/* Admissão */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-medium">{formatarDataBR(emp.dataAdmissao)}</td>

                  {/* Término */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-medium">
                    {emp.dataTerminoReal ? (
                      formatarDataBR(emp.dataTerminoReal)
                    ) : (
                      <span className="text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[9px] font-extrabold">Não informada</span>
                    )}
                  </td>

                  {/* Dias */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold">
                    {dias !== null && dias >= 0 ? (
                      <span className={dias <= 30 ? "text-rose-600 font-black bg-rose-50 px-1.5 py-0.5 rounded-md" : "text-slate-700"}>
                        {dias} d
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Risco */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskBadge level={risk} />
                  </td>

                  {/* Pendências */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    {pendencias.length > 0 ? (
                      <span className="inline-flex items-center justify-center bg-rose-50 text-rose-600 font-black px-2 py-0.5 rounded-md border border-rose-100">
                        {pendencias.length} {pendencias.length === 1 ? "erro" : "erros"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-md border border-emerald-100">
                        OK
                      </span>
                    )}
                  </td>

                  {/* Ações (sticky col) */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-purple-50/10 z-10 border-l border-purple-50 shadow-l">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onSelectEmployee(emp)}
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Ver ficha completa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Editar cadastro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Stats */}
      <div className="p-4 bg-[#FAF9FF] border-t border-purple-50/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <span className="text-xs text-slate-400 font-bold">
          Exibindo {employees.length} de {employees.length} registros filtrados
        </span>
        <div className="flex gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-white border border-purple-100/30 px-2.5 py-1 rounded-lg">
            Admissão Média CTM
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-white border border-purple-100/30 px-2.5 py-1 rounded-lg">
            Ref: 2026
          </span>
        </div>
      </div>
    </div>
  );
};
