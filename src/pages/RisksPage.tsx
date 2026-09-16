import { RiskHeatmapMatrix } from "../components/RiskHeatmapMatrix";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  FileQuestion,
  TrendingUp,
  MapPin,
  Clock,
  Languages,
  Plane,
  Grid,
  Info,
  Calendar,
  AlertOctagon,
  CornerDownRight
} from "lucide-react";
import { RhEmployee, RiskLevel } from "../types/rh";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { RiskBadge } from "../components/RiskBadge";
import { calcularStatusFerias } from "../utils/vacationUtils";
import { obterSubstituicoes } from "../services/additionalDataSource";
import { gerarDatasNoIntervalo } from "../utils/absenceUtils";

interface RisksPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
}

type HeatmapMode = "idioma_turno" | "idioma_zona" | "zona_turno" | "periodo_ausencia";

export const RisksPage: React.FC<RisksPageProps> = ({ employees, onSelectEmployee }) => {
  const [activeView, setActiveView] = useState<"ranking" | "heatmap">("heatmap");
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("idioma_turno");
  const [selectedCellInfo, setSelectedCellInfo] = useState<any | null>(null);

  const actives = employees.filter((e) => e.statusFuncionario === "Ativo");
  const substitutions = obterSubstituicoes();

  // 1. PROCESSAR COUNTERS
  const riscos = actives.map((e) => calcularRisco(e));
  
  const totalCriticos = riscos.filter((r) => r === "Crítico").length;
  const totalAltos = riscos.filter((r) => r === "Alto").length;
  const totalMedios = riscos.filter((r) => r === "Médio").length;

  const incompletosImpeditivos = actives.filter(
    (e) => !e.dataTerminoReal || e.dataTerminoReal.trim() === ""
  ).length;

  const idiomasCount: Record<string, number> = {};
  actives.forEach((e) => {
    if (e.idiomas) {
      e.idiomas.forEach((l) => {
        if (l) idiomasCount[l] = (idiomasCount[l] || 0) + 1;
      });
    }
  });

  const baixaCoberturaIdiomas = Object.entries(idiomasCount)
    .filter(([_, count]) => count <= 1)
    .map(([lang]) => lang);

  const totalVacationCritical = actives.filter((e) => calcularStatusFerias(e) === "Férias críticas").length;

  // 2. CONSTRUÇÃO DO RANKING DE RISCOS OPERACIONAIS
  const topRiscosAlerts = [
    {
      id: 1,
      title: "Japonês: Cobertura Crítica e Vencimento Próximo",
      severity: "Crítico" as const,
      category: "Idioma",
      desc: "Yuki Tanaka (único Funcionário de Japonês) tem seu contrato de trabalho vencendo em menos de 15 dias.",
      recommendation: "Iniciar processo seletivo emergencial para substituição ou propor renovação aditiva em até 48h.",
      icon: Languages,
    },
    {
      id: 2,
      title: "Vencimentos Contratuais Iminentes (Menos de 15 dias)",
      severity: "Crítico" as const,
      category: "Contrato",
      desc: `Identificados ${totalCriticos} funcionários ativos com prazo contratual expirando nos próximos dias, incluindo Marcos Vinícius (Português) e Carlos Augusto (Espanhol).`,
      recommendation: "Emitir termos aditivos de prorrogação ou programar os exames demissionais de encerramento de vínculo.",
      icon: Flame,
    },
    {
      id: 3,
      title: "Férias Críticas Acumuladas (Passivo Trabalhista & Cobertura)",
      severity: "Alto" as const,
      category: "Férias",
      desc: `Identificados ${totalVacationCritical} instrutores em estado crítico de férias acumuladas sem marcação, com mais de 1 ano e 6 meses de trabalho ininterrupto.`,
      recommendation: "Exigir a programação imediata de férias para os casos críticos, escalonando as folgas para mitigar desfalques simultâneos.",
      icon: Plane,
    },
    {
      id: 4,
      title: "Concentração de Saídas na Zona Norte (Inglês)",
      severity: "Alto" as const,
      category: "Geográfico",
      desc: "A Zona Norte possui concentração elevada de saídas de instrutores de Inglês planejadas para os próximos 30 dias.",
      recommendation: "Remanejar temporariamente 1 instrutor da Zona Leste para apoiar a grade acadêmica da Zona Norte.",
      icon: MapPin,
    },
    {
      id: 5,
      title: "Cadastros Sem Data de Término (Impede Auditoria)",
      severity: "Médio" as const,
      category: "Integridade",
      desc: `Existem ${incompletosImpeditivos} registros ativos sem data de término definida, o que inviabiliza as projeções automáticas de reposição do sistema.`,
      recommendation: "Cobrar a secretaria e o RH para complementação das datas de encerramento de Roberto Gimenes e assemelhados.",
      icon: FileQuestion,
    },
    {
      id: 6,
      title: "Baixa Cobertura Ativa de Idioma Singular",
      severity: "Médio" as const,
      category: "Alocação",
      desc: `Os seguintes idiomas possuem apenas um instrutor ativo cadastrado no CTM: ${baixaCoberturaIdiomas.join(", ") || "Nenhum"}.`,
      recommendation: "Planejar banco de talentos reserva para mitigar riscos de licenças médicas repentinas.",
      icon: Sliders,
    }
  ];

  const contratosRiscoMaximo = actives
    .map((e) => ({ ...e, risco: calcularRisco(e) }))
    .filter((e) => e.risco === "Crítico" || e.risco === "Alto")
    .sort((a, b) => {
      const diasA = calcularDiasRestantes(a.dataTerminoReal) ?? 999;
      const diasB = calcularDiasRestantes(b.dataTerminoReal) ?? 999;
      return diasA - diasB;
    });

  // 3. MOTOR CALCULAR CÉLULA DO HEATMAP
  const calcularMetricasCelula = (filtros: { idioma?: string; turno?: string; zona?: string }) => {
    // Filtrar instrutores ativos nessa interseção
    const ativosCelula = actives.filter((e) => {
      const matchLang = !filtros.idioma || e.idiomas?.some((l) => l.toLowerCase() === filtros.idioma?.toLowerCase());
      const matchTurno = !filtros.turno || e.turno?.toLowerCase() === filtros.turno?.toLowerCase();
      const matchZona = !filtros.zona || e.zona?.toLowerCase() === filtros.zona?.toLowerCase();
      return matchLang && matchTurno && matchZona;
    });

    const activeCount = ativosCelula.length;

    // Vencimentos de contrato críticos
    const contratos30 = ativosCelula.filter((e) => {
      const d = calcularDiasRestantes(e.dataTerminoReal);
      return d !== null && d >= 0 && d <= 30;
    }).length;

    const contratos60 = ativosCelula.filter((e) => {
      const d = calcularDiasRestantes(e.dataTerminoReal);
      return d !== null && d > 30 && d <= 60;
    }).length;

    // Substituições pendentes/sem responsável
    const subsPendentes = substitutions.filter((s) => {
      if (s.status === "Cancelada" || s.status === "Concluída") return false;
      const matchAbsentEmployee = ativosCelula.some((e) => e.nome === s.instrutorAusente);
      return matchAbsentEmployee && (!s.substituto || s.substituto.trim() === "");
    }).length;

    // Ausências futuras (férias marcadas)
    const ausenciasFuturas = ativosCelula.filter((e) => e.periodosFerias && e.periodosFerias.length > 0).length;

    // Calcular nível de risco
    let nivel: "Verde" | "Azul" | "Amarelo" | "Laranja" | "Vermelho" = "Verde";
    let recomendacao = "Célula estável. Cobertura Funcionário em conformidade com as diretrizes acadêmicas.";

    if (activeCount === 0) {
      // Se não há Funcionários cadastrados para essa combinação de idioma/turno/zona
      nivel = "Vermelho";
      recomendacao = "Gargalo Crítico! Não há nenhum instrutor ativo para cobrir essa demanda linguística/local.";
    } else if (activeCount === 1) {
      if (contratos30 > 0 || subsPendentes > 0) {
        nivel = "Vermelho";
        recomendacao = "Risco de colapso de grade acadêmica! Único Funcionário ativo possui contrato expirando em 30 dias ou ausência não coberta.";
      } else {
        nivel = "Laranja";
        recomendacao = "Vulnerabilidade operacional. Apenas 1 Funcionário ativo. Qualquer licença resultará em desfalque.";
      }
    } else if (activeCount >= 2) {
      if (contratos30 > 0 || subsPendentes > 0) {
        nivel = "Amarelo";
        recomendacao = "Atenção requerida. Há contratos vencendo ou ausências pendentes que demandam novas alocações.";
      } else if (contratos60 > 0 || ausenciasFuturas > 0) {
        nivel = "Azul";
        recomendacao = "Acompanhamento preventivo. Planejar escala de férias futura para evitar acúmulos.";
      }
    }

    return {
      activeCount,
      contratos30,
      contratos60,
      subsPendentes,
      ausenciasFuturas,
      nivel,
      recomendacao
    };
  };

  const getHeatmapColor = (nivel: string) => {
    switch (nivel) {
      case "Vermelho":
        return "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-100/30 border border-rose-300";
      case "Laranja":
        return "bg-orange-400 hover:bg-orange-500 text-white shadow-md shadow-orange-100/20 border border-orange-200";
      case "Amarelo":
        return "bg-amber-300 hover:bg-amber-400 text-slate-800 border border-amber-200";
      case "Azul":
        return "bg-sky-200 hover:bg-sky-300 text-sky-800 border border-sky-100";
      default:
        return "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-50";
    }
  };

  const IDIOMAS = ["Inglês", "Espanhol", "Francês", "Japonês", "Alemão", "Mandarim", "Italiano", "Português"];
  const TURNOS = ["Manhã", "Tarde", "Noite"];
  const ZONAS = ["Zona Sul", "Zona Norte", "Zona Leste", "Zona Oeste", "Administrativo"];
  const MESES = [
    { label: "Julho/26", key: "2026-07" },
    { label: "Agosto/26", key: "2026-08" },
    { label: "Setembro/26", key: "2026-09" },
    { label: "Outubro/26", key: "2026-10" },
    { label: "Novembro/26", key: "2026-11" },
    { label: "Dezembro/26", key: "2026-12" }
  ];

  // Cálculo de limite simultâneo por mês para Período x Ausências
  const obterAusenciasNoMes = (anoMes: string) => {
    // Quantas pessoas têm férias ou substituição cobrindo qualquer dia desse mês?
    const ausentesSet = new Set<string>();
    
    // Varre férias
    employees.forEach((emp) => {
      emp.periodosFerias?.forEach((f) => {
        if (f.dataInicio.startsWith(anoMes) || f.dataFim.startsWith(anoMes)) {
          ausentesSet.add(emp.nome);
        }
      });
    });

    // Varre substituições
    substitutions.forEach((s) => {
      if (s.status !== "Cancelada") {
        if (s.dataInicio.startsWith(anoMes) || s.dataFim.startsWith(anoMes)) {
          ausentesSet.add(s.instrutorAusente);
        }
      }
    });

    const count = ausentesSet.size;
    let nivel: "Verde" | "Amarelo" | "Laranja" | "Vermelho" = "Verde";
    let recomendacao = "Mês seguro. Menos de 4 ausências simultâneas projetadas.";

    if (count > 8) {
      nivel = "Vermelho";
      recomendacao = `Crítico! Limite excedido com ${count} instrutores ausentes no mesmo período. Risco sério de quebra de turmas!`;
    } else if (count >= 6) {
      nivel = "Laranja";
      recomendacao = `Alto Risco! ${count} ausências simultâneas projetadas. Recomenda-se suspender novos pedidos de folga para este mês.`;
    } else if (count >= 4) {
      nivel = "Amarelo";
      recomendacao = `Atenção. ${count} ausências programadas. Planejamento de cobertura Funcionário preventiva recomendado.`;
    }

    return {
      count,
      nivel,
      recomendacao,
      ausentesList: Array.from(ausentesSet)
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-sky-100 pb-4 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-oxford flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Gestão Preditiva de Riscos de Pessoal</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Garantia de conformidade, coberturas linguísticas e análise de riscos geográficos por campus.
          </p>
        </div>

        {/* View Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex self-start">
          <button
            onClick={() => setActiveView("heatmap")}
            className={`text-xs font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
              activeView === "heatmap" ? "bg-white text-yinmn shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Mapa de Calor de Riscos
          </button>
          <button
            onClick={() => setActiveView("ranking")}
            className={`text-xs font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
              activeView === "ranking" ? "bg-white text-yinmn shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Análise e Ranking de Riscos
          </button>
        </div>
      </div>

      {activeView === "ranking" ? (
        /* RANKING ORIGINAL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
              <TrendingUp className="w-4 h-4 text-yinmn" />
              <span>Ranking de Riscos Operacionais Ativos</span>
            </h3>

            <div className="space-y-4">
              {topRiscosAlerts.map((alert, idx) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={alert.id}
                    className={`p-5 bg-white rounded-2xl border border-sky-100 shadow-[0_4px_20px_-4px_rgba(23,105,170,0.04)] hover:shadow-[0_12px_24px_-8px_rgba(23,105,170,0.07)] hover:-translate-y-0.5 transition-all duration-300 flex gap-4 ${
                      alert.severity === "Crítico"
                        ? "border-l-4 border-l-rose-500"
                        : alert.severity === "Alto"
                        ? "border-l-4 border-l-amber-500"
                        : "border-l-4 border-l-yinmn"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl self-start ${
                      alert.severity === "Crítico"
                        ? "bg-rose-50 text-rose-600"
                        : alert.severity === "Alto"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-sky-50 text-yinmn"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          #{idx + 1} - {alert.category}
                        </span>
                        <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                          alert.severity === "Crítico"
                            ? "bg-rose-50 text-rose-600 border border-rose-100/50"
                            : alert.severity === "Alto"
                            ? "bg-amber-50 text-amber-600 border border-amber-100/50"
                            : "bg-sky-50 text-yinmn border border-sky-200"
                        }`}>
                          {alert.severity}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-oxford">{alert.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">{alert.desc}</p>
                      
                      <div className="pt-3 mt-3 border-t border-sky-100 bg-sky-50/50 p-3 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-wider text-yinmn block">
                          Ação Recomendada pelo RH
                        </span>
                        <p className="text-xs text-oxford font-semibold mt-1 leading-relaxed">{alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-[0_4px_20px_-4px_rgba(23,105,170,0.04)] space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-oxford">Contratos Críticos & Altos</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Regularização contratual imediata</p>
              </div>

              <div className="space-y-2.5">
                {contratosRiscoMaximo.slice(0, 4).map((emp) => {
                  const dias = calcularDiasRestantes(emp.dataTerminoReal);
                  return (
                    <div
                      key={emp.recordId}
                      className="p-3 bg-slate-50/50 rounded-xl border border-sky-100 flex items-center justify-between hover:border-jordy/50 hover:bg-sky-50 transition-all duration-250 cursor-pointer text-xs"
                      onClick={() => onSelectEmployee(emp)}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-extrabold text-oxford truncate">{emp.nome}</p>
                        <span className="text-[10px] text-slate-400 font-bold block truncate">{emp.cargo}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-rose-600 block bg-rose-50 px-2 py-0.5 rounded-md">{dias} dias</span>
                        <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{formatarDataBR(emp.dataTerminoReal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HEATMAP INTERACTIVE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Heatmap controls & Matrix rendering */}
          <div className="lg:col-span-3 space-y-5">
            {/* Matrices selectors */}
            <div className="flex gap-2 flex-wrap bg-slate-100/80 p-1.5 rounded-2xl self-start max-w-max">
              <button
                onClick={() => {
                  setHeatmapMode("idioma_turno");
                  setSelectedCellInfo(null);
                }}
                className={`text-[10px] font-black uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                  heatmapMode === "idioma_turno" ? "bg-white text-yinmn shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Idioma x Turno
              </button>
              
              <button
                onClick={() => {
                  setHeatmapMode("idioma_zona");
                  setSelectedCellInfo(null);
                }}
                className={`text-[10px] font-black uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                  heatmapMode === "idioma_zona" ? "bg-white text-yinmn shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Idioma x Zona
              </button>

              <button
                onClick={() => {
                  setHeatmapMode("zona_turno");
                  setSelectedCellInfo(null);
                }}
                className={`text-[10px] font-black uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                  heatmapMode === "zona_turno" ? "bg-white text-yinmn shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Zona x Turno
              </button>

              <button
                onClick={() => {
                  setHeatmapMode("periodo_ausencia");
                  setSelectedCellInfo(null);
                }}
                className={`text-[10px] font-black uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                  heatmapMode === "periodo_ausencia" ? "bg-white text-yinmn shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Período x Ausências (Limite 8)
              </button>
            </div>

            {/* Matrix Render Box */}
            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm overflow-x-auto">
              
              {/* MATRIX 1: Idioma x Turno */}
              {heatmapMode === "idioma_turno" && (
                <div className="min-w-[600px] text-xs">
                  <div className="grid grid-cols-4 border-b border-sky-100 pb-3 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <div>Idioma de Ensino</div>
                    {TURNOS.map((t) => (
                      <div key={t} className="text-center">{t}</div>
                    ))}
                  </div>

                  <div className="divide-y divide-sky-100">
                    {IDIOMAS.map((idioma) => (
                      <div key={idioma} className="grid grid-cols-4 py-3.5 items-center">
                        <div className="font-extrabold text-oxford">{idioma}</div>
                        {TURNOS.map((turno) => {
                          const met = calcularMetricasCelula({ idioma, turno });
                          return (
                            <div key={turno} className="px-2">
                              <div
                                onClick={() => setSelectedCellInfo({ title: `${idioma} • Turno ${turno}`, ...met })}
                                className={`py-3 text-center rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-sm font-extrabold text-xs ${getHeatmapColor(met.nivel)}`}
                              >
                                {met.activeCount} Act
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MATRIX 2: Idioma x Zona */}
              {heatmapMode === "idioma_zona" && (
                <div className="min-w-[700px] text-xs">
                  <div className="grid grid-cols-6 border-b border-sky-100 pb-3 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <div>Idioma de Ensino</div>
                    {ZONAS.map((z) => (
                      <div key={z} className="text-center">{z}</div>
                    ))}
                  </div>

                  <div className="divide-y divide-sky-100">
                    {IDIOMAS.map((idioma) => (
                      <div key={idioma} className="grid grid-cols-6 py-3.5 items-center">
                        <div className="font-extrabold text-oxford">{idioma}</div>
                        {ZONAS.map((zona) => {
                          const met = calcularMetricasCelula({ idioma, zona });
                          return (
                            <div key={zona} className="px-1.5">
                              <div
                                onClick={() => setSelectedCellInfo({ title: `${idioma} • ${zona}`, ...met })}
                                className={`py-3 text-center rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-sm font-extrabold text-xs ${getHeatmapColor(met.nivel)}`}
                              >
                                {met.activeCount} Act
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MATRIX 3: Zona x Turno */}
              {heatmapMode === "zona_turno" && (
                <div className="min-w-[600px] text-xs">
                  <div className="grid grid-cols-4 border-b border-sky-100 pb-3 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <div>Região / Campus</div>
                    {TURNOS.map((t) => (
                      <div key={t} className="text-center">{t}</div>
                    ))}
                  </div>

                  <div className="divide-y divide-sky-100">
                    {ZONAS.map((zona) => (
                      <div key={zona} className="grid grid-cols-4 py-3.5 items-center">
                        <div className="font-extrabold text-oxford">{zona}</div>
                        {TURNOS.map((turno) => {
                          const met = calcularMetricasCelula({ zona, turno });
                          return (
                            <div key={turno} className="px-2">
                              <div
                                onClick={() => setSelectedCellInfo({ title: `${zona} • Turno ${turno}`, ...met })}
                                className={`py-3 text-center rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-sm font-extrabold text-xs ${getHeatmapColor(met.nivel)}`}
                              >
                                {met.activeCount} Act
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MATRIX 4: Período x Ausências */}
              {heatmapMode === "periodo_ausencia" && (
                <div className="space-y-4">
                  <div className="p-3 bg-sky-50 border border-sky-100/60 rounded-2xl flex items-start gap-2 text-xs text-yinmn">
                    <Info className="w-4 h-4 text-yinmn shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">
                      Esta matriz monitora a regra operacional crítica: **no máximo 8 professores ausentes** (férias marcadas ou afastamentos cadastrados) no mesmo mês. Meses com mais de 8 ausências ficam em **Vermelho** (Crítico).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {MESES.map((mes) => {
                      const res = obterAusenciasNoMes(mes.key);
                      const isExceeded = res.count > 8;
                      
                      let cardColor = "border-emerald-100 bg-emerald-50/30 text-emerald-800";
                      if (res.nivel === "Vermelho") cardColor = "border-red-200 bg-red-50/30 text-red-900";
                      if (res.nivel === "Laranja") cardColor = "border-orange-200 bg-orange-50/30 text-orange-900";
                      if (res.nivel === "Amarelo") cardColor = "border-amber-200 bg-amber-50/30 text-amber-900";

                      return (
                        <div
                          key={mes.key}
                          onClick={() => setSelectedCellInfo({
                            title: `Previsão: ${mes.label}`,
                            activeCount: actives.length,
                            contratos30: 0,
                            contratos60: 0,
                            subsPendentes: 0,
                             listaNomes: res.ausentesList
                          })}
                          className={`p-4 rounded-3xl border-2 cursor-pointer transition-all hover:scale-102 hover:shadow-sm ${cardColor}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-oxford">{mes.label}</span>
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                              res.nivel === "Vermelho" ? "bg-red-500 text-white animate-pulse" : "bg-white text-slate-700 border"
                            }`}>
                              {res.count} Ausentes
                            </span>
                          </div>

                          <div className="mt-3.5 space-y-1 text-xs">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>Status de Ausência Coletiva:</span>
                            </div>
                            <span className="font-extrabold block text-slate-700">{res.nivel}</span>
                            <p className="text-[10px] text-slate-400 leading-snug font-medium mt-1">{res.recomendacao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Legendas coloridas */}
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 flex-wrap text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="shrink-0">Risco da Célula:</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300 block" /> Verde (Estável)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-200 border border-sky-300 block" /> Azul (Monitoramento)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-300 border border-amber-400 block" /> Amarelo (Atenção)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 border border-orange-500 block" /> Laranja (Alto Risco)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 block" /> Vermelho (Crítico)</span>
            </div>
          </div>

          {/* Right Side: Clicked Cell Tooltip Details */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm space-y-4 sticky top-4">
              <div className="border-b border-sky-100/60 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Inspeção Detalhada de Risco</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Selecione uma célula para ver recomendações</p>
              </div>

              {selectedCellInfo ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-black text-yinmn tracking-wider block">Coordenada Geográfica</span>
                    <p className="text-sm font-black text-oxford mt-0.5">{selectedCellInfo.title}</p>
                  </div>

                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-sky-100 space-y-2 font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Funcionários Ativos:</span>
                      <span className="font-extrabold text-oxford">{selectedCellInfo.activeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ausências Futuras/Férias:</span>
                      <span className="font-extrabold text-oxford">{selectedCellInfo.ausenciasFuturas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vencendo em 30 dias:</span>
                      <span className="font-extrabold text-oxford">{selectedCellInfo.contratos30}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vencendo em 60 dias:</span>
                      <span className="font-extrabold text-oxford">{selectedCellInfo.contratos60}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Substitutos Pendentes:</span>
                      <span className="font-extrabold text-oxford">{selectedCellInfo.subsPendentes}</span>
                    </div>
                  </div>

                  {/* Lista de nomes ausentes para Período x Ausências */}
                  {selectedCellInfo.listaNomes && selectedCellInfo.listaNomes.length > 0 && (
                    <div className="p-3 bg-red-50/20 border border-red-100/40 rounded-2xl space-y-1.5">
                      <span className="text-[9px] uppercase font-black text-red-600 tracking-wider block">Ausentes Programados ({selectedCellInfo.listaNomes.length})</span>
                      <div className="space-y-1">
                        {selectedCellInfo.listaNomes.map((n: string) => (
                          <div key={n} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            <CornerDownRight className="w-3 h-3 text-red-400 shrink-0" />
                            <span>{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-slate-400">Nível de Risco Calculado</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                      selectedCellInfo.nivel === "Vermelho"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : selectedCellInfo.nivel === "Laranja"
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                      {selectedCellInfo.nivel}
                    </span>
                  </div>

                  <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 space-y-1.5">
                    <span className="text-[9px] uppercase font-black text-yinmn tracking-wider block">Recomendação Operacional</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedCellInfo.recomendacao}</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 font-semibold italic">
                  Clique em qualquer quadrante colorido da matriz para inspecionar os fatores de risco e obter ações preventivas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
