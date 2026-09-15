export function getToday(): string {
  // Returns today's date in YYYY-MM-DD format, safely handling local time
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getCurrentYearMonth(): string {
  return getToday().substring(0, 7);
}

export function getMonthOffset(offsetMonths: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function formatarDataBR(dataStr?: string): string {
  if (!dataStr) return "N/A";
  const [year, month, day] = dataStr.split("-");
  if (!year || !month || !day) return dataStr;
  return `${day}/${month}/${year}`;
}

export function formatarDataCurta(date: Date): string {
  return toISODate(date);
}

// Converts a Date object to YYYY-MM-DD format
export function toISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Parses a YYYY-MM-DD string to a Date object at midnight local time
function parseISODate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const [yyyy, mm, dd] = dateStr.split('-');
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
}

// Adds days to a YYYY-MM-DD date string
export function addDays(dateStr: string, days: number): string {
  const date = parseISODate(dateStr);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

// Adds months to a YYYY-MM-DD date string
export function addMonths(dateStr: string, months: number): string {
  const date = parseISODate(dateStr);
  date.setMonth(date.getMonth() + months);
  return toISODate(date);
}

// Returns the difference in days between two YYYY-MM-DD date strings (end - start)
export function differenceInDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function calcularDiasRestantes(dataTermino?: string): number {
  if (!dataTermino) return 999;
  return differenceInDays(getToday(), dataTermino);
}

export function obterMesExtenso(dataStr: string): string {
  const [year, month] = dataStr.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[parseInt(month, 10) - 1] || month}/${year}`;
}

// Returns a month label (e.g., "Julho", "Agosto") from a Date or YYYY-MM-DD string
export function getMonthLabel(date: string | Date): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  if (isNaN(d.getTime())) return "";
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return meses[d.getMonth()];
}

// Returns an array of upcoming month labels based on today
export function getNextMonthsLabels(count: number): string[] {
  const labels: string[] = [];
  const today = parseISODate(getToday());
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    labels.push(getMonthLabel(d));
  }
  return labels;
}

// Checks if a date string (YYYY-MM-DD) is between start and end date strings (inclusive)
export function isDateBetween(dateStr: string, start: string, end: string): boolean {
  if (!dateStr || !start || !end) return false;
  return dateStr >= start && dateStr <= end;
}

// Checks if a date string is in the past (before today)
export function isPastDate(dateStr: string): boolean {
  return dateStr < getToday();
}

// Checks if a date string is in the future (after today)
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getToday();
}

// Checks if dateA is same or after dateB
export function isSameOrAfter(dateA: string, dateB: string): boolean {
  return dateA >= dateB;
}

// Checks if dateA is same or before dateB
export function isSameOrBefore(dateA: string, dateB: string): boolean {
  return dateA <= dateB;
}

