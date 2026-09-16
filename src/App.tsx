/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AppHeader } from "./components/AppHeader";
import { NavigationTabs, TabId } from "./components/NavigationTabs";
import { ReportsPage } from "./pages/ReportsPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { RisksPage } from "./pages/RisksPage";
import { PendingPage } from "./pages/PendingPage";
import { ReplacementPage } from "./pages/ReplacementPage";
import { VacationsPage } from "./pages/VacationsPage";

import { SubstitutionsPage } from "./pages/SubstitutionsPage";
import { ContractsPage } from "./pages/ContractsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { GenerateReportModal } from "./components/GenerateReportModal";
import { FloatingActionBar } from "./components/FloatingActionBar";
import { SectionTabs } from "./components/SectionTabs";

import { SettingsPage } from "./pages/SettingsPage";
import { RhEmployee, AppSettings } from "./types/rh";
import { obterFuncionarios, salvarEdicaoFuncionario, resetarDados, criarFuncionario } from "./services/rhDataSource";
import { obterSubstituicoes } from "./services/additionalDataSource";
import { EmployeeDetailsPanel } from "./components/EmployeeDetailsPanel";
import { PendingEditorPanel } from "./components/PendingEditorPanel";
import { calcularQualidadeDados } from "./utils/dataQualityUtils";
import { calcularRisco } from "./utils/riskUtils";
import { calcularStatusFerias } from "./utils/vacationUtils";

const DEFAULT_SETTINGS: AppSettings = {
  idiomas: ["Inglês", "Espanhol", "Francês", "Mandarim", "Alemão", "Italiano", "Japonês"],
  cargos: ["Instrutor de Inglês", "Instrutor de Espanhol", "Instrutor de Francês", "Coordenador", "Diretor", "Analista"],
  zonas: ["Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Centro", "Administrativo"]
};

const obterSettings = (): AppSettings => {
  try {
    const data = window.localStorage.getItem("rh_app_settings");
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (error) {
    console.warn("Não foi possível ler as configurações locais. Usando valores padrão.", error);
    return DEFAULT_SETTINGS;
  }
};

const salvarSettings = (settings: AppSettings) => {
  try {
    window.localStorage.setItem("rh_app_settings", JSON.stringify(settings));
  } catch (error) {
    console.warn("Não foi possível salvar as configurações locais.", error);
  }
};

export default function App() {
  const [employees, setEmployees] = useState<RhEmployee[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Inner sub-tabs state to organize page info cleanly and prevent information overload
  const [teamSubTab, setTeamSubTab] = useState<"list" | "pending">("list");
  const [scheduleSubTab, setScheduleSubTab] = useState<"vacations" | "substitutions" | "replacement">("vacations");
  const [risksSubTab, setRisksSubTab] = useState<"heatmap" | "contracts" | "alerts">("heatmap");
  
  // Mobile Sidebar Toggle State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Report Generator Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Modais / Painéis Laterais Flyouts
  const [selectedEmployee, setSelectedEmployee] = useState<RhEmployee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<RhEmployee | null>(null);

  // Inicializar dados do LocalStorage ou do Sample Data
  useEffect(() => {
    const data = obterFuncionarios();
    setEmployees(data);
    const savedSettings = obterSettings();
    setAppSettings(savedSettings);
  }, []);

  // Redefinir banco de dados para os valores fictícios padrões
  const handleResetData = () => {
    const resetList = resetarDados();
    setEmployees(resetList);
    setSelectedEmployee(null);
    setEditingEmployee(null);
  };

  // Salvar a edição ou correção de dados de um funcionário
  const handleSaveEmployee = async (updated: RhEmployee) => {
    const updatedList = await salvarEdicaoFuncionario(updated);
    setEmployees(updatedList);
    
    // Atualizar referências locais abertas se houverem
    if (selectedEmployee?.recordId === updated.recordId) {
      setSelectedEmployee(updated);
    }
  };

  // Atalho para acionar a edição de dentro do modal de detalhes
  const handleDetailsEditShortcut = (emp: RhEmployee) => {
    setSelectedEmployee(null);
    setEditingEmployee(emp);
  };

  // Estatísticas para os indicadores numéricos das abas
  const pendingCount = calcularQualidadeDados(employees).comPendencia;
  const criticalRiskCount = employees.filter(
    (e) => e.statusFuncionario === "Ativo" && calcularRisco(e) === "Crítico"
  ).length;
  const criticalVacationCount = employees.filter(
    (e) => e.statusFuncionario === "Ativo" && calcularStatusFerias(e) === "Férias críticas"
  ).length;

  const totalPendingSubstitutions = obterSubstituicoes().filter(
    (s) => s.status === "Pendente" && (!s.substituto || s.substituto.trim() === "")
  ).length;
  const systemAlertCount = criticalRiskCount + totalPendingSubstitutions;

  return (
    <div className="min-h-screen bg-slate-50 flex text-oxford font-sans">
      {/* Corporate Tab Navigation / Left Sidebar (Hidden on mobile unless triggered) */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        teamSubTab={teamSubTab}
        scheduleSubTab={scheduleSubTab}
        risksSubTab={risksSubTab}
        setTeamSubTab={setTeamSubTab}
        setScheduleSubTab={setScheduleSubTab}
        setRisksSubTab={setRisksSubTab}
        criticalRiskCount={criticalRiskCount}
        criticalVacationCount={criticalVacationCount}
        systemAlertCount={systemAlertCount}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* CTM Custom Banner Brand */}
        <AppHeader
          employeeCount={employees.length}
          onMenuToggle={() => setIsSidebarOpen(true)}
          onSidebarToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          onResetData={handleResetData}
          onGenerateReportClick={() => setIsReportModalOpen(true)}
        />

        {/* Main Workspace Frame */}
        <main className="flex-1 max-w-[1480px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* CATEGORY 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <ReportsPage
              employees={employees}
              onSelectEmployee={setSelectedEmployee}
            />
          )}
          {/* CATEGORY 2: EQUIPE & INTEGRIDADE */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <SectionTabs
                activeId={teamSubTab}
                onChange={(id) => setTeamSubTab(id as "list" | "pending")}
                items={[{ id: "list", label: "Quadro de Colaboradores" }, { id: "pending", label: "Saneamento & Pendências", badge: pendingCount }]}
              />

              {/* Sub-tab view router */}
              {teamSubTab === "list" ? (
                <EmployeesPage
                  appSettings={appSettings}
                  onCreateEmployee={async (employee) => {
                    const updatedList = await criarFuncionario(employee);
                    setEmployees(updatedList);
                  }}
                  employees={employees}
                  onSelectEmployee={setSelectedEmployee}
                  onEditEmployee={setEditingEmployee}
                />
              ) : (
                <PendingPage employees={employees} onEditEmployee={setEditingEmployee} />
              )}
            </div>
          )}

          {/* CATEGORY 3: ESCALA & AUSÊNCIAS */}
          {activeTab === "schedule" && (
            <div className="space-y-6">
              <SectionTabs
                activeId={scheduleSubTab}
                onChange={(id) => setScheduleSubTab(id as "vacations" | "substitutions" | "replacement")}
                items={[{ id: "vacations", label: "Controle de Férias" }, { id: "substitutions", label: "Gestão de Substituições" }, { id: "replacement", label: "Simular Reposições" }]}
              />

              {/* Sub-tab view router */}
              {scheduleSubTab === "vacations" && (
                <VacationsPage appSettings={appSettings} employees={employees} onSave={(updated, createSubst) => {
                handleSaveEmployee(updated);
                if (createSubst && updated.periodosFerias && updated.periodosFerias.length > 0) {
                  // Trigger substitution creation
                  import("./repositories/substitutionRepository").then(({ substitutionRepository }) => {
                    const lastPeriod = updated.periodosFerias[updated.periodosFerias.length - 1];
                    substitutionRepository.create({
                      instrutorAusente: updated.nome,
                      motivo: "Férias",
                      dataInicio: lastPeriod.dataInicio,
                      dataFim: lastPeriod.dataFim,
                      dias: lastPeriod.dias,
                      idioma: updated.idiomas?.[0] || "Não informado",
                      zona: updated.zona,
                      turno: updated.turno,
                      substituto: "",
                      status: "Pendente",
                      observacoes: "Substituição criada automaticamente a partir do registro de férias."
                    });
                    setScheduleSubTab("substitutions");
                  });
                }
              }} />
              )}
              {scheduleSubTab === "substitutions" && (
                <SubstitutionsPage appSettings={appSettings} employees={employees} onSelectEmployee={setSelectedEmployee} />
              )}
              {scheduleSubTab === "replacement" && (
                <ReplacementPage employees={employees} onSelectEmployee={setSelectedEmployee} />
              )}
            </div>
          )}

          {/* CATEGORY 4: RISCOS & CONTRATOS */}
          {activeTab === "risks" && (
            <div className="space-y-6">
              <SectionTabs
                activeId={risksSubTab}
                onChange={(id) => setRisksSubTab(id as "heatmap" | "contracts" | "alerts")}
                items={[{ id: "heatmap", label: "Análise Preditiva" }, { id: "contracts", label: "Prazos Contratuais" }, { id: "alerts", label: "Painel de Alertas", badge: systemAlertCount }]}
              />

              {/* Sub-tab view router */}
              {risksSubTab === "heatmap" && (
                <RisksPage employees={employees} onSelectEmployee={setSelectedEmployee} />
              )}
              {risksSubTab === "contracts" && (
                <ContractsPage
                  employees={employees}
                  onSelectEmployee={setSelectedEmployee}
                  onUpdateEmployee={handleSaveEmployee}
                />
              )}
              {risksSubTab === "alerts" && (
                <AlertsPage employees={employees} onSelectEmployee={setSelectedEmployee} />
              )}
            </div>
          )}

          {/* CATEGORY 5: CONFIGURAÇÕES */}
          {activeTab === "settings" && (
            <SettingsPage
              settings={appSettings}
              onSave={(newSettings) => {
                setAppSettings(newSettings);
                salvarSettings(newSettings);
              }}
            />
          )}
        </main>

        {/* Footer credits */}
        <footer className="py-6 text-center text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-white border-t border-sky-100">
          CTM RH Dashboard © 2026 • Centro de Treinamento Missionário do Brasil
        </footer>
      </div>

      {/* Flyout 1: Visualização Detalhada do Perfil */}
      <EmployeeDetailsPanel
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onEdit={handleDetailsEditShortcut}
      />

      {/* Flyout 2: Formulário Integrado de Correção */}
      <PendingEditorPanel
        employee={editingEmployee}
        appSettings={appSettings}
        onClose={() => setEditingEmployee(null)}
        onSave={handleSaveEmployee}
      />

      {/* Report Generator Modal */}
      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        employees={employees}
      />

      {/* Floating Action Bar / Hub */}
      <FloatingActionBar
        systemAlertCount={systemAlertCount}
        pendingCount={pendingCount}
        criticalVacationCount={criticalVacationCount}
        onGenerateReportClick={() => setIsReportModalOpen(true)}
        onResetData={handleResetData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setTeamSubTab={setTeamSubTab}
        setScheduleSubTab={setScheduleSubTab}
        setRisksSubTab={setRisksSubTab}
      />
    </div>
  );
}
