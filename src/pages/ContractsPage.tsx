/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Calendar,
  AlertTriangle,
  User,
  Check,
  Edit,
  ClipboardList,
  X
} from "lucide-react";
import { RhEmployee, ContractRenewal, ContractRenewalStatus } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { obterContratos } from "../services/additionalDataSource";
import { ContractSummaryCard } from "../components/SummaryCard";

interface ContractsPageProps {
  employees: RhEmployee[];
  onUpdateEmployee: (emp: RhEmployee) => void;
  onSelectEmployee: (emp: RhEmployee) => void;
  defaultSearch?: string;
  onClearDefaultSearch?: () => void;
}

export const ContractsPage: React.FC<ContractsPageProps> = ({
  employees,
  onUpdateEmployee,
  onSelectEmployee,
  defaultSearch,
  onClearDefaultSearch
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Modal / form states for adding observations
  const [editingContract, setEditingContract] = useState<ContractRenewal | null>(null);
  const [obsText, setObsText] = useState("");
  const [decisionLimit, setDecisionLimit] = useState("");
  const [analystName, setAnalystName] = useState("");

  useEffect(() => {
    if (defaultSearch !== undefined) {
      setSearchTerm(defaultSearch);
    }
  }, [defaultSearch]);

  const contratos = obterContratos(employees);

  // Regras de Alerta de Contrato
  // 0 a 15 dias: Crítico
  // 16 a 30 dias: Alto
  // 31 a 60 dias: Médio
  // 61 a 90 dias: Baixo
  // Sem data de término: Cadastro incompleto
  const obterAlertaContrato = (c: ContractRenewal) => {
    if (!c.dataTerminoReal) {
      return { label: "Incompleto", color: "text-yinmn border-lavender", bg: "bg-lavender/30" };
    }
    if (c.diasRestantes === null) {
      return { label: "Incompleto", color: "text-yinmn border-lavender", bg: "bg-lavender/30" };
    }
    if (c.diasRestantes < 0) {
      return { label: "Expirado", color: "text-red-700 border-red-200 font-black", bg: "bg-red-50" };
    }
    if (c.diasRestantes <= 15) {
      return { label: "Crítico", color: "text-red-700 border-red-200 animate-pulse", bg: "bg-red-50" };
    }
    if (c.diasRestantes <= 30) {
      return { label: "Alto", color: "text-orange-700 border-orange-200", bg: "bg-orange-50" };
    }
    if (c.diasRestantes <= 60) {
      return { label: "Médio", color: "text-amber-700 border-amber-200", bg: "bg-amber-50" };
    }
    if (c.diasRestantes <= 90) {
      return { label: "Baixo", color: "text-blue-700 border-blue-200", bg: "bg-blue-50" };
    }
    return { label: "Sob Controle", color: "text-emerald-700 border-emerald-200", bg: "bg-emerald-50" };
  };

  const handleUpdateStatus = (c: ContractRenewal, newStatus: ContractRenewalStatus) => {
    // Achar o funcionário correspondente
    const emp = employees.find((e) => e.recordId === c.recordId);
    if (!emp) return;

    // Criar uma cópia com os dados atualizados de contrato
    const updated: RhEmployee = {
      ...emp,
      statusRenovacao: newStatus,
      responsavelAnalise: c.responsavelAnalise || "RH Coordenação",
      dataLimiteDecisao: c.dataLimiteDecisao || new Date().toISOString().split("T")[0]
    };

    onUpdateEmployee(updated);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    const emp = employees.find((e) => e.recordId === editingContract.recordId);
    if (!emp) return;

    const updated: RhEmployee = {
      ...emp,
      observacoesContrato: obsText,
      responsavelAnalise: analystName || "RH Analista",
      dataLimiteDecisao: decisionLimit || editingContract.dataLimiteDecisao
    };

    onUpdateEmployee(updated);
    setEditingContract(null);
    setObsText("");
  };

  const handleOpenEditModal = (c: ContractRenewal) => {
    setEditingContract(c);
    setObsText(c.observacoes || "");
    setDecisionLimit(c.dataLimiteDecisao || "");
    setAnalystName(c.responsavelAnalise || "");
  };

  // KPIs Calculations
  const v30 = contratos.filter((c) => c.diasRestantes !== null && c.diasRestantes >= 0 && c.diasRestantes <= 30).length;
  const v60 = contratos.filter((c) => c.diasRestantes !== null && c.diasRestantes > 30 && c.diasRestantes <= 60).length;
  const v90 = contratos.filter((c) => c.diasRestantes !== null && c.diasRestantes > 60 && c.diasRestantes <= 90).length;
  const totalCriticos = contratos.filter((c) => {
    const r = obterAlertaContrato(c);
    return r.label === "Crítico" || r.label === "Incompleto";
  }).length;

  const totalEmAnalise = contratos.filter((c) => c.statusRenovacao === "Em análise").length;
  const totalAguardandoAprovacao = contratos.filter((c) => c.statusRenovacao === "Aguardando aprovação").length;
  const totalRenovados = contratos.filter((c) => c.statusRenovacao === "Renovado").length;
  const totalNaoRenovar = contratos.filter((c) => c.statusRenovacao === "Não renovar").length;

  // Filtragem dos contratos
  const filteredContratos = contratos.filter((c) => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || c.statusRenovacao === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-lavender pb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-oxford flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-yinmn" />
          <span>Gestão de Contratos & Renovação</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Acompanhe o ciclo de vigência e as tomadas de decisões para extensão ou encerramento dos termos de instrutores.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
          <span className="text-[9px] uppercase font-black text-rose-600 tracking-wider block">Críticos</span>
          <span className="text-lg font-extrabold text-oxford block mt-0.5">{totalCriticos}</span>
        </div>

        <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100">
          <span className="text-[9px] uppercase font-black text-orange-600 tracking-wider block">Vence em 30d</span>
          <span className="text-lg font-extrabold text-oxford block mt-0.5">{v30}</span>
        </div>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
          <span className="text-[9px] uppercase font-black text-amber-600 tracking-wider block">Vence em 60d</span>
          <span className="text-lg font-extrabold text-oxford block mt-0.5">{v60}</span>
        </div>

        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
          <span className="text-[9px] uppercase font-black text-blue-600 tracking-wider block">Vence em 90d</span>
          <span className="text-lg font-extrabold text-oxford block mt-0.5">{v90}</span>
        </div>

        <div className="p-3 bg-lavender/30 rounded-2xl border border-lavender">
          <span className="text-[9px] uppercase font-black text-yinmn tracking-wider block">Em Análise</span>
          <span className="text-lg font-extrabold text-oxford block mt-0.5">{totalEmAnalise}</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[9px] uppercase font-black text-slate-600 tracking-wider block">Aguard. Aprov.</span>
          <span className="text-lg font-extrabold text-oxford block mt-0.5">{totalAguardandoAprovacao}</span>
        </div>

        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
          <span className="text-[9px] uppercase font-black text-emerald-600 tracking-wider block">Renovados</span>
          <span className="text-lg font-extrabold text-emerald-700 block mt-0.5">{totalRenovados}</span>
        </div>

        <div className="p-3 bg-red-100/50 rounded-2xl border border-red-200">
          <span className="text-[9px] uppercase font-black text-red-700 tracking-wider block">Não Renovar</span>
          <span className="text-lg font-extrabold text-red-900 block mt-0.5">{totalNaoRenovar}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-lavender shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por instrutor ou cargo de ensino..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value === "" && onClearDefaultSearch) {
                onClearDefaultSearch();
              }
            }}
            className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-lavender focus:outline-none focus:border-jordy focus:ring-1 focus:ring-jordy text-slate-700"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                if (onClearDefaultSearch) onClearDefaultSearch();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs font-bold text-slate-600 bg-slate-50 border border-lavender rounded-xl px-4 py-2.5 cursor-pointer focus:outline-none"
        >
          <option value="all">Status de Renovação (Todos)</option>
          <option value="Não iniciado">Não iniciado</option>
          <option value="Em análise">Em análise</option>
          <option value="Aguardando coordenação">Aguardando coordenação</option>
          <option value="Aguardando aprovação">Aguardando aprovação</option>
          <option value="Renovado">Renovado</option>
          <option value="Não renovar">Não renovar</option>
          <option value="Encerrado">Encerrado</option>
          <option value="Urgente">Urgente</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-lavender shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-lavender/50 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="py-4 px-5">Instrutor</th>
                <th className="py-4 px-4">Lotação / Campus</th>
                <th className="py-4 px-4">Admissão</th>
                <th className="py-4 px-4">Término Contrato</th>
                <th className="py-4 px-4 text-center">Dias Restantes</th>
                <th className="py-4 px-4">Status de Renovação</th>
                <th className="py-4 px-4">Responsável Decisão</th>
                <th className="py-4 px-4">Data Limite</th>
                <th className="py-4 px-4 text-center">Risco</th>
                <th className="py-4 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lavender/30 text-xs text-oxford">
              {filteredContratos.map((c) => {
                const risco = obterAlertaContrato(c);
                const originalEmployee = employees.find((e) => e.recordId === c.recordId);

                return (
                  <tr key={c.recordId} className="hover:bg-lavender/10 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-5">
                      <div
                        onClick={() => originalEmployee && onSelectEmployee(originalEmployee)}
                        className="font-extrabold text-oxford hover:text-yinmn cursor-pointer"
                      >
                        {c.nome}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block">{c.cargo}</span>
                    </td>

                    {/* Zone/Shift */}
                    <td className="py-4 px-4 space-y-0.5">
                      <span className="font-bold text-slate-600 text-[11px] block">{c.zona || "Não vinculada"}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{c.turno}</span>
                    </td>

                    {/* Admission */}
                    <td className="py-4 px-4 font-semibold text-slate-500">
                      {formatarDataBR(c.dataAdmissao)}
                    </td>

                    {/* Expiry */}
                    <td className="py-4 px-4 font-extrabold text-oxford">
                      {c.dataTerminoReal ? formatarDataBR(c.dataTerminoReal) : (
                        <span className="text-yinmn">Não cadastrada</span>
                      )}
                    </td>

                    {/* Days Left */}
                    <td className="py-4 px-4 text-center font-black">
                      {c.diasRestantes !== null ? (
                        <span className={c.diasRestantes <= 30 ? "text-rose-600" : "text-slate-600"}>
                          {c.diasRestantes}d
                        </span>
                      ) : (
                        <span className="text-yinmn">--</span>
                      )}
                    </td>

                    {/* Renewal Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        c.statusRenovacao === "Renovado"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : c.statusRenovacao === "Não renovar" || c.statusRenovacao === "Encerrado"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : c.statusRenovacao === "Urgente"
                          ? "bg-red-50 text-red-600 border border-red-100 animate-pulse"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {c.statusRenovacao}
                      </span>
                    </td>

                    {/* Decision Analyst */}
                    <td className="py-4 px-4 font-semibold text-slate-500">{c.responsavelAnalise}</td>

                    {/* Decision Deadline */}
                    <td className="py-4 px-4 font-semibold text-slate-500">{c.dataLimiteDecisao ? formatarDataBR(c.dataLimiteDecisao) : "--"}</td>

                    {/* Alert Risk */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border ${risco.color} ${risco.bg}`}>
                        {risco.label}
                      </span>
                    </td>

                    {/* Action Panel Buttons */}
                    <td className="py-4 px-5 text-right space-y-1">
                      <div className="flex justify-end gap-1.5 flex-wrap max-w-[200px] ml-auto">
                        <button
                          onClick={() => handleUpdateStatus(c, "Em análise")}
                          className="text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold"
                          title="Analisar"
                        >
                          Analisar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(c, "Aguardando aprovação")}
                          className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-bold"
                        >
                          Aprovação
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(c, "Renovado")}
                          className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold"
                        >
                          Renovar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(c, "Não renovar")}
                          className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-bold cursor-pointer"
                        >
                          Negar
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="text-[9px] bg-lavender/30 hover:bg-lavender/60 text-yinmn px-2 py-0.5 rounded border border-lavender/60 font-bold cursor-pointer"
                          title="Adicionar Observação ou Parecer"
                        >
                          Opinião
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredContratos.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 font-semibold">
                    <span>Nenhum contrato ativo corresponde aos filtros selecionados.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLYOUT MODAL — EDITAR PARECER / DATA LIMITE */}
      {editingContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-lavender max-w-md w-full p-6 shadow-2xl relative text-xs">
            <h3 className="text-sm font-black uppercase tracking-wider text-oxford mb-4">
              Parecer de Renovação Contratual
            </h3>

            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Instrutor</span>
                <p className="text-sm font-extrabold text-yinmn">{editingContract.nome}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{editingContract.cargo} • Expira em: {editingContract.dataTerminoReal ? formatarDataBR(editingContract.dataTerminoReal) : "Não informada"}</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Analista Responsável</label>
                <input
                  type="text"
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  placeholder="Ex: Letícia de Albuquerque"
                  className="w-full p-2.5 bg-slate-50 border border-lavender rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Data Limite de Decisão</label>
                <input
                  type="date"
                  value={decisionLimit}
                  onChange={(e) => setDecisionLimit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-lavender rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Parecer Recomendado / Justificativas</label>
                <textarea
                  value={obsText}
                  onChange={(e) => setObsText(e.target.value)}
                  rows={4}
                  placeholder="Justifique o motivo da recomendação de renovação ou encerramento (avaliação de turmas, pontualidade, etc.)..."
                  className="w-full p-2.5 bg-slate-50 border border-lavender rounded-xl font-semibold"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-2 border-t border-lavender/50">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-yinmn hover:bg-cadet text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Informações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
