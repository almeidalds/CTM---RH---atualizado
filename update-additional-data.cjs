const fs = require('fs');
let content = fs.readFileSync('src/services/additionalDataSource.ts', 'utf8');

if (!content.includes('import { getToday }')) {
  content = 'import { getToday, getMonthOffset } from "../utils/dateUtils";\n' + content;
}

content = content.replace(/dataLimite = "2026-07-03"/g, 'dataLimite = getToday()');
content = content.replace(/const hojeStr = "2026-07-03"/g, 'const hojeStr = getToday()');

fs.writeFileSync('src/services/additionalDataSource.ts', content);
