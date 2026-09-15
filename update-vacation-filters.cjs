const fs = require('fs');
let content = fs.readFileSync('src/utils/vacationUtils.ts', 'utf8');

content = content.replace(/if \(filtros.periodoFerias === "proximoMes"\) \{[\s\S]*?return startYm === "2026-08" \|\| endYm === "2026-08";[\s\S]*?\}/g, 
`if (filtros.periodoFerias === "proximoMes") {
          const nextM = getMonthOffset(1);
          return startYm === nextM || endYm === nextM;
        }`);
        
content = content.replace(/if \(filtros.periodoFerias === "proximos3meses"\) \{[\s\S]*?return \([\s\S]*?startYm === "2026-07" \|\| startYm === "2026-08" \|\| startYm === "2026-09" \|\|[\s\S]*?endYm === "2026-07" \|\| endYm === "2026-08" \|\| endYm === "2026-09"[\s\S]*?\);[\s\S]*?\}/g, 
`if (filtros.periodoFerias === "proximos3meses") {
          const m0 = getCurrentYearMonth();
          const m1 = getMonthOffset(1);
          const m2 = getMonthOffset(2);
          return (
            startYm === m0 || startYm === m1 || startYm === m2 ||
            endYm === m0 || endYm === m1 || endYm === m2
          );
        }`);

fs.writeFileSync('src/utils/vacationUtils.ts', content);
