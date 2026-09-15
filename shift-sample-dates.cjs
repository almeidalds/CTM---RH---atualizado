const fs = require('fs');

// helper
function addMonthsToDateString(dateStr, offset) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().split('T')[0];
}

const currentDate = new Date();
const targetDate = new Date('2026-07-03');

const monthDiff = (currentDate.getFullYear() - targetDate.getFullYear()) * 12 + (currentDate.getMonth() - targetDate.getMonth());

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/"(2026-\d{2}-\d{2})"/g, (match, p1) => {
    return '"' + addMonthsToDateString(p1, monthDiff) + '"';
  });
  fs.writeFileSync(file, content);
}

processFile('src/data/sampleData.ts');
processFile('src/services/additionalDataSource.ts');

