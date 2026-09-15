const fs = require('fs');
let content = fs.readFileSync('src/pages/ExecutiveSummaryPage.tsx', 'utf8');

content = content.replace(
  /<div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">\s*<ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" \/>\s*<div>\s*<p className="text-sm font-bold text-oxford">Corrigir cadastros sem data de término<\/p>\s*<p className="text-xs text-slate-500 mt-0\.5">Há \{stats\.semTermino\} instrutores sem data, impedindo o cálculo de risco de contrato\.<\/p>\s*<\/div>\s*<\/div>/,
  `<div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-amber-100/60 rounded-xl shrink-0">
                  <ShieldAlert className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Corrigir cadastros sem data de término</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Há {stats.semTermino} instrutores sem data, impedindo o cálculo de risco de contrato.</p>
                </div>
              </div>`
);

content = content.replace(
  /<div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">\s*<ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" \/>\s*<div>\s*<p className="text-sm font-bold text-oxford">Revisar instrutores sem idioma<\/p>\s*<p className="text-xs text-slate-500 mt-0\.5">Há \{stats\.semIdioma\} instrutores sem idioma, afetando a análise de cobertura\.<\/p>\s*<\/div>\s*<\/div>/,
  `<div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-amber-100/60 rounded-xl shrink-0">
                  <ShieldAlert className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Revisar instrutores sem idioma</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Há {stats.semIdioma} instrutores sem idioma, afetando a análise de cobertura.</p>
                </div>
              </div>`
);

content = content.replace(
  /<div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">\s*<AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" \/>\s*<div>\s*<p className="text-sm font-bold text-oxford">Solicitar marcação de férias críticas<\/p>\s*<p className="text-xs text-slate-500 mt-0\.5">Há \{stats\.feriasCriticas\} instrutores com mais de 18 meses sem férias\.<\/p>\s*<\/div>\s*<\/div>/,
  `<div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-rose-100/60 rounded-xl shrink-0">
                  <AlertTriangle className="w-7 h-7 text-rose-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Solicitar marcação de férias críticas</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Há {stats.feriasCriticas} instrutores com mais de 18 meses sem férias.</p>
                </div>
              </div>`
);

content = content.replace(
  /<div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">\s*<AlertTriangle className="w-5 h-5 text-purple-500 shrink-0" \/>\s*<div>\s*<p className="text-sm font-bold text-oxford">Definir substitutos para ausências<\/p>\s*<p className="text-xs text-slate-500 mt-0\.5">Existem substituições urgentes sem responsável designado\.<\/p>\s*<\/div>\s*<\/div>/,
  `<div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-purple-100/60 rounded-xl shrink-0">
                  <AlertTriangle className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Definir substitutos para ausências</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Existem substituições urgentes sem responsável designado.</p>
                </div>
              </div>`
);


fs.writeFileSync('src/pages/ExecutiveSummaryPage.tsx', content);
