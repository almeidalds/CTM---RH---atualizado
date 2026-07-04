const fs = require('fs');
let content = fs.readFileSync('src/pages/AlertsPage.tsx', 'utf8');

content = content.replace(/alertStatuses\.has\(([^)]+)\)/g, 'alertStatuses[$1] === "Resolvido"');
content = content.replace(/alertStatuses\.size/g, 'Object.values(alertStatuses).filter(s => s === "Resolvido").length');

fs.writeFileSync('src/pages/AlertsPage.tsx', content);
