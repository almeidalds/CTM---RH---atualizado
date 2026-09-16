/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldAlert,
  CalendarDays,
  FileWarning,
  Globe,
  Hourglass,
  CalendarPlus,
  Compass,
  TrendingDown,
  Layers3,
  CalendarCheck2,
  CalendarClock,
  AlertOctagon,
  Languages,
  Sparkles,
  Search,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  MapPin,
  Clock
} from "lucide-react";
import { RhEmployee, RiskLevel } from "../types/rh";
import { DataIntegrityCard, DistributionPanel } from "../components/DashboardAnalytics";
import { DeparturesChart } from "../components/DeparturesChart";
import { KpiCard } from "../components/KpiCard";
import {
  IdiomaChart,
  ZonaChart,
  TurnoChart,
  StatusChart,
  RiscoChart,
  ChartCard
} from "../components/Charts";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco } from "../utils/riskUtils";
import { calcularQualidadeDados } from "../utils/dataQualityUtils";
import {
  agruparPorIdioma,
  agruparPorZona,
  agruparPorTurno,
  gerarResumoExecutivo
} from "../utils/groupUtils";
import { RiskBadge } from "../components/RiskBadge";

interface ReportsPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  employees,
  onSelectEmployee
}) => {
  const [showMoreKPIs, setShowMoreKPIs] = useState(false);

  // 1. PROCESSAR MÉTRICAS DOS INDICADORES
  const total = employees.length;
  const ativos = employees.filter((e) => e.statusFuncionario === "Ativo").length;
  const instrutoresAtivos = employees.filter(
    (e) => e.statusFuncionario === "Ativo" && e.cargo?.toLowerCase().includes("instrutor")
  ).length;
  const encerrados = employees.filter((e) => e.statusFuncionario === "Encerrado").length;
  const aComecar = employees.filter((e) => e.statusFuncionario === "A começar").length;

  // Saídas previstas
  const saem30 = employees.filter((e) => {
    if (e.statusFuncionario === "Encerrado" || !e.dataTerminoReal) return false;
    const d = calcularDiasRestantes(e.dataTerminoReal);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  const saem60 = employees.filter((e) => {
    if (e.statusFuncionario === "Encerrado" || !e.dataTerminoReal) return false;
    const d = calcularDiasRestantes(e.dataTerminoReal);
    return d !== null && d >= 0 && d <= 60;
  }).length;

  const saem90 = employees.filter((e) => {
    if (e.statusFuncionario === "Encerrado" || !e.dataTerminoReal) return false;
    const d = calcularDiasRestantes(e.dataTerminoReal);
    return d !== null && d >= 0 && d <= 90;
  }).length;

  const saem180 = employees.filter((e) => {
    if (e.statusFuncionario === "Encerrado" || !e.dataTerminoReal) return false;
    const d = calcularDiasRestantes(e.dataTerminoReal);
    return d !== null && d >= 0 && d <= 180;
  }).length;

  // Contratos críticos (0 a 15 dias)
  const contratosCriticos = employees.filter((e) => {
    if (e.statusFuncionario === "Encerrado") return false;
    return calcularRisco(e) === "Crítico";
  }).length;

  // Idiomas ativos
  const idiomasSet = new Set<string>();
  employees.forEach((emp) => {
    if (emp.statusFuncionario === "Ativo" && emp.idiomas) {
      emp.idiomas.forEach((l) => {
        if (l && l.trim() !== "") idiomasSet.add(l.trim());
      });
    }
  });
  const totalIdiomasAtivos = idiomasSet.size;

  // Cadastros com pendência
  const qualidade = calcularQualidadeDados(employees);
  const comPendencia = qualidade.comPendencia;

  // Resumo executivo / Próxima saída real
  const executivo = gerarResumoExecutivo(employees);
  const proximasSaidasDisponiveis = employees
    .filter((e) => e.statusFuncionario === "Ativo" && e.dataTerminoReal)
    .map((e) => ({
      ...e,
      dias: calcularDiasRestantes(e.dataTerminoReal)
    }))
    .filter((e) => e.dias !== null && e.dias >= 0)
    .sort((a, b) => (a.dias || 0) - (b.dias || 0));

  const proximaSaida = proximasSaidasDisponiveis[0] || null;

  // Encontrar o Funcionário crítico Yuki Tanaka para atalho inteligente no painel "Reminders"
  const yukiTanakaFuncionário = employees.find((e) => e.nome.includes("Yuki Tanaka")) || proximaSaida;

  // Zona com maior concentração de saídas nos próximos 90 dias
  const saídasPorZona90: Record<string, number> = {};
  employees.forEach((e) => {
    if (e.statusFuncionario === "Ativo" && e.dataTerminoReal && e.zona) {
      const d = calcularDiasRestantes(e.dataTerminoReal);
      if (d !== null && d >= 0 && d <= 90) {
        saídasPorZona90[e.zona] = (saídasPorZona90[e.zona] || 0) + 1;
      }
    }
  });
  let zonaMaiorConcentracao = "Nenhuma";
  let maxZonaCount = 0;
  Object.entries(saídasPorZona90).forEach(([z, count]) => {
    if (count > maxZonaCount) {
      maxZonaCount = count;
      zonaMaiorConcentracao = `${z} (${count} saídas)`;
    }
  });

  // Agrupamentos para os gráficos do dashboard
  const listIdiomas = agruparPorIdioma(employees);
  const listZonas = agruparPorZona(employees);
  const listTurnos = agruparPorTurno(employees);
  
  const listStatus = [
    { name: "Ativo", count: ativos, percentage: total > 0 ? Math.round((ativos / total) * 100) : 0 },
    { name: "A começar", count: aComecar, percentage: total > 0 ? Math.round((aComecar / total) * 100) : 0 },
    { name: "Encerrado", count: encerrados, percentage: total > 0 ? Math.round((encerrados / total) * 100) : 0 },
  ];

  const riscosCounts = { "Crítico": 0, "Alto": 0, "Médio": 0, "Baixo": 0, "Sem risco": 0, "Cadastro incompleto": 0 };
  employees.forEach((e) => {
    const r = calcularRisco(e);
    riscosCounts[r]++;
  });
  const listRiscos = Object.entries(riscosCounts).map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Dashboard header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-oxford tracking-tight flex items-center gap-1">
            Dashboard<span className="text-jordy">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-1">
            Planeje, priorize e gerencie os prazos contratuais de Funcionários com facilidade.
          </p>
        </div>


      </div>

      {/* 2. Top 4 Core Metric Cards - modeled exactly after the mockup's top row cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Funcionários Ativos - highlighted slate/blue card */}
        <KpiCard
          title="Total Funcionários Ativos"
          value={ativos}
          icon={Users}
          colorType="blue"
          subtitle="Aumento de 4% este mês"
          isFirst={true}
        />

        {/* Contratos Críticos */}
        <KpiCard
          title="Contratos Críticos"
          value={contratosCriticos}
          icon={AlertOctagon}
          colorType="red"
          subtitle="Vencimento menor que 15 dias"
        />

        {/* Ausências & Substituições */}
        <KpiCard
          title="Escala & Ausências"
          value={saem30}
          icon={Hourglass}
          colorType="orange"
          subtitle="Saídas iminentes em 30 dias"
        />

        {/* Pendências Cadastrais */}
        <KpiCard
          title="Inconsistências Cadastrais"
          value={comPendencia}
          icon={FileWarning}
          colorType="blue"
          subtitle="Falta de dados críticos"
        />
      </div>

      {/* Collapsible Section for remaining 8 metrics to clean up the page layout */}
      <div className="border-t border-sky-100/80 pt-1 flex justify-center">
        <button
          onClick={() => setShowMoreKPIs(!showMoreKPIs)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-50/50 border border-sky-100 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-yinmn hover:bg-sky-50 transition-all active:scale-95 cursor-pointer"
        >
          <span>{showMoreKPIs ? "Ocultar Métricas Secundárias" : "Exibir Mais Indicadores"}</span>
          {showMoreKPIs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showMoreKPIs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
          <KpiCard title="Total Cadastros" value={total} icon={Users} colorType="gray" subtitle="Total geral histórico" />
          <KpiCard title="Funcionários a Começar" value={aComecar} icon={CalendarPlus} colorType="blue" subtitle="Admissões futuras" />
          <KpiCard title="Funcionários Desligados" value={encerrados} icon={TrendingDown} colorType="gray" subtitle="Contratos finalizados" />
          <KpiCard title="Idiomas Ativos" value={totalIdiomasAtivos} icon={Globe} colorType="blue" subtitle="Línguas lecionadas" />
          <KpiCard title="Instrutores em Sala" value={instrutoresAtivos} icon={Languages} colorType="blue" subtitle="Atuação pedagógica ativa" />
          <KpiCard title="Término em 60 Dias" value={saem60} icon={Hourglass} colorType="orange" subtitle="Janela de vencimento médio" />
          <KpiCard title="Término em 90 Dias" value={saem90} icon={Hourglass} colorType="orange" subtitle="Janela de vencimento longo" />
          <KpiCard title="Término em 180 Dias" value={saem180} icon={Hourglass} colorType="gray" subtitle="Janela de estabilidade" />
        </div>
      )}

      {/* 3. Bento Grid - Row 1 - modeled exactly after the mockup's row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Card 1: Project Analytics Chart (Saídas por Mês / Turno) */}
        <DeparturesChart employees={employees} onSelectEmployee={onSelectEmployee} />

        {/* Bento Card 2: Reminders - styled 1-to-1 to the "Meeting with Arc Company" reminder card in the mockup */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[28px] border border-sky-100 shadow-[0_10px_30px_rgba(16,42,67,0.015)] flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="text-[10px] font-black text-yinmn uppercase tracking-widest block mb-4">
              Ações Recomendadas
            </span>
            <h4 className="text-base font-extrabold text-oxford leading-snug">
              Renovação Contratual Crítica
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Yuki Tanaka (Língua Japonesa)
            </p>
            <div className="mt-4 bg-sky-50 border border-sky-200 p-3 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Janela de Ação</span>
              <p className="text-xs font-bold text-rose-600 mt-1">Vencimento iminente</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Faltam apenas 12 dias</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (yukiTanakaFuncionário) onSelectEmployee(yukiTanakaFuncionário);
            }}
            className="w-full py-3 bg-gradient-to-br from-yinmn to-oxford hover:opacity-95 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98] shadow-md cursor-pointer"
          >
            Iniciar Renovação
          </button>
        </div>

      </div>

      {/* 4. Bento Grid - Row 2 - modeled exactly after the mockup's row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Card 4: Team Member Analytics (Funcionários Monitorados) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[28px] border border-sky-100 shadow-[0_10px_30px_rgba(16,42,67,0.015)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
              Status de Funcionários Monitorados
            </span>
            
            <div className="space-y-3.5">
              {employees.slice(0, 4).map((emp) => {
                const risk = calcularRisco(emp);
                const firstLetter = emp.nome.charAt(0);
                
                // Set color badge based on risk
                let badgeClass = "bg-green-50 text-green-700 border-green-200/50";
                if (risk === "Crítico") badgeClass = "bg-red-50 text-red-700 border-red-200/50";
                else if (risk === "Alto") badgeClass = "bg-amber-50 text-amber-700 border-amber-200/50";
                else if (risk === "Médio") badgeClass = "bg-blue-50 text-blue-700 border-blue-200/50";

                return (
                  <div
                    key={emp.recordId}
                    onClick={() => onSelectEmployee(emp)}
                    className="flex items-center justify-between p-2 hover:bg-sky-50 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 border border-sky-100 flex items-center justify-center text-xs font-black text-cadet shrink-0">
                        {firstLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-oxford truncate">{emp.nome}</p>
                        <p className="text-[9px] text-slate-400 font-semibold truncate">
                          {emp.cargo} &bull; {emp.idiomas?.join(", ")}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${badgeClass}`}>
                      {risk}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-50 mt-4">
            <span className="text-[10px] text-slate-400 font-bold">
              Todos os {total} colaboradores estão listados no Quadro Geral
            </span>
          </div>
        </div>

        <DataIntegrityCard quality={qualidade} />
      </div>

      <DistributionPanel
        languages={listIdiomas}
        zones={listZonas}
        shifts={listTurnos}
        risks={listRiscos}
        statuses={listStatus}
        activeCount={ativos}
        totalCount={total}
      />
      {/* 5. Clean chronological output list of contract endings */}
      <div className="bg-white p-6 rounded-[28px] border border-sky-100 shadow-[0_10px_30px_rgba(16,42,67,0.015)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h4 className="text-base font-extrabold text-oxford">Lista de Encerramentos</h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Próximos términos de contratos</p>
          </div>
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full uppercase tracking-wider w-max">
            Acompanhamento Legal Requerido
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
          <table className="w-full min-w-[800px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-sky-100 text-slate-400 font-black uppercase text-[10px]">
                <th className="py-3.5 px-3 text-left">Funcionário</th>
                <th className="py-3.5 px-3 text-left">Cargo</th>
                <th className="py-3.5 px-3 text-left">Zona</th>
                <th className="py-3.5 px-3 text-left">Turno</th>
                <th className="py-3.5 px-3 text-left">Idiomas</th>
                <th className="py-3.5 px-3 text-left">Data de Término</th>
                <th className="py-3.5 px-3 text-center">Dias Restantes</th>
                <th className="py-3.5 px-3 text-left">Status</th>
                <th className="py-3.5 px-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {proximasSaidasDisponiveis.slice(0, 5).map((emp) => {
                const risk = calcularRisco(emp);
                return (
                  <tr key={emp.recordId} className="hover:bg-sky-50/50 transition-colors">
                    <td className="py-4 px-3 font-extrabold text-oxford">{emp.nome}</td>
                    <td className="py-4 px-3 text-slate-500 font-semibold">{emp.cargo}</td>
                    <td className="py-4 px-3 text-slate-500 font-semibold">{emp.zona}</td>
                    <td className="py-4 px-3 text-slate-500 font-semibold">{emp.turno}</td>
                    <td className="py-4 px-3">
                      <div className="flex flex-wrap gap-1">
                        {emp.idiomas?.map((l) => (
                          <span key={l} className="inline-block bg-sky-50 text-yinmn px-2 py-0.5 rounded-md text-[9px] font-bold">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-slate-400 font-mono font-semibold">{formatarDataBR(emp.dataTerminoReal)}</td>
                    <td className="py-4 px-3 text-center font-bold">
                      {emp.dias !== null && emp.dias <= 30 ? (
                        <span className="text-rose-600 font-black bg-rose-50 px-2 py-1 rounded-md">{emp.dias} dias</span>
                      ) : (
                        <span className="text-slate-700">{emp.dias} dias</span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <RiskBadge level={risk} />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => onSelectEmployee(emp)}
                        className="text-xs text-yinmn hover:text-cadet hover:underline font-extrabold cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
              {proximasSaidasDisponiveis.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                    Nenhum término de contrato planejado
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
