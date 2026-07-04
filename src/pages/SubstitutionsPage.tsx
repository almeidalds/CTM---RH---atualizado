/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Plus,
  Users,
  Search,
  Filter,
  AlertOctagon,
  Calendar,
  Check,
  Languages,
  Clock,
  MapPin,
  CheckCircle,
  HelpCircle,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { RhEmployee, Substitution, SubstitutionReason, SubstitutionStatus, AbsenceItem } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { obterSubstituicoes, salvarSubstituicoes } from "../services/additionalDataSource";
import { calcularStatusFerias } from "../utils/vacationUtils";
import { SubstitutionSummaryCard } from "../components/SummaryCard";
import { validarLimiteAusencias,  gerarDatasNoIntervalo } from "../utils/absenceUtils";

interface SubstitutionsPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
  onRefreshData?: () => void;
}

export const SubstitutionsPage: React.FC<SubstitutionsPageProps> = ({
  employees,
  onSelectEmployee,
  onRefreshData
}) => {
  const [subs, setSubs] = useState<Substitution[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReason, setSelectedReason] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRecommenderOpen, setIsRecommenderOpen] = useState(false);
  const [activeSubForRecommendation, setActiveSubForRecommendation] = useState<Substitution | null>(null);

  // Form Inputs
  const [formAbsentName, setFormAbsentName] = useState("");
  const [formReason, setFormReason] = useState<SubstitutionReason>("Férias");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formLanguage, setFormLanguage] = useState("");
  const [formZone, setFormZone] = useState("");
  const [formShift, setFormShift] = useState("");
  const [formSub, setFormSub] = useState("");
  const [formStatus, setFormStatus] = useState<SubstitutionStatus>("Pendente");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    setSubs(obterSubstituicoes());
  }, []);

  const handleSaveSubstitutions = (updated: Substitution[]) => {
    setSubs(updated);
    salvarSubstituicoes(updated);
    if (onRefreshData) onRefreshData();
  };

  // 1. CALCULAR REGRAS DE RISCO DA SUBSTITUIÇÃO
  // - Crítico: ausência sem substituto em até 7 dias
  // - Alto: ausência sem substituto em até 15 dias
  // - Médio: ausência futura sem substituto
  // - Baixo: substituto já definido
  // - Concluído: substituição finalizada
  const calcularRiscoSubstituicao = (sub: Substitution): { label: string; color: string; bg: string } => {
    if (sub.status === "Concluída" || sub.status === "Cancelada") {
      return { label: "Concluído", color: "text-emerald-700 border-emerald-200", bg: "bg-emerald-50" };
    }
    
    if (sub.substituto && sub.substituto.trim() !== "") {
      return { label: "Baixo", color: "text-blue-700 border-blue-200", bg: "bg-blue-50" };
    }

    const diasParaInicio = calcularDiasRestantes(sub.dataInicio);
    if (diasParaInicio !== null) {
      if (diasParaInicio < 0) {
        return { label: "Crítico", color: "text-rose-700 border-rose-200 animate-pulse", bg: "bg-rose-50" };
      }
      if (diasParaInicio <= 7) {
        return { label: "Crítico", color: "text-rose-700 border-rose-200 animate-pulse", bg: "bg-rose-50" };
      }
      if (diasParaInicio <= 15) {
        return { label: "Alto", color: "text-orange-700 border-orange-200", bg: "bg-orange-50" };
      }
    }
    
    return { label: "Médio", color: "text-amber-700 border-amber-200", bg: "bg-amber-50" };
  };

  // 2. SUGERIR SUBSTITUTOS INTELIGENTES
  const obterSugestoesSubstitutos = (sub: Substitution) => {
    const list: Array<{
      emp: RhEmployee;
      score: number;
      reasons: string[];
      matchLang: boolean;
      matchShift: boolean;
      matchZone: boolean;
      conflitoFerias: boolean;
      conflitoSub: boolean;
    }> = [];

    const startDays = gerarDatasNoIntervalo(sub.dataInicio, sub.dataFim);

    // Filtrar instrutores ativos e que não sejam o próprio ausente
    const candidatos = employees.filter(
      (e) => e.statusFuncionario === "Ativo" && e.nome !== sub.instrutorAusente
    );

    candidatos.forEach((candidate) => {
      let score = 0;
      const reasons: string[] = [];

      // Idioma (Mesmo idioma?)
      const matchLang = candidate.idiomas?.some(
        (l) => l.toLowerCase() === sub.idioma.toLowerCase()
      ) ?? false;
      if (matchLang) {
        score += 50;
        reasons.push("Mesmo idioma");
      }

      // Turno (Mesmo turno?)
      const matchShift = candidate.turno?.toLowerCase() === sub.turno?.toLowerCase();
      if (matchShift) {
        score += 25;
        reasons.push("Mesmo turno");
      }

      // Zona (Mesma zona?)
      const matchZone = candidate.zona?.toLowerCase() === sub.zona?.toLowerCase();
      if (matchZone) {
        score += 15;
        reasons.push("Mesma zona");
      }

      // Conflito de férias
      let conflitoFerias = false;
      candidate.periodosFerias?.forEach((f) => {
        const diasFerias = gerarDatasNoIntervalo(f.dataInicio, f.dataFim);
        const overlap = startDays.some((d) => diasFerias.includes(d));
        if (overlap) conflitoFerias = true;
      });

      if (conflitoFerias) {
        score -= 80;
        reasons.push("De férias neste período");
      }

      // Conflito de outras substituições como ausente ou substituto
      let conflitoSub = false;
      subs.forEach((otherSub) => {
        if (otherSub.recordId !== sub.recordId && otherSub.status !== "Cancelada" && otherSub.status !== "Concluída") {
          // Se o candidato já é o ausente ou já foi definido como substituto de outra pessoa
          if (otherSub.instrutorAusente === candidate.nome || otherSub.substituto === candidate.nome) {
            const otherDays = gerarDatasNoIntervalo(otherSub.dataInicio, otherSub.dataFim);
            const overlap = startDays.some((d) => otherDays.includes(d));
            if (overlap) conflitoSub = true;
          }
        }
      });

      if (conflitoSub) {
        score -= 60;
        reasons.push("Já escalado em outra substituição");
      }

      list.push({
        emp: candidate,
        score,
        reasons,
        matchLang,
        matchShift,
        matchZone,
        conflitoFerias,
        conflitoSub
      });
    });

    // Ordenar por score descendente (apenas scores positivos/razoáveis no topo)
    return list.sort((a, b) => b.score - a.score);
  };

  const handleOpenRecommender = (sub: Substitution) => {
    setActiveSubForRecommendation(sub);
    setIsRecommenderOpen(true);
  };

  const handleApplySubstitute = (sub: Substitution, name: string) => {
    const updated = subs.map((s) => {
      if (s.recordId === sub.recordId) {
        return {
          ...s,
          substituto: name,
          status: name ? "Substituto definido" as const : "Sem substituto" as const
        };
      }
      return s;
    });
    handleSaveSubstitutions(updated);
    setIsRecommenderOpen(false);
    setActiveSubForRecommendation(null);
  };

  const handleCreateSubstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAbsentName || !formStart || !formEnd) {
      // Missing required fields
      return;
    }

    // Calcular dias
    const start = new Date(formStart);
    const end = new Date(formEnd);
    let diff = 0;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const nova: Substitution = {
      recordId: `sub-${Date.now()}`,
      instrutorAusente: formAbsentName,
      motivo: formReason,
      dataInicio: formStart,
      dataFim: formEnd,
      dias: diff > 0 ? diff : 1,
      idioma: formLanguage,
      zona: formZone,
      turno: formShift,
      substituto: formSub,
      status: formStatus,
      observacoes: formNotes
    };

    handleSaveSubstitutions([nova, ...subs]);
    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteSub = (id: string) => {
    handleSaveSubstitutions(subs.filter((s) => s.recordId !== id));
  };

  const resetForm = () => {
    setFormAbsentName("");
    setFormReason("Férias");
    setFormStart("");
    setFormEnd("");
    setFormLanguage("");
    setFormZone("");
    setFormShift("");
    setFormSub("");
    setFormStatus("Pendente");
    setFormNotes("");
  };

  // Filtrar subs de acordo com buscas
  const filteredSubs = subs.filter((sub) => {
    const matchesSearch =
      sub.instrutorAusente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.substituto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.idioma.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReason = selectedReason === "all" || sub.motivo === selectedReason;
    const matchesStatus = selectedStatus === "all" || sub.status === selectedStatus;

    return matchesSearch && matchesReason && matchesStatus;
  });

  // Estatísticas dos Cards
  const totalPendentes = subs.filter((s) => s.status === "Pendente" || s.status === "Em análise").length;
  const totalSemResponsavel = subs.filter((s) => s.status === "Sem substituto" || !s.substituto).length;
  const totalEmAndamento = subs.filter((s) => s.status === "Em andamento").length;
  
  // Substituições Futuras (início após 2026-07-03)
  const totalFuturas = subs.filter((s) => s.dataInicio > "2026-07-03" && s.status !== "Cancelada").length;

  // Substituições Críticas (crítico pelo cálculo de risco)
  const totalCriticas = subs.filter((s) => calcularRiscoSubstituicao(s).label === "Crítico").length;

  // Idiomas impactados (lista única)
  const idiomasImpactados = Array.from(new Set(subs.map((s) => s.idioma).filter(Boolean))).length;

  // Turnos impactados (lista única)
  const turnosImpactados = Array.from(new Set(subs.map((s) => s.turno).filter(Boolean))).length;

  const motivos = [
    "Férias", "Doença", "Treinamento", "Viagem", "Ausência aprovada",
    "Término de contrato", "Mudança de turno", "Reposição temporária", "Outro"
  ];

  const statusList = [
    "Pendente", "Em análise", "Substituto definido", "Sem substituto", "Em andamento", "Concluída", "Cancelada"
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-purple-100/30 pb-4 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1A2C] flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <span>Controle de Substituições Docentes</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Planeje coberturas de aulas para afastamentos e férias de professores de forma automatizada e inteligente.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition-all select-none"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Afastamento</span>
        </button>
      </div>

      {/* Grid de Cards KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
          <span className="text-[9px] uppercase font-black text-amber-600 tracking-wider block">Pendentes</span>
          <span className="text-lg font-extrabold text-amber-900 block mt-0.5">{totalPendentes}</span>
        </div>
        
        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
          <span className="text-[9px] uppercase font-black text-rose-600 tracking-wider block">Sem Responsável</span>
          <span className="text-lg font-extrabold text-rose-900 block mt-0.5">{totalSemResponsavel}</span>
        </div>

        <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
          <span className="text-[9px] uppercase font-black text-blue-600 tracking-wider block">Em Andamento</span>
          <span className="text-lg font-extrabold text-blue-900 block mt-0.5">{totalEmAndamento}</span>
        </div>

        <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100">
          <span className="text-[9px] uppercase font-black text-purple-600 tracking-wider block">Futuras</span>
          <span className="text-lg font-extrabold text-purple-900 block mt-0.5">{totalFuturas}</span>
        </div>

        <div className="p-3.5 bg-red-100/70 rounded-2xl border border-red-200">
          <span className="text-[9px] uppercase font-black text-red-700 tracking-wider block">Críticas</span>
          <span className="text-lg font-extrabold text-red-900 block mt-0.5">{totalCriticas}</span>
        </div>

        <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-100">
          <span className="text-[9px] uppercase font-black text-sky-600 tracking-wider block">Idiomas Impactados</span>
          <span className="text-lg font-extrabold text-sky-900 block mt-0.5">{idiomasImpactados}</span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[9px] uppercase font-black text-slate-600 tracking-wider block">Turnos Afetados</span>
          <span className="text-lg font-extrabold text-slate-900 block mt-0.5">{turnosImpactados}</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-purple-50/70 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por instrutor ausente, substituto ou idioma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-purple-100/80 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Motivo */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-purple-100/40 rounded-xl px-2.5 py-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="all">Motivo (Todos)</option>
              {motivos.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-purple-100/40 rounded-xl px-2.5 py-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="all">Status (Todos)</option>
              {statusList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Substituições - Responsive Card Grid */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100/40 shadow-sm p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-bounce" />
          <h3 className="text-base font-extrabold text-[#1F1A2C] mb-1">Nenhum afastamento ou substituição</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente reajustar seus filtros avançados ou pesquise por outro termo de busca para localizar registros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubs.map((sub) => {
            const risco = calcularRiscoSubstituicao(sub);
            return (
              <SubstitutionSummaryCard
                key={sub.recordId}
                substitution={sub}
                onOpenRecommender={handleOpenRecommender}
                onEdit={(s) => {
                  setFormAbsentName(s.instrutorAusente);
                  setFormReason(s.motivo);
                  setFormStart(s.dataInicio);
                  setFormEnd(s.dataFim);
                  setFormLanguage(s.idioma);
                  setFormZone(s.zona);
                  setFormShift(s.turno);
                  setFormSub(s.substituto);
                  setFormStatus(s.status);
                  setFormNotes(s.observacoes);
                  // Remover o atual para substituir ao salvar
                  setSubs(subs.filter(x => x.recordId !== s.recordId));
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteSub}
                risco={risco}
              />
            );
          })}
        </div>
      )}

      {/* FLYOUT MODAL 1 - FORMULÁRIO DE AFASTAMENTO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-purple-100 max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#1F1A2C] mb-4">
              Registrar Ausência / Afastamento Temporário
            </h3>
            
            <form onSubmit={handleCreateSubstitution} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Instrutor Ausente *</label>
                  <select
                    value={formAbsentName}
                    onChange={(e) => {
                      setFormAbsentName(e.target.value);
                      const matchingEmployee = employees.find(emp => emp.nome === e.target.value);
                      if (matchingEmployee) {
                        setFormLanguage(matchingEmployee.idiomas?.[0] || "");
                        setFormZone(matchingEmployee.zona || "");
                        setFormShift(matchingEmployee.turno || "");
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-bold focus:outline-none focus:border-purple-400"
                    required
                  >
                    <option value="">Selecione o funcionário...</option>
                    {employees.filter(e => e.statusFuncionario === "Ativo").map((emp) => (
                      <option key={emp.recordId} value={emp.nome}>{emp.nome} ({emp.cargo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Motivo do Afastamento</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value as SubstitutionReason)}
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-bold focus:outline-none"
                  >
                    {motivos.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Idioma Afetado</label>
                  <input
                    type="text"
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    placeholder="Ex: Espanhol"
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Data de Início *</label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Data de Término *</label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Zona</label>
                  <input
                    type="text"
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                    placeholder="Ex: Zona Sul"
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Turno</label>
                  <input
                    type="text"
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    placeholder="Ex: Tarde"
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Substituto (Opcional)</label>
                  <select
                    value={formSub}
                    onChange={(e) => setFormSub(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                  >
                    <option value="">Nenhum - Cobertura pendente</option>
                    {employees.filter(e => e.statusFuncionario === "Ativo" && e.nome !== formAbsentName).map((emp) => (
                      <option key={emp.recordId} value={emp.nome}>{emp.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as SubstitutionStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-bold"
                  >
                    {statusList.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Observações Internas</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="Observações complementares ou diretrizes de cobertura..."
                    className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="pt-4 flex justify-end gap-2 border-t border-purple-50">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md"
                >
                  Salvar Substituição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLYOUT MODAL 2 - RECOMENDADOR DE SUBSTITUTOS INTELIGENTES */}
      {isRecommenderOpen && activeSubForRecommendation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-purple-100 max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="border-b border-purple-50 pb-3 mb-4">
              <span className="text-[10px] uppercase font-black text-purple-600 tracking-wider">
                Motor de Sugestão de Cobertura
              </span>
              <h3 className="text-sm font-black text-[#1F1A2C] mt-1">
                Recomendando Substituto para: <span className="text-purple-700">{activeSubForRecommendation.instrutorAusente}</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Ausência programada por {activeSubForRecommendation.motivo} ({activeSubForRecommendation.dias} dias: {formatarDataBR(activeSubForRecommendation.dataInicio)} - {formatarDataBR(activeSubForRecommendation.dataFim)}) no idioma <span className="text-slate-700 font-bold">{activeSubForRecommendation.idioma}</span>, turno {activeSubForRecommendation.turno} na {activeSubForRecommendation.zona}.
              </p>
            </div>

            {/* Recommender Candidates List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
              {obterSugestoesSubstitutos(activeSubForRecommendation).map((item) => {
                const isTopMatch = item.score >= 50;
                return (
                  <div
                    key={item.emp.recordId}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                      isTopMatch
                        ? "bg-purple-50/25 border-purple-100 hover:border-purple-300"
                        : "bg-slate-50/55 border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {/* Candidate Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[#1F1A2C]">{item.emp.nome}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {item.emp.cargo}
                        </span>
                        
                        {/* Match Percentage Badge */}
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                          item.score >= 70
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : item.score >= 40
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          Score: {item.score}pts
                        </span>
                      </div>

                      {/* Reasons explanation tags */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                        <span className="text-slate-400 font-medium">Metas de Correspondência:</span>
                        {item.matchLang ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.2 font-bold uppercase text-[8px]">
                            <Languages className="w-2.5 h-2.5" /> Idioma Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 rounded px-1.5 py-0.2 font-bold uppercase text-[8px]">
                            Diferente Idioma
                          </span>
                        )}

                        {item.matchShift && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.2 font-bold uppercase text-[8px]">
                            <Clock className="w-2.5 h-2.5" /> Turno Match
                          </span>
                        )}

                        {item.matchZone && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.2 font-bold uppercase text-[8px]">
                            <MapPin className="w-2.5 h-2.5" /> Zona Match
                          </span>
                        )}

                        {item.conflitoFerias && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-900 rounded px-1.5 py-0.2 font-black uppercase text-[8px] animate-pulse">
                            Conflito de Férias!
                          </span>
                        )}

                        {item.conflitoSub && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-900 rounded px-1.5 py-0.2 font-black uppercase text-[8px] animate-pulse">
                            Escalado em outra substituição!
                          </span>
                        )}
                      </div>
                      
                      {/* Sub-status notes */}
                      <div className="text-[10px] text-slate-400 font-medium italic">
                        Idiomas cadastrados: {item.emp.idiomas?.join(", ") || "Nenhum"} • Turno: {item.emp.turno} • Zona: {item.emp.zona}
                      </div>
                    </div>

                    {/* Choose candidate button */}
                    <button
                      onClick={() => handleApplySubstitute(activeSubForRecommendation, item.emp.nome)}
                      disabled={item.conflitoFerias || item.conflitoSub}
                      className={`text-xs font-black py-2 px-3.5 rounded-xl transition-all duration-200 ${
                        item.conflitoFerias || item.conflitoSub
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : isTopMatch
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      Atribuir Cobertura
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-purple-50 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <span>* Prioriza mesma especialização linguística, horário acadêmico e proximidade de campus.</span>
              <button
                onClick={() => {
                  setIsRecommenderOpen(false);
                  setActiveSubForRecommendation(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-2 px-4 rounded-xl"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
