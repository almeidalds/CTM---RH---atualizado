/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  Plane,
  X,
  BadgePercent,
  TrendingUp,
  Clock,
  History,
  ShieldCheck,
  Languages,
  RotateCcw,
  UserCheck
} from "lucide-react";
import { RhEmployee, VacationFilters, VacationPeriod } from "../types/rh";
import { formatarDataBR, getToday, formatarDataCurta } from "../utils/dateUtils";
import {
  calcularTempoTrabalho,
  calcularStatusFerias,
  calcularDiasFerias,
  calcularDiasVendidos,
  calcularDiasTirados,
  calcularPeriodosFerias,
  identificarAlertaFerias,
  gerarRecomendacaoFerias,
  filtrarFerias
} from "../utils/vacationUtils";
import { VacationDetailsPanel } from "../components/VacationDetailsPanel";
import { VacationFormPanel } from "../components/VacationFormPanel";

interface VacationsPageProps {
  onSave?: (emp: RhEmployee, createSubst: boolean) => void;
  employees: RhEmployee[];
}

export const VacationsPage: React.FC<VacationsPageProps> = (props) => {
  const { employees } = props;
  // Estado de Filtros
  const [filtros, setFiltros] = useState<VacationFilters>({
    search: "",
    zona: "",
    turno: "",
    idioma: "",
    statusFerias: "",
    periodoAdmissao: "all",
    periodoFerias: "all",
    somenteCriticos: false,
    somenteAptos: false
  });

  // Estado para expandir/recolher filtros avançados
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estado do painel lateral de detalhes
  const [selectedEmployee, setSelectedEmployee] = useState<RhEmployee | null>(null);
  const [formEmployee, setFormEmployee] = useState<RhEmployee | null>(null);

  // Lista de funcionários ativos para cálculos gerais
  const activeEmployees = useMemo(() => {
    return employees.filter((emp) => emp.statusFuncionario === "Ativo");
  }, [employees]);

  // Lista de idiomas únicos para o filtro
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    employees.forEach((emp) => {
      emp.idiomas?.forEach((l) => {
        if (l) langs.add(l);
      });
    });
    return Array.from(langs).sort();
  }, [employees]);

  // KPIs de Férias (Calculados com base em todos os ativos)
  const stats = useMemo(() => {
    let aptos = 0;
    let críticas = 0;
    let marcadas = 0;
    let andamento = 0;
    let concluídas = 0;
    let diasVendidos = 0;
    let maisDe1AnoSemFerias = 0;
    let maisDe1Ano6MesesSemFerias = 0;

    activeEmployees.forEach((emp) => {
      const status = calcularStatusFerias(emp);
      const { totalMeses } = calcularTempoTrabalho(emp.dataAdmissao);
      
      diasVendidos += calcularDiasVendidos(emp);

      if (status === "Apto para férias") {
        aptos++;
        if (totalMeses >= 12) maisDe1AnoSemFerias++;
      } else if (status === "Férias críticas") {
        críticas++;
        if (totalMeses >= 12) maisDe1AnoSemFerias++;
        if (totalMeses >= 18) maisDe1Ano6MesesSemFerias++;
      } else if (status === "Férias marcadas" || status === "Férias parcialmente vendidas") {
        marcadas++;
      } else if (status === "Férias em andamento") {
        andamento++;
      } else if (status === "Férias concluídas") {
        concluídas++;
      }
    });

    return {
      aptos,
      críticas,
      marcadas,
      andamento,
      concluídas,
      diasVendidos,
      maisDe1AnoSemFerias,
      maisDe1Ano6MesesSemFerias
    };
  }, [activeEmployees]);

  // Alertas Automatizados Específicos
  const alertsList = useMemo(() => {
    const list: {
      type: "warning" | "danger" | "info" | "success";
      title: string;
      description: string;
      count: number;
      instructors: string[];
    }[] = [];

    // 1. Críticos sem férias marcadas (1 ano e 6 meses ou mais de trabalho)
    const criticos = activeEmployees.filter((emp) => {
      const status = calcularStatusFerias(emp);
      return status === "Férias críticas";
    });
    if (criticos.length > 0) {
      list.push({
        type: "danger",
        title: "Férias Críticas Urgentes (> 1 Ano e 6 Meses de Trabalho)",
        description: "Estes instrutores ultrapassaram o período limite sem marcação de férias. Risco iminente de desgaste ou passivo trabalhista.",
        count: criticos.length,
        instructors: criticos.map((e) => e.nome)
      });
    }

    // 2. Aptos que completaram 1 ano e não marcaram
    const aptosSemMarcar = activeEmployees.filter((emp) => {
      const status = calcularStatusFerias(emp);
      return status === "Apto para férias";
    });
    if (aptosSemMarcar.length > 0) {
      list.push({
        type: "warning",
        title: "Aptos sem Férias Marcadas (Completaram 1 Ano)",
        description: "Instrutores com direito adquirido pendente de planejamento ou solicitação de gozo.",
        count: aptosSemMarcar.length,
        instructors: aptosSemMarcar.map((e) => e.nome)
      });
    }

    // 3. Férias próximas (Iniciando nos próximos 30 dias)
    const today = getToday();
    const limit = formatarDataCurta(new Date(new Date().setDate(new Date().getDate() + 30)));

    const proximasFerias = activeEmployees.filter((emp) => {
      return emp.periodosFerias?.some((p) => {
        const start = p.dataInicio;
        return start >= today && start <= limit;
      });
    });
    if (proximasFerias.length > 0) {
      list.push({
        type: "info",
        title: "Férias Próximas (Início em até 30 dias)",
        description: "Planeje as substituições ou escalas de ensino para cobrir as ausências temporárias.",
        count: proximasFerias.length,
        instructors: proximasFerias.map((e) => e.nome)
      });
    }

    // 4. Férias parceladas em múltiplos períodos (2 ou mais)
    const divididas = activeEmployees.filter((emp) => calcularPeriodosFerias(emp) >= 2);
    if (divididas.length > 0) {
      list.push({
        type: "info",
        title: "Férias Parceladas em Múltiplos Períodos",
        description: "Instrutores com cronograma de repouso fragmentado.",
        count: divididas.length,
        instructors: divididas.map((e) => `${e.nome} (${calcularPeriodosFerias(e)} períodos)`)
      });
    }

    // 5. Venda parcial de férias
    const vendidas = activeEmployees.filter((emp) => emp.feriasVendidas || (emp.diasVendidosFerias && emp.diasVendidosFerias > 0));
    if (vendidas.length > 0) {
      list.push({
        type: "success",
        title: "Férias Parcialmente Vendidas (Abono Pecuniário)",
        description: "Instrutores que solicitaram conversão de 1/3 das férias em abono pecuniário (dias vendidos).",
        count: vendidas.length,
        instructors: vendidas.map((e) => `${e.nome} (vendeu ${calcularDiasVendidos(e)} dias)`)
      });
    }

    return list;
  }, [activeEmployees]);

  // Aplicar Filtração nos dados de férias
  const filteredEmployees = useMemo(() => {
    return filtrarFerias(employees, filtros);
  }, [employees, filtros]);

  // Handlers para os botões e filtros rápidos
  const resetFilters = () => {
    setFiltros({
      search: "",
      zona: "",
      turno: "",
      idioma: "",
      statusFerias: "",
      periodoAdmissao: "all",
      periodoFerias: "all",
      somenteCriticos: false,
      somenteAptos: false
    });
  };

  const handleFilterChange = (field: keyof VacationFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="bg-white p-6 rounded-2xl border border-lavender shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-yinmn mb-1.5 font-extrabold text-xs">
            <Plane className="w-4.5 h-4.5 text-yinmn" />
            <span className="uppercase tracking-widest">Módulo Operacional CTM</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-oxford tracking-tight">
            Controle de Férias dos Instrutores
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Acompanhamento e planejamento legal das férias adquiridas com base no tempo de vigência contratual.
          </p>
        </div>
        
        {/* Indicador de Data de Referência do Sistema */}
        <div className="bg-lavender/10 border border-lavender px-3.5 py-2 rounded-xl flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-yinmn" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Data Base do Sistema</span>
            <span className="text-xs font-mono font-bold text-yinmn">03 de Julho de 2026</span>
          </div>
        </div>
      </div>

      {/* Grid de KPIs - 4 colunas em telas médias, bento grid de 8 cartões no total */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Férias Críticas */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("somenteCriticos", true);
          }}
          className={`p-4 rounded-2xl border transition-all duration-350 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
            filtros.somenteCriticos 
              ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-200 shadow-sm" 
              : "bg-white border-lavender shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-500">Críticas (Urgentes)</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.críticas}</p>
          <p className="text-[9px] text-rose-500/80 font-bold mt-1 uppercase">Atraso &gt; 1 ano e 6 meses</p>
        </div>

        {/* KPI 2: Aptos */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("somenteAptos", true);
          }}
          className={`p-4 rounded-2xl border transition-all duration-350 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
            filtros.somenteAptos 
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-200 shadow-sm" 
              : "bg-white border-lavender shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-600">Aptos (Sem Marcar)</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.aptos}</p>
          <p className="text-[9px] text-amber-500/80 font-bold mt-1 uppercase">Direito adquirido &gt; 1 ano</p>
        </div>

        {/* KPI 3: Férias Marcadas */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("statusFerias", "Férias marcadas");
          }}
          className="bg-white p-4 rounded-2xl border border-lavender shadow-sm transition-all duration-350 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-yinmn">Programadas</span>
            <div className="p-1.5 rounded-xl bg-lavender/30 text-yinmn">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.marcadas}</p>
          <p className="text-[9px] text-yinmn/80 font-bold mt-1 uppercase">Escaladas para gozo futuro</p>
        </div>

        {/* KPI 4: Férias em Andamento */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("statusFerias", "Férias em andamento");
          }}
          className="bg-white p-4 rounded-2xl border border-lavender shadow-sm transition-all duration-350 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-yinmn">Em Andamento</span>
            <div className="p-1.5 rounded-xl bg-lavender/30 text-yinmn">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.andamento}</p>
          <p className="text-[9px] text-yinmn/80 font-bold mt-1 uppercase">Gozo ativo atualmente</p>
        </div>

        {/* KPI 5: Férias Concluídas */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("statusFerias", "Férias concluídas");
          }}
          className="bg-white p-4 rounded-2xl border border-lavender shadow-sm transition-all duration-350 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600">Concluídas</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <History className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.concluídas}</p>
          <p className="text-[9px] text-emerald-500/80 font-bold mt-1 uppercase">Férias gozadas no período</p>
        </div>

        {/* KPI 6: Dias Vendidos */}
        <div className="bg-white p-4 rounded-2xl border border-lavender shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-700">Abonos (Dias Vendidos)</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <BadgePercent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.diasVendidos} dias</p>
          <p className="text-[9px] text-amber-500/85 font-bold mt-1 uppercase">Total de dias convertidos</p>
        </div>

        {/* KPI 7: Sem Férias > 1 Ano */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("periodoAdmissao", "1ano");
          }}
          className="bg-white p-4 rounded-2xl border border-lavender shadow-sm transition-all duration-350 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Sem Férias &gt; 1 Ano</span>
            <div className="p-1.5 rounded-xl bg-slate-50 text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.maisDe1AnoSemFerias}</p>
          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Trabalho acumulado &gt; 12m</p>
        </div>

        {/* KPI 8: Sem Férias > 1 Ano e 6 Meses */}
        <div 
          onClick={() => {
            resetFilters();
            handleFilterChange("periodoAdmissao", "1ano6meses");
          }}
          className="bg-white p-4 rounded-2xl border border-lavender shadow-sm transition-all duration-350 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-700">Sem Férias &gt; 1.5 Anos</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-oxford">{stats.maisDe1Ano6MesesSemFerias}</p>
          <p className="text-[9px] text-rose-500/80 font-bold mt-1 uppercase">Trabalho acumulado &gt; 18m</p>
        </div>

      </div>

      {/* Seção de Alertas Automáticos */}
      <div className="bg-white p-6 rounded-2xl border border-lavender shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-sm font-extrabold text-oxford uppercase tracking-wider">
                Painel de Alertas de Férias
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">Inconsistências e cronogramas destacados automaticamente pelo sistema.</p>
            </div>
          </div>
          <span className="text-xs font-black bg-lavender/30 text-yinmn px-3 py-1.5 rounded-xl">
            {alertsList.length} Alertas Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertsList.map((alert, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3.5 ${
                alert.type === "danger" 
                  ? "bg-rose-50/30 border-rose-100 text-slate-800" 
                  : alert.type === "warning" 
                  ? "bg-amber-50/30 border-amber-100 text-slate-800"
                  : alert.type === "success"
                  ? "bg-emerald-50/30 border-emerald-100 text-slate-800"
                  : "bg-lavender/10 border-lavender/50 text-slate-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-tight leading-tight">{alert.title}</h4>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                    alert.type === "danger" 
                      ? "bg-rose-100 text-rose-800" 
                      : alert.type === "warning" 
                      ? "bg-amber-100 text-amber-800"
                      : alert.type === "success"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-lavender/40 text-yinmn"
                  }`}>
                    {alert.count} instrutor{alert.count !== 1 ? "es" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{alert.description}</p>
              </div>
              
              <div className="pt-2 border-t border-dashed border-lavender/30">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Instrutores Afetados:</span>
                <div className="flex flex-wrap gap-1">
                  {alert.instructors.map((name, i) => (
                    <span 
                      key={i} 
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
                        alert.type === "danger" 
                          ? "bg-rose-50 text-rose-700 border border-rose-100/35" 
                          : alert.type === "warning" 
                          ? "bg-amber-50 text-amber-700 border border-amber-100/35"
                          : alert.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100/35"
                          : "bg-lavender/20 text-yinmn border border-lavender/35"
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {alertsList.length === 0 && (
            <div className="col-span-2 p-6 border border-dashed border-lavender bg-lavender/10 rounded-2xl text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-500">Nenhum alerta de férias ativo!</p>
              <p className="text-[10px] text-slate-400">Todas as vigências e planejamentos de férias estão normais ou concluídos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bloco de Filtros Avançados */}
      <div className="bg-white p-4 rounded-2xl border border-lavender shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Busca Principal */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar instrutor por nome ou ID..."
              value={filtros.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9 w-full rounded-xl border border-lavender py-2 text-xs focus:border-jordy focus:ring-1 focus:ring-jordy/20 outline-none placeholder:text-slate-400 text-oxford font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Botão para Expandir Filtros Avançados */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex-1 sm:flex-initial text-xs font-bold py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                showAdvanced || Object.values(filtros).some(v => v !== "" && v !== false && v !== "all")
                  ? "bg-lavender/30 border-lavender text-yinmn"
                  : "bg-white border-lavender text-slate-500 hover:bg-lavender/10"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros Avançados</span>
              {showAdvanced ? (
                <X className="w-3.5 h-3.5" />
              ) : null}
            </button>

            {/* Limpar Filtros */}
            <button
              onClick={resetFilters}
              className="text-xs font-bold py-2 px-3 rounded-xl border border-lavender text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Limpar</span>
            </button>
          </div>
        </div>

        {/* Painel Expansível de Filtros Avançados */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-lavender/40">
            
            {/* Filtro: Zona */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Zona</label>
              <select
                value={filtros.zona}
                onChange={(e) => handleFilterChange("zona", e.target.value)}
                className="w-full rounded-xl border border-lavender p-2 text-xs outline-none bg-white text-slate-600 font-semibold focus:border-jordy cursor-pointer"
              >
                <option value="">Todas as Zonas</option>
                <option value="Zona Sul">Zona Sul</option>
                <option value="Zona Norte">Zona Norte</option>
                <option value="Zona Leste">Zona Leste</option>
                <option value="Zona Oeste">Zona Oeste</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>

            {/* Filtro: Turno */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Turno</label>
              <select
                value={filtros.turno}
                onChange={(e) => handleFilterChange("turno", e.target.value)}
                className="w-full rounded-xl border border-lavender p-2 text-xs outline-none bg-white text-slate-600 font-semibold focus:border-jordy cursor-pointer"
              >
                <option value="">Todos os Turnos</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </div>

            {/* Filtro: Idioma */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Idioma de Ensino</label>
              <select
                value={filtros.idioma}
                onChange={(e) => handleFilterChange("idioma", e.target.value)}
                className="w-full rounded-xl border border-lavender p-2 text-xs outline-none bg-white text-slate-600 font-semibold focus:border-jordy cursor-pointer"
              >
                <option value="">Todos os Idiomas</option>
                {availableLanguages.map((lang, idx) => (
                  <option key={idx} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Filtro: Status de Férias */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status de Férias</label>
              <select
                value={filtros.statusFerias}
                onChange={(e) => handleFilterChange("statusFerias", e.target.value)}
                className="w-full rounded-xl border border-lavender p-2 text-xs outline-none bg-white text-slate-600 font-semibold focus:border-jordy cursor-pointer"
              >
                <option value="">Todos os Status</option>
                <option value="Não elegível">Não elegível</option>
                <option value="Apto para férias">Apto para férias</option>
                <option value="Férias marcadas">Férias marcadas</option>
                <option value="Férias em andamento">Férias em andamento</option>
                <option value="Férias concluídas">Férias concluídas</option>
                <option value="Férias críticas">Férias críticas</option>
                <option value="Férias parcialmente vendidas">Férias parcialmente vendidas</option>
              </select>
            </div>

            {/* Filtro: Período de Admissão */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Período de Admissão</label>
              <select
                value={filtros.periodoAdmissao}
                onChange={(e) => handleFilterChange("periodoAdmissao", e.target.value)}
                className="w-full rounded-xl border border-lavender p-2 text-xs outline-none bg-white text-slate-600 font-semibold focus:border-jordy cursor-pointer"
              >
                <option value="all">Todas as admissões</option>
                <option value="menos1ano">Menos de 1 ano de trabalho (&lt; 12 meses)</option>
                <option value="1ano">Mais de 1 ano de trabalho (Com direito)</option>
                <option value="1ano6meses">Mais de 1 ano e 6 meses (Urgência)</option>
              </select>
            </div>

            {/* Filtro: Período de Férias */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Escala de Gozo</label>
              <select
                value={filtros.periodoFerias}
                onChange={(e) => handleFilterChange("periodoFerias", e.target.value)}
                className="w-full rounded-xl border border-lavender p-2 text-xs outline-none bg-white text-slate-600 font-semibold focus:border-jordy cursor-pointer"
              >
                <option value="all">Qualquer período</option>
                <option value="esteMes">Este Mês (Julho 2026)</option>
                <option value="proximoMes">Próximo Mês (Agosto 2026)</option>
                <option value="proximos3meses">Próximos 3 Meses (Jul/Ago/Set)</option>
              </select>
            </div>

            {/* Filtro Rápido: Somente Críticos */}
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="somenteCriticos"
                checked={filtros.somenteCriticos}
                onChange={(e) => handleFilterChange("somenteCriticos", e.target.checked)}
                className="rounded border-lavender text-yinmn focus:ring-jordy cursor-pointer"
              />
              <label htmlFor="somenteCriticos" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                Somente Críticos
              </label>
            </div>

            {/* Filtro Rápido: Somente Aptos */}
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="somenteAptos"
                checked={filtros.somenteAptos}
                onChange={(e) => handleFilterChange("somenteAptos", e.target.checked)}
                className="rounded border-lavender text-yinmn focus:ring-jordy cursor-pointer"
              />
              <label htmlFor="somenteAptos" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                Somente Aptos (Sem Marcar)
              </label>
            </div>

          </div>
        )}
      </div>

      {/* Tabela de Instrutores */}
      <div className="bg-white rounded-2xl border border-lavender shadow-sm overflow-hidden">
        
        {/* Título da Tabela */}
        <div className="p-5 border-b border-lavender/40 flex items-center justify-between bg-lavender/5">
          <div>
            <h3 className="text-sm font-black text-oxford uppercase tracking-wider">
              Lista Operacional de Férias
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">Exibindo {filteredEmployees.length} de {activeEmployees.length} instrutores ativos</p>
          </div>
        </div>

        {/* Container Scrollable para a Tabela */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-lavender/50 bg-lavender/5 text-[10px] uppercase font-black text-slate-400">
                <th className="py-3.5 px-4">Nome / ID</th>
                <th className="py-3.5 px-4">Lotação (Cargo/Zona/Turno)</th>
                <th className="py-3.5 px-4">Admissão</th>
                <th className="py-3.5 px-4">Tempo de Trabalho</th>
                <th className="py-3.5 px-4">Status de Férias</th>
                <th className="py-3.5 px-4">Gozo Programado</th>
                <th className="py-3.5 px-4">Saldos (Total/Vendidos/Tirados)</th>
                <th className="py-3.5 px-4">Alerta</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lavender/20">
              {filteredEmployees.map((emp) => {
                const status = calcularStatusFerias(emp);
                const isCritico = status === "Férias críticas";
                const tempo = calcularTempoTrabalho(emp.dataAdmissao);
                const alerta = identificarAlertaFerias(emp);
                
                // Pegar informações de gozo se houver
                const primPeriodo = emp.periodosFerias?.[0];
                const outrosPeriodosCount = Math.max(0, (emp.periodosFerias?.length || 0) - 1);
                
                return (
                  <tr 
                    key={emp.recordId} 
                    className={`hover:bg-lavender/10 transition-colors duration-200 text-xs ${
                      isCritico ? "bg-rose-50/15" : ""
                    }`}
                  >
                    {/* Nome & ID */}
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-extrabold text-oxford block hover:text-yinmn transition-colors cursor-pointer">
                          {emp.nome}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {emp.idFuncionario || "ID Pendente"}
                        </span>
                      </div>
                    </td>

                    {/* Lotação */}
                    <td className="py-4 px-4 text-slate-500 font-semibold">
                      <div>
                        <span className="font-extrabold text-oxford block">{emp.cargo}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                          {emp.zona || "Sem Zona"} • {emp.turno || "Sem Turno"}
                        </span>
                      </div>
                    </td>

                    {/* Data de Admissão */}
                    <td className="py-4 px-4 text-slate-500 font-semibold">
                      {formatarDataBR(emp.dataAdmissao)}
                    </td>

                    {/* Tempo de Trabalho */}
                    <td className="py-4 px-4 text-oxford font-extrabold">
                      {tempo.texto}
                    </td>

                    {/* Status de Férias */}
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        status === "Férias críticas"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : status === "Apto para férias"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : status === "Férias em andamento"
                          ? "bg-lavender/30 text-yinmn border border-lavender"
                          : status === "Férias concluídas"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-sky-50 text-sky-600 border border-sky-100"
                      }`}>
                        {status}
                      </span>
                    </td>

                    {/* Gozo Programado */}
                    <td className="py-4 px-4">
                      {primPeriodo ? (
                        <div className="space-y-0.5 font-semibold text-slate-600">
                          <span className="font-bold text-oxford block">
                            De {formatarDataBR(primPeriodo.dataInicio)}
                          </span>
                          <span className="font-bold text-oxford block">
                            Até {formatarDataBR(primPeriodo.dataFim)}
                          </span>
                          {outrosPeriodosCount > 0 && (
                            <span className="text-[9px] bg-lavender/30 text-yinmn px-1.5 py-0.5 rounded border border-lavender/30 font-bold uppercase block mt-1 w-max">
                              + {outrosPeriodosCount} período{outrosPeriodosCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic font-semibold">Sem programação</span>
                      )}
                    </td>

                    {/* Saldos */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs">
                        <span className="text-slate-500 font-semibold" title="Dias Totais">{calcularDiasFerias(emp)}d</span>
                        <span className="text-slate-200">/</span>
                        <span className="text-amber-600" title="Dias Vendidos">{calcularDiasVendidos(emp)}v</span>
                        <span className="text-slate-200">/</span>
                        <span className="text-emerald-600" title="Dias Tirados">{calcularDiasTirados(emp)}t</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1 font-bold">
                        {calcularPeriodosFerias(emp)} período{calcularPeriodosFerias(emp) !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Alerta */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${alerta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${alerta.dotColor}`} />
                        <span>{alerta.label}</span>
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="text-xs bg-lavender/10 hover:bg-lavender/30 text-slate-500 hover:text-yinmn font-bold py-1.5 px-3 rounded-xl border border-lavender/30 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                      >
                        Visualizar Ficha
                      </button>
                    </td>

                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-400 bg-slate-50/20">
                    <Search className="w-8 h-8 text-jordy mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Nenhum instrutor encontrado para os filtros aplicados.</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Altere os filtros de busca ou clique em "Limpar" para reiniciar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Painel de Detalhes de Férias Lateral */}
      {selectedEmployee && (
        <VacationDetailsPanel
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {formEmployee && (
        <VacationFormPanel
          employee={formEmployee}
          allEmployees={employees}
          onClose={() => setFormEmployee(null)}
          onSave={(updated, autoSubst) => {
            if (props.onSave) props.onSave(updated, autoSubst);
            setFormEmployee(null);
          }}
        />
      )}

    </div>
  );
};
