const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add dashboardSubTab state
content = content.replace(
  /const \[teamSubTab, setTeamSubTab\] = useState<"list" \| "pending">/g,
  `const [dashboardSubTab, setDashboardSubTab] = useState<"reports" | "executive">("reports");\n  const [teamSubTab, setTeamSubTab] = useState<"list" | "pending" | "timeline">`
);

// Update Dashboard Category Rendering
content = content.replace(
  /\{\/\* CATEGORY 1: DASHBOARD \*\/\}\s*\{activeTab === "dashboard" && \(\s*<ReportsPage\s*employees=\{employees\}\s*onSelectEmployee=\{setSelectedEmployee\}\s*onGenerateReportClick=\{[^}]*\}\s*onResetData=\{handleResetData\}\s*\/>\s*\)\}/,
  `{/* CATEGORY 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex border-b border-lavender pb-px gap-6 select-none">
                <button
                  onClick={() => setDashboardSubTab("reports")}
                  className={\`pb-3.5 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer \${
                    dashboardSubTab === "reports"
                      ? "border-yinmn text-yinmn"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }\`}
                >
                  Relatórios
                </button>
                <button
                  onClick={() => setDashboardSubTab("executive")}
                  className={\`pb-3.5 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer \${
                    dashboardSubTab === "executive"
                      ? "border-yinmn text-yinmn"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }\`}
                >
                  Resumo Executivo
                </button>
              </div>
              
              {dashboardSubTab === "reports" && (
                <ReportsPage
                  employees={employees}
                  onSelectEmployee={setSelectedEmployee}
                  onGenerateReportClick={() => setIsReportModalOpen(true)}
                  onResetData={handleResetData}
                />
              )}
              {dashboardSubTab === "executive" && (
                <ExecutiveSummaryPage employees={employees} />
              )}
            </div>
          )}`
);

fs.writeFileSync('src/App.tsx', content);
