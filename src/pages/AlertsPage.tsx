/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  User,
  ExternalLink,
  BookOpen,
  Calendar,
  AlertOctagon,
  RefreshCw,
  FolderMinus
} from "lucide-react";
import { RhEmployee, Substitution, AbsenceItem } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes, getToday } from "../utils/dateUtils";
import { obterSubstituicoes } from "../services/additionalDataSource";
import { validarLimiteAusencias, calcularMapaOcupacaoDias } from "../utils/absenceUtils";
import { identificarPendencias } from "../utils/riskUtils";

export type LocalAlertSeverity = "Crítica" | "Alta" | "Média" | "Baixa" | "Informativa";
export type LocalAlertCategory = "Contrato" | "Férias" | "Substituição" | "Cadastro" | "Risco" | "Capacidade" | "Operacional";

export interface SystemAlert {
  alertId: string;
  tipo: string;
  descricao: string;
  gravidade: LocalAlertSeverity;
  categoria: LocalAlertCategory;
  dataGeracao: string;
  status: "Novo" | "Em análise" | "Em andamento" | "Resolvido" | "Ignorado";
  relatedEmployeeId?: string;
}

interface AlertsPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
  onRefreshData?: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  employees,
  onSelectEmployee,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<Record<string, string>>({});
  const [alertStatuses, setAlertStatuses] = useState<Record<string, string>>({});

  // MOTOR DINÂMICO DE GERAÇÃO DE ALERTAS
  useEffect(() => {
    const list: SystemAlert[] = [];
    const substitutions = obterSubstituicoes();

    // 1. Verificar Contratos Vencendo ou Vencidos
    employees.forEach((emp) => {
      if (emp.statusFuncionario === "Ativo") {
        const dias = calcularDiasRestantes(emp.dataTerminoReal);
        if (dias !== null) {
          if (dias < 0) {
            list.push({
              alertId: `alert-contract-expired-${emp.recordId}`,
              tipo: "Contrato vencido",
              descricao: `O contrato do instrutor ${emp.nome} expirou em ${formatarDataBR(emp.dataTerminoReal)} (${Math.abs(dias)} dias atrás). Ação urgente de regularização exigida!`,
              gravidade: "Crítica",
              categoria: "Contrato",
              dataGeracao: getToday(),
              status: "Novo",
              relatedEmployeeId: emp.recordId
            });
          } else if (dias <= 30) {
            list.push({
              alertId: `alert-contract-warn-${emp.recordId}`,
              tipo: "Contrato prestes a vencer",
              descricao: `O contrato do instrutor ${emp.nome} vence em ${formatarDataBR(emp.dataTerminoReal)} (restam apenas ${dias} dias). Necessário parecer de renovação.`,
              gravidade: "Alta",
              categoria: "Contrato",
              dataGeracao: getToday(),
              status: "Novo",
              relatedEmployeeId: emp.recordId
            });
          }
        }
      }
    });

    // 2. Verificar Férias sem Cobertura cadastrada
    employees.forEach((emp) => {
      if (emp.statusFuncionario === "Ativo" && emp.periodosFerias) {
        emp.periodosFerias.forEach((f, idx) => {
          // Checar se há substituição correspondente com substituto definido
          const temSubstituto = substitutions.some(
            (s) =>
              s.instrutorAusente === emp.nome &&
              s.dataInicio === f.dataInicio &&
              s.substituto &&
              s.substituto.trim() !== "" &&
              s.status !== "Cancelada"
          );

          if (!temSubstituto) {
            list.push({
              alertId: `alert-no-cover-${emp.recordId}-${idx}`,
              tipo: "Férias sem cobertura cadastrada",
              descricao: `Férias programadas para ${emp.nome} de ${formatarDataBR(f.dataInicio)} a ${formatarDataBR(f.dataFim)} não possuem Funcionário substituto homologado no sistema.`,
              gravidade: "Alta",
              categoria: "Férias",
              dataGeracao: getToday(),
              status: "Novo",
              relatedEmployeeId: emp.recordId
            });
          }
        });
      }
    });

    // 3. Verificar Direito Adquirido Acumulado
    employees.forEach((emp) => {
      if (emp.statusFuncionario === "Ativo" && emp.direitoAdquirido) {
        // Se já passou o período limite ou tem mais de 30 dias de direito e não tem férias gozadas
        const saldo = emp.saldoFeriasDisponivel ?? 0;
        if (saldo >= 30) {
          list.push({
            alertId: `alert-vacation-accrued-${emp.recordId}`,
            tipo: "Acúmulo de direito de férias",
            descricao: `O instrutor ${emp.nome} acumulou mais de ${saldo} dias de direito de férias disponíveis sem agendamento no curto prazo. Risco de passivo trabalhista!`,
            gravidade: "Média",
            categoria: "Férias",
            dataGeracao: getToday(),
            status: "Novo",
            relatedEmployeeId: emp.recordId
          });
        }
      }
    });

    // 4. Inconsistências cadastrais críticas
    employees.forEach((emp) => {
      const pends = identificarPendencias(emp);
      if (pends.length > 0) {
        pends.forEach((p, idx) => {
          list.push({
            alertId: `alert-inconsistency-${emp.recordId}-${idx}`,
            tipo: "Inconsistência cadastral",
            descricao: `O cadastro do Funcionário ${emp.nome} apresenta inconsistência: ${p.label}.`,
            gravidade: p.severity === "Alta" ? "Alta" : "Média",
            categoria: "Cadastro",
            dataGeracao: getToday(),
            status: "Novo",
            relatedEmployeeId: emp.recordId
          });
        });
      }
    });

    // 5. Verificar Regra de Limite Simultâneo de Férias/Ausências (> 8 pessoas no mesmo período)
    // Montar todos os afastamentos
    const ausencias: AbsenceItem[] = [];
    employees.forEach((emp) => {
      emp.periodosFerias?.forEach((f) => {
        ausencias.push({
          id: emp.recordId,
          nome: emp.nome,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim,
          tipo: "Férias"
        });
      });
    });
    substitutions.forEach((s) => {
      if (s.status !== "Cancelada") {
        ausencias.push({
          id: s.recordId,
          nome: s.instrutorAusente,
          dataInicio: s.dataInicio,
          dataFim: s.dataFim,
          tipo: s.motivo
        });
      }
    });

    const mapaOcupacao = calcularMapaOcupacaoDias(ausencias);
    const diasExcedidos = Object.keys(mapaOcupacao).filter((dia) => mapaOcupacao[dia].length > 8);

    if (diasExcedidos.length > 0) {
      // Agrupar dias contíguos para um único alerta limpo
      const sortedDays = [...diasExcedidos].sort();
      list.push({
        alertId: `alert-simultaneous-limit-exceeded`,
        tipo: "Limite simultâneo excedido",
        descricao: `Risco Operacional! Há períodos críticos onde a regra de limite de no máximo 8 pessoas ausentes no mesmo dia é desrespeitada. Datas impactadas: ${sortedDays.slice(0, 5).map(formatarDataBR).join(", ")}${sortedDays.length > 5 ? `... (+${sortedDays.length - 5} dias)` : ""}.`,
        gravidade: "Crítica",
        categoria: "Risco",
        dataGeracao: getToday(),
        status: "Novo"
      });
    }

    const mapped = list.map(a => ({...a, status: (alertStatuses[a.alertId] as SystemAlert["status"]) || a.status}));
    setAlerts(mapped);
  }, [employees]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setAlertStatuses(prev => ({...prev, [id]: newStatus as SystemAlert["status"]}));
  };

  const handleAssignResponsibility = (id: string, name: string) => {
    setAssignedUsers({
      ...assignedUsers,
      [id]: name
    });
  };

  const getSeverityBadge = (sev: LocalAlertSeverity) => {
    switch (sev) {
      case "Crítica":
        return "bg-red-100 text-red-700 border border-red-200 animate-pulse font-black";
      case "Alta":
        return "bg-orange-100 text-orange-700 border border-orange-200 font-extrabold";
      case "Média":
        return "bg-amber-100 text-amber-700 border border-amber-200 font-semibold";
      default:
        return "bg-blue-100 text-blue-700 border border-blue-200 font-medium";
    }
  };

  const getCategoryColor = (cat: LocalAlertCategory) => {
    switch (cat) {
      case "Risco":
        return "text-red-600";
      case "Contrato":
        return "text-blue-600";
      case "Férias":
        return "text-yinmn";
      case "Substituição":
        return "text-amber-600";
      default:
        return "text-slate-600";
    }
  };

  // Filtragem dos alertas
  const filteredAlerts = alerts
    .filter((a) => {
      // Excluir ou marcar resolvido localmente
      const stateResolved = alertStatuses[a.alertId] === "Resolvido";
      if (selectedStatus === "Resolvido" && !stateResolved) return false;
      if (selectedStatus === "Pendente" && stateResolved) return false;

      const matchesSearch =
        a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = selectedSeverity === "all" || a.gravidade === selectedSeverity;
      const matchesCategory = selectedCategory === "all" || a.categoria === selectedCategory;

      return matchesSearch && matchesSeverity && matchesCategory;
    });

  // KPI Counters
  const countCriticos = alerts.filter((a) => a.gravidade === "Crítica" && alertStatuses[a.alertId] !== "Resolvido").length;
  const countAltos = alerts.filter((a) => a.gravidade === "Alta" && alertStatuses[a.alertId] !== "Resolvido").length;
  const countMedios = alerts.filter((a) => a.gravidade === "Média" && alertStatuses[a.alertId] !== "Resolvido").length;
  const countResolvidos = Object.values(alertStatuses).filter(s => s === "Resolvido").length;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-sky-100 pb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1A2C] flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-yinmn animate-swing" />
          <span>Central de Alertas Operacionais Inteligentes</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Algoritmo de cruzamento em tempo real que audita vencimentos, ausências simultâneas e falhas de cobertura dos Funcionários.
        </p>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-black text-red-600 tracking-wider">Alertas Críticos</span>
            <span className="text-xl font-black text-red-900 block mt-0.5">{countCriticos}</span>
          </div>
          <AlertOctagon className="w-8 h-8 text-red-300" />
        </div>

        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-black text-orange-600 tracking-wider">Gravidade Alta</span>
            <span className="text-xl font-black text-orange-900 block mt-0.5">{countAltos}</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-orange-300" />
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-black text-amber-600 tracking-wider">Gravidade Média</span>
            <span className="text-xl font-black text-amber-900 block mt-0.5">{countMedios}</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-300" />
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-black text-emerald-600 tracking-wider">Tratados / Resolvidos</span>
            <span className="text-xl font-black text-emerald-900 block mt-0.5">{countResolvidos}</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-300" />
        </div>
      </div>

      {/* Filter and search actions */}
      <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar alertas por palavras chaves ou descrições..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:border-jordy text-slate-700"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Gravidade */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs font-bold text-slate-600 bg-slate-50 border border-sky-100 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="all">Gravidade (Todas)</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-bold text-slate-600 bg-slate-50 border border-sky-100 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="all">Categoria (Todas)</option>
            <option value="Contrato">Contrato</option>
            <option value="Férias">Férias</option>
            <option value="Substituição">Substituição</option>
            <option value="Cadastro">Cadastro</option>
            <option value="Risco">Risco</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-bold text-slate-600 bg-slate-50 border border-sky-100 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="Pendente">Apenas Pendentes</option>
            <option value="Resolvido">Apenas Tratados / Resolvidos</option>
            <option value="all">Pendente + Resolvido</option>
          </select>
        </div>
      </div>

      {/* Live Alerts Stream Feed */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alert) => {
          const status = alert.status || "Novo";
          const isResolved = status === "Resolvido";
          const isIgnored = status === "Ignorado";
          const currentAssignee = assignedUsers[alert.alertId] || "";
          const relatedEmployee = employees.find((emp) => emp.recordId === alert.relatedEmployeeId);

          return (
            <div
              key={alert.alertId}
              className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isResolved
                  ? "bg-slate-50/70 border-slate-100 opacity-60"
                  : alert.gravidade === "Crítica"
                  ? "bg-red-50/20 border-red-100 hover:border-red-200"
                  : alert.gravidade === "Alta"
                  ? "bg-orange-50/20 border-orange-100 hover:border-orange-200"
                  : "bg-[#FAF9FF] border-sky-100 hover:border-sky-200"
              }`}
            >
              {/* Alert Content */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Visual Status Indicator Icon */}
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isResolved
                    ? "bg-emerald-100 text-emerald-600"
                    : alert.gravidade === "Crítica"
                    ? "bg-red-100 text-red-600"
                    : alert.gravidade === "Alta"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-sky-100 text-yinmn"
                }`}>
                  {isResolved ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isIgnored ? (
                    <FolderMinus className="w-4 h-4" />
                  ) : alert.gravidade === "Crítica" ? (
                    <AlertOctagon className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </span>

                {/* Body details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-extrabold text-[#1F1A2C] text-sm">{alert.tipo}</span>
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${getSeverityBadge(alert.gravidade)}`}>
                      {alert.gravidade}
                    </span>
                    <span className={`text-[10px] font-black uppercase ${getCategoryColor(alert.categoria)}`}>
                      {alert.categoria}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">• Gerado em: {formatarDataBR(alert.dataGeracao)}</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{alert.descricao}</p>
                  
                  {/* Related employee info shortcut if applicable */}
                  {relatedEmployee && (
                    <div className="pt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Funcionário associado:</span>
                      <button
                        onClick={() => onSelectEmployee(relatedEmployee)}
                        className="text-[10px] font-black text-yinmn hover:underline flex items-center gap-0.5"
                      >
                        {relatedEmployee.nome}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action and assignment panel */}
              <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-sky-100 shrink-0">
                {/* Assigner */}
                <div className="flex items-center gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={currentAssignee}
                    onChange={(e) => handleAssignResponsibility(alert.alertId, e.target.value)}
                    className="text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-sky-100 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="">Atribuir analista...</option>
                    <option value="Letícia">Letícia (Férias)</option>
                    <option value="Robson">Robson (Diretor)</option>
                    <option value="Letícia de Albuquerque">Letícia de Albuquerque</option>
                    <option value="Coordenação Geral">Coordenação Geral</option>
                  </select>
                </div>

                {/* Resolve buttons */}
                
                  <select 
                    value={status}
                    onChange={(e) => handleStatusChange(alert.alertId, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none cursor-pointer ${
                      status === "Resolvido" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      status === "Em andamento" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      status === "Em análise" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      status === "Ignorado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                      "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <option value="Novo">Novo</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Resolvido">Resolvido</option>
                    <option value="Ignorado">Ignorado</option>
                  </select>
  
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center border border-sky-100/50 shadow-sm text-slate-400 font-semibold">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-black text-[#1F1A2C]">Excelente! Central Totalmente Limpa</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Todos os riscos operacionais, inconsistências e férias vencidas estão devidamente monitorados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
