const fs = require('fs');
let content = fs.readFileSync('src/pages/AlertsPage.tsx', 'utf8');

// Change status type
content = content.replace(
  /status: "Pendente" \| "Resolvido";/g,
  `status: "Novo" | "Em análise" | "Em andamento" | "Resolvido" | "Ignorado";`
);

content = content.replace(
  /status: "Pendente"/g,
  `status: "Novo"`
);

content = content.replace(
  /const \[resolvedIds, setResolvedIds\] = useState<Set<string>>\(new Set\(\)\);/,
  `const [alertStatuses, setAlertStatuses] = useState<Record<string, string>>({});`
);

// We need to replace the static generation effect because it overwrites alerts on every render.
// Or we map over the generated alerts and apply the local statuses.
content = content.replace(
  /setAlerts\(list\);/,
  `const mapped = list.map(a => ({...a, status: alertStatuses[a.alertId] || a.status as any}));
    setAlerts(mapped);`
);

content = content.replace(
  /const handleResolveAlert = \(id: string\) => \{[\s\S]*?\};/,
  `const handleStatusChange = (id: string, newStatus: string) => {
    setAlertStatuses(prev => ({...prev, [id]: newStatus}));
  };`
);

// We need to change the buttons in the render loop.
// Let's replace the whole card rendering block. I'll search for how it renders.
fs.writeFileSync('src/pages/AlertsPage.tsx', content);
