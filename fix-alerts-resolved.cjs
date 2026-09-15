const fs = require('fs');
let content = fs.readFileSync('src/pages/AlertsPage.tsx', 'utf8');

content = content.replace(/resolvedIds/g, 'alertStatuses');

fs.writeFileSync('src/pages/AlertsPage.tsx', content);
