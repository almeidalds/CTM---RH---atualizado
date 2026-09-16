import { useId, useState } from "react";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import type { RhEmployee } from "../types/rh";
import { agruparSaidasPorMes } from "../utils/groupUtils";
import { formatarDataBR } from "../utils/dateUtils";

export function DeparturesChart({ employees, onSelectEmployee }: {
  employees: RhEmployee[];
  onSelectEmployee: (employee: RhEmployee) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const detailsId = useId();
  const months = agruparSaidasPorMes(employees);
  const selected = months.find((month) => month.key === selectedMonth) ?? months[0];
  const maxCount = Math.max(1, ...months.map((month) => month.employees.length));
  const total = months.reduce((sum, month) => sum + month.employees.length, 0);

  return <section className="lg:col-span-8 min-w-0 rounded-2xl border border-sky-100 bg-white p-5 sm:p-6" aria-label="Saídas previstas por mês">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-yinmn">Planejamento de contratos</p><h3 className="text-base font-bold text-oxford">Saídas previstas por mês</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">Clique na barra ou no mês para ver os colaboradores.</p></div>
      <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-yinmn">{total} {total === 1 ? "término previsto" : "términos previstos"}</span>
    </div>
    {!selected ? <div className="rounded-xl bg-slate-50 px-4 py-10 text-center"><CalendarDays className="mx-auto mb-3 h-7 w-7 text-slate-400" /><p className="text-sm font-medium text-slate-600">Nenhum término de contrato previsto</p><p className="mt-1 text-xs text-slate-500">São considerados contratos com término a partir de hoje.</p></div> : <>
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3" role="group" aria-label="Selecione um mês de término de contrato">
        <div className="flex min-w-full gap-2">
          {months.map((month) => {
            const active = month.key === selected.key;
            return <button key={month.key} type="button" onClick={() => setSelectedMonth(month.key)} aria-pressed={active} aria-controls={detailsId} aria-label={`${month.label}: ${month.employees.length} ${month.employees.length === 1 ? "colaborador" : "colaboradores"}. Ver pessoas.`} className={`group flex min-w-[76px] flex-1 flex-col rounded-lg px-2 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yinmn ${active ? "bg-sky-100/70" : "hover:bg-sky-50"}`}>
              <span className="flex h-40 w-full flex-col items-center justify-end border-b border-sky-200">
                <span className={`mb-2 text-sm font-bold tabular-nums ${active ? "text-yinmn" : "text-slate-600"}`}>{month.employees.length}</span>
                <span aria-hidden="true" className={`block w-8 shrink-0 rounded-t-md sm:w-10 ${active ? "bg-yinmn" : "bg-sky-300 group-hover:bg-sky-400"}`} style={{ height: `${month.employees.length / maxCount * 120}px` }} />
              </span>
              <span className={`mt-3 w-full text-center text-xs font-semibold ${active ? "text-yinmn" : "text-slate-600"}`}>{month.label.split("/")[0]}</span>
              <span className="mt-0.5 w-full text-center text-[11px] text-slate-500">{month.key.slice(0, 4)}</span>
            </button>;
          })}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Quantidade de colaboradores por mês com término previsto, em ordem cronológica.</p>
      <div id={detailsId} className="mt-5 border-t border-sky-100 pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2" aria-live="polite"><h4 className="text-sm font-bold text-oxford">Términos em {selected.label}</h4><span className="text-xs text-slate-500">{selected.employees.length} {selected.employees.length === 1 ? "colaborador" : "colaboradores"}</span></div>
        <ul className="max-h-72 space-y-2 overflow-y-auto p-1">
          {selected.employees.map((employee) => <li key={employee.recordId}><button type="button" onClick={() => onSelectEmployee(employee)} aria-label={`Ver detalhes de ${employee.nome}, término em ${formatarDataBR(employee.dataTerminoReal)}`} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yinmn">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sm font-bold text-yinmn sm:flex" aria-hidden="true">{employee.nome.charAt(0)}</span>
            <span className="min-w-0 flex-1"><span className="block break-words text-xs font-semibold text-oxford">{employee.nome}</span><span className="mt-1 block text-[11px] text-slate-500">{employee.cargo || "Cargo não informado"}{employee.zona ? ` · ${employee.zona}` : ""}</span></span>
            <span className="shrink-0 text-right"><span className="block text-[10px] text-slate-500">Término previsto</span><span className="text-xs font-semibold tabular-nums text-oxford">{formatarDataBR(employee.dataTerminoReal)}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-yinmn" />
          </button></li>)}
        </ul>
      </div>
    </>}
  </section>;
}