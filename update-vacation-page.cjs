const fs = require('fs');
let content = fs.readFileSync('src/pages/VacationsPage.tsx', 'utf8');

// Imports
content = content.replace(
  /import \{ VacationDetailsPanel \} from "\.\.\/components\/VacationDetailsPanel";/,
  `import { VacationDetailsPanel } from "../components/VacationDetailsPanel";\nimport { VacationFormPanel } from "../components/VacationFormPanel";`
);

content = content.replace(
  /interface VacationsPageProps \{/,
  `interface VacationsPageProps {\n  onSave?: (emp: RhEmployee, createSubst: boolean) => void;`
);

content = content.replace(
  /const \[selectedEmployee, setSelectedEmployee\] = useState<RhEmployee \| null>\(null\);/,
  `const [selectedEmployee, setSelectedEmployee] = useState<RhEmployee | null>(null);\n  const [formEmployee, setFormEmployee] = useState<RhEmployee | null>(null);`
);

// We need a button to open the form.
content = content.replace(
  /<button\s+onClick=\{\(\) => setSelectedEmployee\(emp\)\}\s+className="p-1\.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"\s+title="Detalhes"\s+>\s*<Search className="w-4 h-4" \/>\s*<\/button>/g,
  `<button
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Detalhes"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFormEmployee(emp)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Registrar / Editar Férias"
                      >
                        <Plane className="w-4 h-4" />
                      </button>`
);

content = content.replace(
  /<VacationDetailsPanel\s+employee=\{selectedEmployee\}\s+onClose=\{\(\) => setSelectedEmployee\(null\)\}\s+\/>/g,
  `<VacationDetailsPanel
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
      <VacationFormPanel
        employee={formEmployee}
        allEmployees={employees}
        onClose={() => setFormEmployee(null)}
        onSave={(updated, autoSubst) => {
          if (props.onSave) props.onSave(updated, autoSubst);
          setFormEmployee(null);
        }}
      />`
);

content = content.replace(
  /export const VacationsPage: React\.FC<VacationsPageProps> = \(\{ employees \}\) => \{/,
  `export const VacationsPage: React.FC<VacationsPageProps> = (props) => {\n  const { employees } = props;`
);


fs.writeFileSync('src/pages/VacationsPage.tsx', content);
