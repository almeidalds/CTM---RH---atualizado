/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Users, Filter, HelpCircle } from "lucide-react";
import { RhEmployee, EmployeeFilters } from "../types/rh";
import { FiltersBar } from "../components/FiltersBar";
import { EmployeeSummaryCard } from "../components/SummaryCard";
import { calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";

interface EmployeesPageProps {
  employees: RhEmployee[];
  onSelectEmployee: (emp: RhEmployee) => void;
  onEditEmployee: (emp: RhEmployee) => void;
}

const INITIAL_FILTERS: EmployeeFilters = {
  search: "",
  cargo: "",
  zona: "",
  turno: "",
  idioma: "",
  status: "",
  risco: "",
  pendencia: "Qualquer",
  periodoTermino: "all"
};

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  employees,
  onSelectEmployee,
  onEditEmployee
}) => {
  const [filters, setFilters] = useState<EmployeeFilters>(INITIAL_FILTERS);

  // Função principal de filtragem de funcionários baseada nos filtros ativos
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Pesquisa por Nome ou ID
      if (filters.search.trim() !== "") {
        const query = filters.search.toLowerCase();
        const matchesNome = emp.nome?.toLowerCase().includes(query);
        const matchesID = emp.idFuncionario?.toLowerCase().includes(query);
        if (!matchesNome && !matchesID) return false;
      }

      // 2. Cargo
      if (filters.cargo && emp.cargo !== filters.cargo) {
        return false;
      }

      // 3. Zona
      if (filters.zona && emp.zona !== filters.zona) {
        return false;
      }

      // 4. Turno
      if (filters.turno && emp.turno !== filters.turno) {
        return false;
      }

      // 5. Idioma (procurar na lista de idiomas)
      if (filters.idioma) {
        const hasLang = emp.idiomas && emp.idiomas.some((l) => l.toLowerCase() === filters.idioma.toLowerCase());
        if (!hasLang) return false;
      }

      // 6. Status
      if (filters.status && emp.statusFuncionario !== filters.status) {
        return false;
      }

      // 7. Risco Contratual
      if (filters.risco && calcularRisco(emp) !== filters.risco) {
        return false;
      }

      // 8. Integridade Cadastral (Pendência)
      if (filters.pendencia === "Com Pendência") {
        if (identificarPendencias(emp).length === 0) return false;
      } else if (filters.pendencia === "Sem Pendência") {
        if (identificarPendencias(emp).length > 0) return false;
      }

      // 9. Período de Término de Contrato (apenas para ativos)
      if (filters.periodoTermino !== "all") {
        if (emp.statusFuncionario === "Encerrado" || !emp.dataTerminoReal) {
          return false;
        }
        const dias = calcularDiasRestantes(emp.dataTerminoReal);
        if (dias === null || dias < 0) {
          return false;
        }
        const maxDias = parseInt(filters.periodoTermino, 10);
        if (dias > maxDias) {
          return false;
        }
      }

      return true;
    });
  }, [employees, filters]);

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-100/30 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1A2C] flex items-center gap-2.5">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Diretório de Funcionários</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Consulte, filtre por competências ou status e gerencie contratos da equipe acadêmica e administrativa.
          </p>
        </div>
        
        {/* Quick filters statistic indicator */}
        <div className="text-xs text-purple-700 bg-purple-50 border border-purple-100/30 py-1.5 px-3.5 rounded-xl font-bold">
          Total Ativos: {employees.filter((e) => e.statusFuncionario === "Ativo").length}
        </div>
      </div>

      {/* Advanced Filters Block */}
      <FiltersBar
        filters={filters}
        setFilters={setFilters}
        allEmployees={employees}
        onClear={handleClearFilters}
      />

      {/* Responsive Card Grid list */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-50/75 p-12 text-center shadow-[0_4px_20px_-4px_rgba(109,40,217,0.04)]">
          <HelpCircle className="w-12 h-12 text-purple-200 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-[#1F1A2C] mb-1">Nenhum funcionário encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente reajustar seus filtros avançados ou pesquise por outro termo de busca para localizar docentes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => (
            <EmployeeSummaryCard
              key={emp.recordId}
              employee={emp}
              onSelect={onSelectEmployee}
              onEdit={onEditEmployee}
            />
          ))}
        </div>
      )}
    </div>
  );
};
