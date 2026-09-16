/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, Filter, X, Grid } from "lucide-react";
import { EmployeeFilters, RhEmployee } from "../types/rh";

interface FiltersBarProps {
  filters: EmployeeFilters;
  setFilters: React.Dispatch<React.SetStateAction<EmployeeFilters>>;
  allEmployees: RhEmployee[];
  onClear: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  setFilters,
  allEmployees,
  onClear
}) => {
  // Extrair opções únicas dinamicamente para manter os filtros sincronizados com o banco
  const cargos = Array.from(new Set(allEmployees.map((e) => e.cargo).filter(Boolean))).sort();
  const zonas = Array.from(new Set(allEmployees.map((e) => e.zona).filter(Boolean))).sort();
  const turnos = Array.from(new Set(allEmployees.map((e) => e.turno).filter(Boolean))).sort();
  
  // Extrair idiomas únicos de arrays de idiomas
  const idiomasSet = new Set<string>();
  allEmployees.forEach((emp) => {
    if (emp.idiomas) {
      emp.idiomas.forEach((lang) => {
        if (lang && lang.trim() !== "") {
          idiomasSet.add(lang.trim());
        }
      });
    }
  });
  const idiomas = Array.from(idiomasSet).sort();

  const handleFilterChange = (field: keyof EmployeeFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_20px_-4px_rgba(23,105,170,0.08)] mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-yinmn" />
        <h3 className="text-xs font-black text-[#1F1A2C] uppercase tracking-wider">Filtros de Pesquisa Avançados</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Busca por Nome ou ID */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-400 mb-1">Nome ou ID do Funcionário</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: Carlos Augusto ou CTM-2024..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Cargo</label>
          <select
            value={filters.cargo}
            onChange={(e) => handleFilterChange("cargo", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-oxford font-semibold"
          >
            <option value="">Todos os cargos</option>
            {cargos.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Zona */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Zona</label>
          <select
            value={filters.zona}
            onChange={(e) => handleFilterChange("zona", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="">Todas as zonas</option>
            {zonas.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {/* Turno */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Turno</label>
          <select
            value={filters.turno}
            onChange={(e) => handleFilterChange("turno", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="">Todos os turnos</option>
            {turnos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Idioma</label>
          <select
            value={filters.idioma}
            onChange={(e) => handleFilterChange("idioma", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="">Todos os idiomas</option>
            {idiomas.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="A começar">A começar</option>
            <option value="Encerrado">Encerrado</option>
          </select>
        </div>

        {/* Nível de Risco */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
          <select
            value={filters.risco}
            onChange={(e) => handleFilterChange("risco", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="">Todos os riscos</option>
            <option value="Crítico">Crítico</option>
            <option value="Alto">Alto</option>
            <option value="Médio">Médio</option>
            <option value="Baixo">Baixo</option>
            <option value="Sem risco">Sem risco</option>
            <option value="Cadastro incompleto">Cadastro incompleto</option>
          </select>
        </div>

        {/* Qualidade dos Dados (Pendências) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Integridade Cadastral</label>
          <select
            value={filters.pendencia}
            onChange={(e) => handleFilterChange("pendencia", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="Qualquer">Qualquer situação</option>
            <option value="Com Pendência">Com pendências de dados</option>
            <option value="Sem Pendência">Sem pendências (Completo)</option>
          </select>
        </div>

        {/* Período de Término */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Término do Contrato em...</label>
          <select
            value={filters.periodoTermino}
            onChange={(e) => handleFilterChange("periodoTermino", e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-[#1F1A2C] font-semibold"
          >
            <option value="all">Qualquer período</option>
            <option value="30">Próximos 30 dias</option>
            <option value="60">Próximos 60 dias</option>
            <option value="90">Próximos 90 dias</option>
            <option value="180">Próximos 180 dias</option>
          </select>
        </div>

        {/* Botão de limpar */}
        <div className="flex items-end">
          <button
            onClick={onClear}
            className="w-full text-xs bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-yinmn font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] h-9.5 border border-sky-100"
          >
            <X className="w-4 h-4" />
            <span>Limpar Filtros</span>
          </button>
        </div>
      </div>
    </div>
  );
};
