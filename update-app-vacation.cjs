const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The onSave in VacationsPage:
content = content.replace(
  /<VacationsPage employees=\{employees\} \/>/,
  `<VacationsPage employees={employees} onSave={(updated, createSubst) => {
                handleSaveEmployee(updated);
                if (createSubst) {
                  // We would trigger a substitution flow here. Since substitutions are mocked in additionalDataSource, 
                  // we just change tab to substitutions for now to represent the flow conceptually.
                  setScheduleSubTab("substitutions");
                }
              }} />`
);

fs.writeFileSync('src/App.tsx', content);
