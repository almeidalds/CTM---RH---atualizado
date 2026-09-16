/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Users, UserPlus, HelpCircle } from "lucide-react";
import { RhEmployee, EmployeeFilters, AppSettings } from "../types/rh";
import { FiltersBar } from "../components/FiltersBar";
import { EmployeeSummaryCard } from "../components/SummaryCard";
import { calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";

import { PendingEditorPanel } from "../components/PendingEditorPanel";

interface EmployeesPageProps {
  appSettings: AppSettings;
  onCreateEmployee: (employee: RhEmployee) => Promise<void>;
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
  onEditEmployee,
  appSettings,
  onCreateEmployee
}) => {
  const [newEmployee, setNewEmployee] = useState<RhEmployee | null>(null);
  const openCreate = () => setNewEmployee({
    recordId: "", idFuncionario: "", nome: "", cargo: "", zona: "", turno: "",
    dataAdmissao: "", dataTerminoReal: "", statusFuncionario: "Ativo", idiomas: [],
    emailCorporativo: "", linkZoom: "", feriasMarcadas: false, feriasConcluidas: false,
    feriasVendidas: false, diasVendidosFerias: 0, diasTotaisFerias: 0, periodosFerias: [],
  });
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

      // 7. Status
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1A2C] flex items-center gap-2.5">
            <Users className="w-5 h-5 text-yinmn" />
            <span>Diretório de Funcionários</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Consulte, filtre por competências ou status e gerencie contratos da equipe acadêmica e administrativa.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-yinmn bg-sky-50 border border-sky-100 py-2 px-3 rounded-xl font-bold">Total ativos: {employees.filter((employee) => employee.statusFuncionario === "Ativo").length}</span>
          <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-yinmn px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-oxford focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yinmn focus-visible:ring-offset-2"><UserPlus className="h-4 w-4" />Novo funcionário</button>
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
        <div className="bg-white rounded-2xl border border-sky-100/75 p-12 text-center shadow-[0_4px_20px_-4px_rgba(23,105,170,0.04)]">
          <HelpCircle className="w-12 h-12 text-sky-200 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-[#1F1A2C] mb-1">Nenhum funcionário encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente reajustar seus filtros avançados ou pesquise por outro termo de busca para localizar Funcionários.
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
      <PendingEditorPanel
        mode="create"
        employee={newEmployee}
        appSettings={appSettings}
        onClose={() => setNewEmployee(null)}
        onSave={async (employee) => {
          await onCreateEmployee(employee);
          setFilters(INITIAL_FILTERS);
        }}
      />
    </div>
  );
};
