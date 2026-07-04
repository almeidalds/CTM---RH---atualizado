export function getToday(): string {
  // Returns today's date in YYYY-MM-DD format
  return new Date().toISOString().split('T')[0];
}

export function getCurrentYearMonth(): string {
  // Returns today's YYYY-MM
  return getToday().substring(0, 7);
}

export function getMonthOffset(offsetMonths: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toISOString().substring(0, 7);
}

export function formatarDataBR(dataStr?: string): string {
  if (!dataStr) return "N/A";
  const [year, month, day] = dataStr.split("-");
  if (!year || !month || !day) return dataStr;
  return `${day}/${month}/${year}`;
}

export function calcularDiasRestantes(dataTermino?: string): number {
  if (!dataTermino) return 999;
  const hoje = new Date(getToday());
  const fim = new Date(dataTermino);
  const diffTime = Math.abs(fim.getTime() - hoje.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return fim < hoje ? -diffDays : diffDays;
}

export function obterMesExtenso(dataStr: string): string {
  const [year, month] = dataStr.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[parseInt(month, 10) - 1] || month}/${year}`;
}
