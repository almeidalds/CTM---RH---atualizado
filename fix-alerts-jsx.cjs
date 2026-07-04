const fs = require('fs');
let content = fs.readFileSync('src/pages/AlertsPage.tsx', 'utf8');

// Replace isResolved block
content = content.replace(
  /const isResolved = resolvedIds\.has\(alert\.alertId\);/g,
  `const status = alert.status || "Novo";\n          const isResolved = status === "Resolvido";\n          const isIgnored = status === "Ignorado";`
);

content = content.replace(
  /\{isResolved \? \(\s*<CheckCircle className="w-4 h-4" \/>\s*\) : alert\.gravidade === "Crítica" \? \(\s*<AlertOctagon className="w-4 h-4" \/>\s*\) : \(\s*<AlertTriangle className="w-4 h-4" \/>\s*\)\}/g,
  `{isResolved ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isIgnored ? (
                    <FolderMinus className="w-4 h-4" />
                  ) : alert.gravidade === "Crítica" ? (
                    <AlertOctagon className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}`
);

content = content.replace(
  /<button\s+onClick=\{\(\) => handleResolveAlert\(alert\.alertId\)\}[\s\S]*?<\/button>/,
  `
                  <select 
                    value={status}
                    onChange={(e) => handleStatusChange(alert.alertId, e.target.value)}
                    className={\`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none cursor-pointer \${
                      status === "Resolvido" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      status === "Em andamento" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      status === "Em análise" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      status === "Ignorado" ? "bg-slate-100 text-slate-500 border-slate-200" :
                      "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }\`}
                  >
                    <option value="Novo">Novo</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Resolvido">Resolvido</option>
                    <option value="Ignorado">Ignorado</option>
                  </select>
  `
);

fs.writeFileSync('src/pages/AlertsPage.tsx', content);
