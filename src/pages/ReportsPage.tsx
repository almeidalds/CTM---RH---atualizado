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
import { KpiCard } from "../components/KpiCard";
import {
  IdiomaChart,
  SaidasMesChart,
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
  calcularSaidasPorMes,
  gerarResumoExecutivo
} from "../utils/groupUtils";
import { RiskBadge } from "../components/RiskBadge";

interface ReportsPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
  onGenerateReportClick?: () => void;
  onResetData?: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  employees,
  onSelectEmployee,
  onGenerateReportClick,
  onResetData
}) => {
  const [showMoreKPIs, setShowMoreKPIs] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<"idiomas" | "zonas" | "turnos" | "risco" | "status">("idiomas");

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
  const integridadePorcento = Math.round(qualidade.percentualQualidade);

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

  // Encontrar o docente crítico Yuki Tanaka para atalho inteligente no painel "Reminders"
  const yukiTanakaDocente = employees.find((e) => e.nome.includes("Yuki Tanaka")) || proximaSaida;

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
  const listSaidasMes = calcularSaidasPorMes(employees);
  
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

  const handleReset = () => {
    if (onResetData) {
      onResetData();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header Row - modeled after the 'Dashboard' title & buttons in the image */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-oxford tracking-tight flex items-center gap-1">
            Dashboard<span className="text-jordy">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-1">
            Planeje, priorize e gerencie os prazos contratuais de docentes com facilidade.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onGenerateReportClick && (
            <button
              onClick={onGenerateReportClick}
              className="bg-gradient-to-br from-yinmn to-oxford hover:opacity-95 text-white text-[11px] font-black py-2.5 px-4.5 rounded-full flex items-center gap-1.5 shadow-[0_6px_20px_rgba(25,35,56,0.15)] transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Gerar Relatório</span>
            </button>
          )}

          {onResetData && (
            <button
              onClick={() => {
                handleReset();
              }}
              className="bg-white hover:bg-lavender/10 text-slate-700 text-[11px] font-bold py-2.5 px-4.5 rounded-full border border-lavender transition-all active:scale-95 cursor-pointer"
            >
              Resetar Dados
            </button>
          )}
        </div>
      </div>

      {/* 2. Top 4 Core Metric Cards - modeled exactly after the mockup's top row cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Docentes Ativos - highlighted slate/blue card */}
        <KpiCard
          title="Total Docentes Ativos"
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
          colorType="purple"
          subtitle="Falta de dados críticos"
        />
      </div>

      {/* Collapsible Section for remaining 8 metrics to clean up the page layout */}
      <div className="border-t border-lavender/80 pt-1 flex justify-center">
        <button
          onClick={() => setShowMoreKPIs(!showMoreKPIs)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-lavender/5 border border-lavender text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-yinmn hover:bg-lavender/20 transition-all active:scale-95 cursor-pointer"
        >
          <span>{showMoreKPIs ? "Ocultar Métricas Secundárias" : "Exibir Mais Indicadores"}</span>
          {showMoreKPIs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showMoreKPIs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
          <KpiCard title="Total Cadastros" value={total} icon={Users} colorType="gray" subtitle="Total geral histórico" />
          <KpiCard title="Docentes a Começar" value={aComecar} icon={CalendarPlus} colorType="purple" subtitle="Admissões futuras" />
          <KpiCard title="Docentes Desligados" value={encerrados} icon={TrendingDown} colorType="gray" subtitle="Contratos finalizados" />
          <KpiCard title="Idiomas Ativos" value={totalIdiomasAtivos} icon={Globe} colorType="blue" subtitle="Línguas lecionadas" />
          <KpiCard title="Instrutores em Sala" value={instrutoresAtivos} icon={Languages} colorType="purple" subtitle="Atuação pedagógica ativa" />
          <KpiCard title="Término em 60 Dias" value={saem60} icon={Hourglass} colorType="orange" subtitle="Janela de vencimento médio" />
          <KpiCard title="Término em 90 Dias" value={saem90} icon={Hourglass} colorType="orange" subtitle="Janela de vencimento longo" />
          <KpiCard title="Término em 180 Dias" value={saem180} icon={Hourglass} colorType="gray" subtitle="Janela de estabilidade" />
        </div>
      )}

      {/* 3. Bento Grid - Row 1 - modeled exactly after the mockup's row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Card 1: Project Analytics Chart (Saídas por Mês / Turno) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)] flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              PROJEÇÃO DE RISCOS DE ESCALA
            </span>
            <h4 className="text-base font-extrabold text-oxford">Saídas por Mês</h4>
            <p className="text-[11px] text-slate-400 font-medium">Volume planejado de términos de contrato nos meses subsequentes</p>
          </div>
          <div className="h-60 w-full mt-2">
            <SaidasMesChart data={listSaidasMes} />
          </div>
        </div>

        {/* Bento Card 2: Reminders - styled 1-to-1 to the "Meeting with Arc Company" reminder card in the mockup */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)] flex flex-col justify-between min-h-[300px]">
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
            <div className="mt-4 bg-lavender/10 border border-lavender/65 p-3 rounded-2xl">
              <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Janela de Ação</span>
              <p className="text-xs font-bold text-rose-600 mt-1">Vencimento iminente</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Faltam apenas 12 dias</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (yukiTanakaDocente) onSelectEmployee(yukiTanakaDocente);
            }}
            className="w-full py-3 bg-gradient-to-br from-yinmn to-oxford hover:opacity-95 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98] shadow-md cursor-pointer"
          >
            Iniciar Renovação
          </button>
        </div>

      </div>

      {/* 4. Bento Grid - Row 2 - modeled exactly after the mockup's row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Card 4: Team Member Analytics (Docentes Monitorados) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
              Status de Docentes Monitorados
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
                    className="flex items-center justify-between p-2 hover:bg-lavender/10 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lavender/20 to-lavender/50 border border-lavender flex items-center justify-center text-xs font-black text-cadet shrink-0">
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

        {/* Bento Card 5: Project Progress (Gauge Integridade Cadastral) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)] flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
              Integridade Cadastral
            </span>
            
            {/* Visual Arc Progress Block - matching 41% Progress arc in the image */}
            <div className="relative flex flex-col items-center justify-center my-2">
              <svg className="w-32 h-20" viewBox="0 0 100 50">
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="#D9E1F1"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="125"
                  strokeDashoffset={125 - (125 * integridadePorcento) / 100}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8FB3E2" />
                    <stop offset="100%" stopColor="#31487A" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-1 text-center">
                <span className="text-2xl font-black text-oxford block leading-none">{integridadePorcento}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Conformidade</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Completo</span>
              </div>
              <span>{employees.length - comPendencia} docentes</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Pendente</span>
              </div>
              <span>{comPendencia} docentes</span>
            </div>
          </div>
        </div>



      </div>

      {/* 4.5. Centro de Análises Gráficas Interativas */}
      <div className="bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lavender pb-5 mb-6">
          <div>
            <span className="text-[10px] font-black text-yinmn uppercase tracking-widest block mb-1">
              PAINEL OPERACIONAL DETALHADO
            </span>
            <h4 className="text-xl font-extrabold text-oxford">Distribuição & Cobertura de Docentes</h4>
            <p className="text-xs text-slate-400 font-semibold">Análises demográficas e de risco consolidadas em tempo real</p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 border border-lavender/60 p-1 rounded-2xl">
            {[
              { id: "idiomas" as const, label: "Idiomas", icon: Globe },
              { id: "zonas" as const, label: "Regiões (Zonas)", icon: MapPin },
              { id: "turnos" as const, label: "Turnos", icon: Clock },
              { id: "risco" as const, label: "Riscos", icon: ShieldAlert },
              { id: "status" as const, label: "Status", icon: Layers3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeChartTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveChartTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-yinmn shadow-xs border border-lavender/40"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-yinmn" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Chart Display Container with soft transition */}
        <div className="min-h-[260px] flex items-center justify-center bg-slate-50/20 rounded-2xl p-4 md:p-6 border border-dashed border-lavender/50">
          <div className="w-full animate-fadeIn">
            {activeChartTab === "idiomas" && (
              <div className="max-w-3xl mx-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-yinmn" /> Ranking de Idiomas Lecionados por Docentes Ativos
                </p>
                <IdiomaChart data={listIdiomas} />
              </div>
            )}
            {activeChartTab === "zonas" && (
              <div className="max-w-3xl mx-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-yinmn" /> Concentração Regional de Equipe (Zonas)
                </p>
                <ZonaChart data={listZonas} />
              </div>
            )}
            {activeChartTab === "turnos" && (
              <div className="max-w-xl mx-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 text-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-yinmn" /> Comparativo de Carga Horária e Alocação por Turno
                </p>
                <TurnoChart data={listTurnos} />
              </div>
            )}
            {activeChartTab === "risco" && (
              <div className="max-w-3xl mx-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-yinmn" /> Monitoramento Preventivo de Riscos de Saídas Contratuais
                </p>
                <RiscoChart data={listRiscos} />
              </div>
            )}
            {activeChartTab === "status" && (
              <div className="max-w-3xl mx-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Layers3 className="w-3.5 h-3.5 text-yinmn" /> Distribuição Geral por Status de Vínculo
                </p>
                <StatusChart data={listStatus} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Clean chronological output list of contract endings */}
      <div className="bg-white p-6 rounded-[28px] border border-lavender shadow-[0_10px_30px_rgba(25,35,56,0.015)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h4 className="text-base font-extrabold text-oxford">Lista de Encerramentos Planejados</h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Visão unificada das próximas janelas de término de contratos ativos</p>
          </div>
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full uppercase tracking-wider w-max">
            Acompanhamento Legal Requerido
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
          <table className="w-full min-w-[800px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-lavender text-slate-400 font-black uppercase text-[10px]">
                <th className="py-3.5 px-3 text-left">Docente</th>
                <th className="py-3.5 px-3 text-left">Cargo</th>
                <th className="py-3.5 px-3 text-left">Região / Zona</th>
                <th className="py-3.5 px-3 text-left">Turno</th>
                <th className="py-3.5 px-3 text-left">Idiomas</th>
                <th className="py-3.5 px-3 text-left">Data de Término</th>
                <th className="py-3.5 px-3 text-center">Dias Restantes</th>
                <th className="py-3.5 px-3 text-left">Risco Contratual</th>
                <th className="py-3.5 px-3 text-center">Detalhamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lavender/40">
              {proximasSaidasDisponiveis.slice(0, 5).map((emp) => {
                const risk = calcularRisco(emp);
                return (
                  <tr key={emp.recordId} className="hover:bg-lavender/5 transition-colors">
                    <td className="py-4 px-3 font-extrabold text-oxford">{emp.nome}</td>
                    <td className="py-4 px-3 text-slate-500 font-semibold">{emp.cargo}</td>
                    <td className="py-4 px-3 text-slate-500 font-semibold">{emp.zona}</td>
                    <td className="py-4 px-3 text-slate-500 font-semibold">{emp.turno}</td>
                    <td className="py-4 px-3">
                      <div className="flex flex-wrap gap-1">
                        {emp.idiomas?.map((l) => (
                          <span key={l} className="inline-block bg-lavender/10 text-yinmn px-2 py-0.5 rounded-md text-[9px] font-bold">
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
