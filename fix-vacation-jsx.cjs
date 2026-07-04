const fs = require('fs');
let content = fs.readFileSync('src/pages/VacationsPage.tsx', 'utf8');

content = content.replace(
  /\{selectedEmployee && \(\s*<VacationDetailsPanel[\s\S]*?\/>\s*<VacationFormPanel[\s\S]*?\/>\s*\)\}/,
  `{selectedEmployee && (
        <VacationDetailsPanel
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {formEmployee && (
        <VacationFormPanel
          employee={formEmployee}
          allEmployees={employees}
          onClose={() => setFormEmployee(null)}
          onSave={(updated, autoSubst) => {
            if (props.onSave) props.onSave(updated, autoSubst);
            setFormEmployee(null);
          }}
        />
      )}`
);

fs.writeFileSync('src/pages/VacationsPage.tsx', content);
