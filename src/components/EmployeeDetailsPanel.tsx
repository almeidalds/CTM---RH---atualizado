/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Copy,
  Check,
  Video,
  AlertTriangle,
  User,
  Calendar,
  Layers,
  Clock,
  Globe2,
  FileEdit,
  ClipboardCheck,
  Plus,
  MessageSquare,
  ShieldAlert,
  FileText,
  Plane,
  RefreshCw,
  Settings,
  Filter
} from "lucide-react";
import { RhEmployee, TimelineEvent, TimelineEventCategory } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";
import { StatusBadge } from "./StatusBadge";
import { RiskBadge } from "./RiskBadge";
import { obterTimelineEvents, adicionarTimelineEvent } from "../services/additionalDataSource";

interface EmployeeDetailsPanelProps {
  employee: RhEmployee | null;
  onClose: () => void;
  onEdit: (employee: RhEmployee) => void;
}

export const EmployeeDetailsPanel: React.FC<EmployeeDetailsPanelProps> = ({
  employee,
  onClose,
  onEdit
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Timeline states
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newObs, setNewObs] = useState("");
  const [newCategory, setNewCategory] = useState<TimelineEventCategory>("Alteração administrativa");

  useEffect(() => {
    if (employee) {
      const stored = obterTimelineEvents(employee.recordId);
      
      // Se não houver eventos cadastrados para esse funcionário, criamos eventos dinâmicos baseados no cadastro dele
      if (stored.length === 0) {
        const autoEvents: TimelineEvent[] = [];
        
        if (employee.dataAdmissao) {
          autoEvents.push({
            recordId: `auto-adm-${employee.recordId}`,
            data: employee.dataAdmissao,
            tipo: "Data de admissão",
            descricao: `Admissão contratual registrada no cargo de ${employee.cargo || "Instrutor"}.`,
            responsavel: "Robson (Gerente de RH)",
            categoria: "Cadastro",
            status: "Concluído"
          });
        }
        
        if (employee.dataTerminoReal) {
          autoEvents.push({
            recordId: `auto-term-${employee.recordId}`,
            data: employee.dataTerminoReal,
            tipo: "Data de término de contrato",
            descricao: "Previsão de encerramento da vigência do contrato atual.",
            responsavel: "Sistema de Alertas",
            categoria: "Contrato",
            status: "Planejado"
          });
        }

        if (employee.periodosFerias && employee.periodosFerias.length > 0) {
          employee.periodosFerias.forEach((f, idx) => {
            autoEvents.push({
              recordId: `auto-fer-${idx}-${employee.recordId}`,
              data: f.dataInicio,
              tipo: "Férias marcadas",
              descricao: `Período programado de gozo de férias por ${f.dias} dias (término em ${formatarDataBR(f.dataFim)}).`,
              responsavel: "Letícia (Analista)",
              categoria: "Férias",
              status: "Confirmado"
            });
          });
        }
        
        setEvents(autoEvents.sort((a, b) => b.data.localeCompare(a.data)));
      } else {
        setEvents(stored);
      }
    }
  }, [employee]);

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !newObs.trim()) return;

    const dataHoje = new Date().toISOString().split("T")[0];
    const updatedEvents = adicionarTimelineEvent(employee.recordId, {
      data: dataHoje,
      tipo: "Observação adicionada",
      descricao: newObs.trim(),
      responsavel: "Coordenação de RH",
      categoria: newCategory,
      status: "Adicionado",
      observacoes: ""
    });

    setEvents(updatedEvents);
    setNewObs("");
  };

  if (!employee) return null;


  const risk = calcularRisco(employee);
  const pendencias = identificarPendencias(employee);
  const dias = calcularDiasRestantes(employee.dataTerminoReal);

  const handleCopyEmail = () => {
    if (!employee.emailCorporativo) return;
    navigator.clipboard.writeText(employee.emailCorporativo);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopySummary = () => {
    const resumo = `Nome: ${employee.nome}
Cargo: ${employee.cargo || "Não definido"}
Zona: ${employee.zona || "Não cadastrada"}
Turno: ${employee.turno || "Não cadastrado"}
Idiomas: ${employee.idiomas?.join(", ") || "Nenhum"}
Status: ${employee.statusFuncionario}
Término: ${formatarDataBR(employee.dataTerminoReal)}
Risco: ${risk}`;

    navigator.clipboard.writeText(resumo);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Flyout panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 translate-x-0">
        {/* Header */}
        <div className="bg-[#0D1B2F] text-white p-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
              <User className="w-5 h-5 text-[#00995D]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight truncate max-w-[280px]">
                {employee.nome}
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                {employee.idFuncionario || "ID Pendente"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100">
            <StatusBadge status={employee.statusFuncionario} />
            <RiskBadge level={risk} />
          </div>

          {/* Dados do Cargo e Turno */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#60708A]">Informações de Lotação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[#60708A] mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Cargo</span>
                </div>
                <p className="text-xs font-bold text-[#0D1B2F] truncate">
                  {employee.cargo || "Não definido"}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[#60708A] mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Turno</span>
                </div>
                <p className="text-xs font-bold text-[#0D1B2F] truncate">
                  {employee.turno || "Não cadastrado"}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[#60708A] mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Zona</span>
                </div>
                <p className="text-xs font-bold text-[#0D1B2F] truncate">
                  {employee.zona || "Não cadastrada"}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[#60708A] mb-1">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Idiomas</span>
                </div>
                <p className="text-xs font-bold text-[#0D1B2F] truncate" title={employee.idiomas?.join(", ") || "Nenhum"}>
                  {employee.idiomas?.join(", ") || "Nenhum cadastrado"}
                </p>
              </div>
            </div>
          </div>

          {/* Datas de Contrato */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#60708A]">Vigência Contratual</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[#60708A] mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Admissão</span>
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  {formatarDataBR(employee.dataAdmissao)}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[#60708A] mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Término Real</span>
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  {formatarDataBR(employee.dataTerminoReal)}
                </p>
              </div>
            </div>

            {employee.statusFuncionario !== "Encerrado" && employee.dataTerminoReal && (
              <div className="p-4 rounded-xl bg-[#EEF6FF] border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black text-blue-800 block">Tempo Restante de Contrato</span>
                  <span className="text-sm font-black text-blue-900">
                    {dias !== null && dias >= 0 ? `${dias} dias` : "Contrato encerrado ou inválido"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-blue-800 block">Status de Risco</span>
                  <span className="text-xs font-bold text-blue-900">{risk}</span>
                </div>
              </div>
            )}
          </div>

          {/* Contatos Corporativos */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#60708A]">Contato e Salas Virtuais</h3>
            
            <div className="space-y-2">
              {/* E-mail */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-white shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">E-mail Corporativo</span>
                    <p className="text-xs text-gray-700 truncate font-semibold">
                      {employee.emailCorporativo || "Não cadastrado"}
                    </p>
                  </div>
                </div>
                {employee.emailCorporativo && (
                  <button
                    onClick={handleCopyEmail}
                    className="p-1.5 text-gray-400 hover:text-[#00995D] hover:bg-gray-50 rounded-lg transition-colors"
                    title="Copiar e-mail"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-[#00995D]" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Zoom Link */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-white shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Video className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Sala Pessoal do Zoom</span>
                    <p className="text-xs text-gray-700 truncate font-semibold">
                      {employee.linkZoom || "Não cadastrado"}
                    </p>
                  </div>
                </div>
                {employee.linkZoom ? (
                  <a
                    href={employee.linkZoom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center shadow"
                    title="Acessar sala de aula virtual"
                  >
                    <Video className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Não disponível</span>
                )}
              </div>
            </div>
          </div>

          {/* Pendências identificadas */}
          {pendencias.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-2">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">Inconsistências Cadastrais ({pendencias.length})</h4>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-xs text-red-900">
                {pendencias.map((p, i) => (
                  <li key={i}>
                    <span className="font-bold">{p.label}</span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded ml-1.5 font-bold uppercase">{p.severity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seção Linha do Tempo */}
          <div className="border-t border-lavender/50 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#60708A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yinmn" />
                <span>Linha do Tempo do Instrutor</span>
              </h3>
              
              {/* Filtro de Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-lavender/30 rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="all">Todas as categorias</option>
                <option value="Cadastro">Cadastro</option>
                <option value="Contrato">Contrato</option>
                <option value="Férias">Férias</option>
                <option value="Substituição">Substituição</option>
                <option value="Risco">Risco</option>
                <option value="Alteração administrativa">Alt. Administrativa</option>
              </select>
            </div>

            {/* Linha do tempo visual */}
            <div className="relative border-l-2 border-lavender pl-4 ml-2.5 space-y-4 pt-1 pb-1">
              {events
                .filter((evt) => selectedCategory === "all" || evt.categoria === selectedCategory)
                .map((evt) => {
                  let bulletBg = "bg-slate-400";
                  let categoryColor = "text-slate-500";
                  let Icon = Settings;

                  if (evt.categoria === "Cadastro") {
                    bulletBg = "bg-emerald-500";
                    categoryColor = "text-emerald-600";
                    Icon = User;
                  } else if (evt.categoria === "Contrato") {
                    bulletBg = "bg-blue-500";
                    categoryColor = "text-blue-600";
                    Icon = FileText;
                  } else if (evt.categoria === "Férias") {
                    bulletBg = "bg-yinmn";
                    categoryColor = "text-yinmn";
                    Icon = Plane;
                  } else if (evt.categoria === "Substituição") {
                    bulletBg = "bg-amber-500";
                    categoryColor = "text-amber-600";
                    Icon = RefreshCw;
                  } else if (evt.categoria === "Risco") {
                    bulletBg = "bg-rose-500";
                    categoryColor = "text-rose-600";
                    Icon = AlertTriangle;
                  } else if (evt.categoria === "Alteração administrativa") {
                    bulletBg = "bg-slate-500";
                    categoryColor = "text-slate-600";
                    Icon = Settings;
                  }

                  return (
                    <div key={evt.recordId} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[27px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-white border-2 border-lavender shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${bulletBg}`} />
                      </span>

                      {/* Event Details */}
                      <div className="bg-lavender/5 p-3 rounded-xl border border-lavender/35 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>{formatarDataBR(evt.data)}</span>
                          <span className={`uppercase text-[8px] font-black ${categoryColor}`}>{evt.categoria}</span>
                        </div>
                        <h4 className="text-xs font-black text-oxford flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{evt.tipo}</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">{evt.descricao}</p>
                        {evt.responsavel && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            Responsável: <span className="font-bold text-slate-500">{evt.responsavel}</span>
                          </div>
                        )}
                        {evt.status && (
                          <span className="inline-block text-[9px] bg-white border border-slate-100 text-slate-500 px-1.5 py-0.2 rounded-md font-bold mt-1">
                            Status: {evt.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {events.filter((evt) => selectedCategory === "all" || evt.categoria === selectedCategory).length === 0 && (
                <p className="text-xs text-slate-400 font-semibold italic text-center py-2">
                  Nenhum evento registrado nesta categoria.
                </p>
              )}
            </div>

            {/* Formulário rápido para adicionar observação */}
            <form onSubmit={handleAddObservation} className="bg-slate-50 p-3.5 rounded-2xl border border-lavender/40 space-y-3">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Adicionar Registro Histórico</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva uma observação..."
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  className="flex-1 text-xs bg-white border border-lavender/50 rounded-xl px-3 py-2 focus:outline-none focus:border-jordy text-slate-700"
                />
                
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TimelineEventCategory)}
                  className="text-xs font-bold text-slate-600 bg-white border border-lavender/50 rounded-xl px-2 focus:outline-none"
                >
                  <option value="Alteração administrativa">Admin</option>
                  <option value="Cadastro">Cadastro</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Férias">Férias</option>
                  <option value="Substituição">Subst.</option>
                  <option value="Risco">Risco</option>
                </select>

                <button
                  type="submit"
                  className="bg-yinmn hover:bg-oxford text-white font-bold p-2 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex flex-col sm:flex-row gap-2.5">
          {/* Copiar Resumo */}
          <button
            onClick={handleCopySummary}
            className="flex-1 text-xs bg-white hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-gray-200 active:scale-[0.98]"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-[#00995D]" />
                <span className="text-[#00995D]">Resumo Copiado!</span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                <span>Copiar Ficha Resumida</span>
              </>
            )}
          </button>

          {/* Editar Cadastro */}
          <button
            onClick={() => onEdit(employee)}
            className="flex-1 text-xs bg-[#00995D] hover:bg-[#00804e] text-white font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#00995d]/10 active:scale-[0.98]"
          >
            <FileEdit className="w-4 h-4" />
            <span>Editar Cadastro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
