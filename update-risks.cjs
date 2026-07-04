const fs = require('fs');
let content = fs.readFileSync('src/pages/RisksPage.tsx', 'utf8');

// Replace the large matrix rendering section with our new component
content = content.replace(
  /\{\/\* Matrices selectors \*\/\}.*?(?=\s*\{\/\* 5\. Pending Data Table)/s,
  `<RiskHeatmapMatrix employees={employees} />\n`
);

content = 'import { RiskHeatmapMatrix } from "../components/RiskHeatmapMatrix";\n' + content;

fs.writeFileSync('src/pages/RisksPage.tsx', content);
