/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Languages,
  UserPlus2,
  CheckCircle2,
  Compass
} from "lucide-react";
import { RhEmployee, LanguageReplacement } from "../types/rh";
import { calcularDiasRestantes } from "../utils/dateUtils";

interface ReplacementPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
}

export const ReplacementPage: React.FC<ReplacementPageProps> = ({ employees }) => {
  const actives = useMemo(() => employees.filter((e) => e.statusFuncionario === "Ativo"), [employees]);

  // 1. CALCULAR MÉTRICAS DE COBERTURA POR IDIOMA DINAMICAMENTE
  const languageData = useMemo(() => {
    // Pegar todos os idiomas listados no sistema de forma única
    const langSet = new Set<string>();
    employees.forEach((e) => {
      if (e.idiomas) {
        e.idiomas.forEach((l) => {
          if (l && l.trim() !== "") langSet.add(l.trim());
        });
      }
    });

    const dataList: LanguageReplacement[] = [];

    langSet.forEach((lang) => {
      // Filtrar professores ativos que ensinam este idioma
      const teachersOfLang = actives.filter((e) => e.idiomas && e.idiomas.includes(lang));
      const totalActiveTeachers = teachersOfLang.length;

      let saem30 = 0;
      let saem60 = 0;
      let saem90 = 0;
      let saem180 = 0;

      teachersOfLang.forEach((teacher) => {
        if (teacher.dataTerminoReal) {
          const dias = calcularDiasRestantes(teacher.dataTerminoReal);
          if (dias !== null && dias >= 0) {
            if (dias <= 30) saem30++;
            if (dias <= 60) saem60++;
            if (dias <= 90) saem90++;
            if (dias <= 180) saem180++;
          }
        }
      });

      // Calcular a cobertura restante (percentual de professores que sobram após 90 dias)
      const restanteApos90 = totalActiveTeachers - saem90;
      const coberturaRestante = totalActiveTeachers > 0 ? Math.round((restanteApos90 / totalActiveTeachers) * 100) : 0;

      // Definir Situação e Recomendação baseado nas regras de negócio
      let situacao: "Estável" | "Atenção" | "Risco alto" | "Crítico" | "Baixa cobertura" = "Estável";
      let recomendacao = "Quadro sã. Nenhuma contratação necessária.";

      if (totalActiveTeachers === 0) {
        situacao = "Crítico";
        recomendacao = "URGENTE: Idioma sem nenhum instrutor ativo cadastrado. Abrir vaga imediatamente.";
      } else if (totalActiveTeachers === 1) {
        situacao = saem90 > 0 ? "Crítico" : "Baixa cobertura";
        recomendacao = saem90 > 0 
          ? "CRÍTICO: Único instrutor saindo em 90 dias. Contratação emergencial requerida." 
          : "ALERTA: Cobertura mínima (apenas 1 instrutor ativo). Recomenda-se treinar substituto.";
      } else if (saem30 > 0) {
        situacao = "Atenção";
        recomendacao = `ATENÇÃO: Término de ${saem30} contrato(s) em 30 dias. Providenciar termo aditivo de renovação ou transição.`;
      } else if (totalActiveTeachers > 0 && (saem90 / totalActiveTeachers) >= 0.3) {
        // Se mais de 30% dos instrutores saem in 90 dias
        situacao = "Risco alto";
        recomendacao = `RISCO ALTO: Perda de ${Math.round((saem90 / totalActiveTeachers) * 100)}% da equipe em 90 dias. Abrir banco de talentos.`;
      } else if (saem90 > 0) {
        situacao = "Atenção";
        recomendacao = `Acompanhar saídas parciais (${saem90} contratos) nos próximos 90 dias.`;
      }

      dataList.push({
        idioma: lang,
        ativos: totalActiveTeachers,
        saida30: saem30,
        saida60: saem60,
        saida90: saem90,
        saida180: saem180,
        coberturaRestante,
        situacao,
        recomendacao,
      });
    });

    return dataList.sort((a, b) => {
      // Ordena por gravidade da situação
      const peso: Record<string, number> = {
        "Crítico": 1,
        "Risco alto": 2,
        "Baixa cobertura": 3,
        "Atenção": 4,
        "Estável": 5,
      };
      return (peso[a.situacao] || 99) - (peso[b.situacao] || 99);
    });
  }, [actives, employees]);

  // Estatísticas Rápidas
  const totalIdiomas = languageData.length;
  const emRiscoCriticoCount = languageData.filter((l) => l.situacao === "Crítico" || l.situacao === "Risco alto").length;
  const emAtencaoCount = languageData.filter((l) => l.situacao === "Atenção").length;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-purple-100/30 pb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1A2C] flex items-center gap-2.5">
          <RefreshCw className="w-5 h-5 text-purple-600" />
          <span>Planejador de Reposição e Vagas</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Analise a cobertura docente por idioma e planeje contratações ou renovações com antecedência de até 180 dias.
        </p>
      </div>

      {/* Estatísticas de Cobertura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-purple-50/70 shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Total de Idiomas</span>
            <span className="text-2xl font-extrabold text-[#1F1A2C] block mt-1">{totalIdiomas}</span>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Lecionados na instituição</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Languages className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-purple-50/70 shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-black text-rose-600 block tracking-wider">Idiomas Sob Risco Crítico</span>
            <span className="text-2xl font-extrabold text-rose-600 block mt-1">{emRiscoCriticoCount}</span>
            <p className="text-[10px] text-rose-500 font-semibold mt-1">Requerem contratação imediata</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-purple-50/70 shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-black text-amber-600 block tracking-wider">Idiomas em Atenção</span>
            <span className="text-2xl font-extrabold text-amber-600 block mt-1">{emAtencaoCount}</span>
            <p className="text-[10px] text-amber-500 font-semibold mt-1">Acompanhamento preventivo</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Datagrid */}
      <div className="bg-white p-6 rounded-2xl border border-purple-50/70 shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)] space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-[#1F1A2C]">Balanço de Cobertura de Línguas</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Visão consolidada do quadro de instrutores ativos e previsão de saídas por idioma</p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-purple-50/40 text-slate-400 font-black uppercase text-[10px] bg-[#FAF9FF]">
                <th className="py-3 px-3 text-left bg-purple-50/25 rounded-l-xl">Idioma</th>
                <th className="py-3 px-3 text-center">Instrutores Ativos</th>
                <th className="py-3 px-3 text-center bg-rose-50 text-rose-800 font-extrabold">Saem 30 d</th>
                <th className="py-3 px-3 text-center bg-amber-50 text-amber-800 font-extrabold">Saem 60 d</th>
                <th className="py-3 px-3 text-center bg-amber-50 text-amber-800 font-extrabold">Saem 90 d</th>
                <th className="py-3 px-3 text-center bg-purple-50 text-purple-800 font-extrabold">Saem 180 d</th>
                <th className="py-3 px-3 text-center">Cobertura Restante (90d)</th>
                <th className="py-3 px-3 text-left">Situação de Cobertura</th>
                <th className="py-3 px-3 text-left bg-[#FAF9FF] rounded-r-xl">Recomendação Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50/45">
              {languageData.map((data) => {
                let statusBadgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                if (data.situacao === "Crítico") {
                  statusBadgeStyle = "bg-rose-50 text-rose-600 border-rose-100 font-black animate-pulse";
                } else if (data.situacao === "Risco alto") {
                  statusBadgeStyle = "bg-amber-50 text-amber-600 border-amber-100 font-bold";
                } else if (data.situacao === "Baixa cobertura") {
                  statusBadgeStyle = "bg-sky-50 text-sky-700 border-sky-100 font-bold";
                } else if (data.situacao === "Atenção") {
                  statusBadgeStyle = "bg-purple-50 text-purple-600 border-purple-100 font-bold";
                }

                return (
                  <tr key={data.idioma} className="hover:bg-purple-50/10 transition-colors duration-200">
                    {/* Idioma */}
                    <td className="py-4 px-3 font-extrabold text-[#1F1A2C] text-sm">{data.idioma}</td>
                    
                    {/* Ativos */}
                    <td className="py-4 px-3 text-center text-sm font-black text-[#1F1A2C]">{data.ativos}</td>

                    {/* Exits cols */}
                    <td className="py-4 px-3 text-center font-bold text-rose-600 bg-rose-50/10">{data.saida30}</td>
                    <td className="py-4 px-3 text-center font-bold text-amber-600 bg-amber-50/10">{data.saida60}</td>
                    <td className="py-4 px-3 text-center font-bold text-amber-700 bg-amber-50/10">{data.saida90}</td>
                    <td className="py-4 px-3 text-center font-bold text-purple-700 bg-purple-50/10">{data.saida180}</td>

                    {/* Cobertura Restante */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-extrabold text-slate-700">{data.coberturaRestante}%</span>
                        <div className="w-16 h-1.5 bg-[#FAF9FF] border border-purple-50/35 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              data.coberturaRestante < 40
                                ? "bg-rose-500"
                                : data.coberturaRestante < 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${data.coberturaRestante}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Situação */}
                    <td className="py-4 px-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeStyle}`}>
                        {data.situacao}
                      </span>
                    </td>

                    {/* Recomendação */}
                    <td className="py-4 px-3 font-semibold text-slate-500 max-w-[250px] leading-relaxed">
                      {data.recomendacao}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diretrizes / Recommendations Board */}
      <div className="bg-[#181124] text-white p-6 rounded-2xl border border-purple-950/20 shadow-lg space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <UserPlus2 className="w-4 h-4 text-purple-400" />
          <span>Diretrizes e Recomendações Gerais de Contratação</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-800/10 space-y-2">
            <h5 className="font-bold text-purple-200 flex items-center gap-1.5 text-xs">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Mitigação de Riscos Críticos</span>
            </h5>
            <p className="text-purple-300/80 text-[11px] font-medium leading-relaxed">
              Sempre que um idioma atingir a situação de <strong>Crítico</strong> ou <strong>Risco Alto</strong>, o RH deve priorizar a abertura de vagas no edital semanal, ou remanejar instrutores seniores entre turnos para evitar a paralisação de turmas de missionários.
            </p>
          </div>

          <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-800/10 space-y-2">
            <h5 className="font-bold text-purple-200 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Políticas de Retenção e Banco de Talentos</span>
            </h5>
            <p className="text-purple-300/80 text-[11px] font-medium leading-relaxed">
              Mantenha o banco de talentos de ex-missionários e professores de línguas constantemente aquecido. Propor negociações de prorrogação de contrato de instrutores seniores com pelo menos <strong>60 dias</strong> de antecedência da data final.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
