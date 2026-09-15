const fs = require('fs');
const cp = require('child_process');

function fail(message) {
  console.error(`\n[ERRO] ${message}\n`);
  process.exit(1);
}

console.log('=== CTM RH | Diagnostico do ambiente ===');
console.log(`Node: ${process.version}`);
try {
  console.log(`npm:  ${cp.execSync('npm --version', { encoding: 'utf8' }).trim()}`);
} catch {
  fail('npm nao foi encontrado. Reinstale o Node.js LTS.');
}

if (!fs.existsSync('node_modules')) {
  fail('A pasta node_modules nao existe. Execute: npm install');
}
if (!fs.existsSync('node_modules/vite/bin/vite.js')) {
  fail('Vite nao esta instalado localmente. Execute: npm install');
}
if (!fs.existsSync('node_modules/@microsoft/power-apps-vite')) {
  fail('@microsoft/power-apps-vite nao esta instalado. Execute: npm install');
}

try {
  const vite = cp.execSync('npx --no-install vite --version', { encoding: 'utf8' }).trim();
  console.log(`Vite: ${vite}`);
} catch {
  fail('O executavel local do Vite nao pode ser iniciado. Execute o script de reparo.');
}
console.log('\n[OK] Dependencias locais prontas.');
