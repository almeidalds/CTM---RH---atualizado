const fs = require('fs');
let content = fs.readFileSync('src/components/GenerateReportModal.tsx', 'utf8');

// The file is pretty big, I will replace the generateContent logic.
// But maybe simpler to just recreate the file since it's only 400 lines and I can generate the new structure.
