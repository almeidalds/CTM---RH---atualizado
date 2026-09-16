import { useId, useState } from "react";
import { Globe, MapPin, Clock, ShieldAlert, Layers3, Users, CheckCircle2, AlertCircle } from "lucide-react";
import type { GroupCount } from "../utils/groupUtils";
import type { DataQualityStats } from "../utils/dataQualityUtils";

export function DataIntegrityCard({ quality }: { quality: DataQualityStats }) {
  const percent = quality.total ? quality.percentualQualidade : 0;
  return (
    <section aria-label="Integridade cadastral" className="lg:col-span-4 flex flex-col gap-5 rounded-2xl border border-sky-100 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-yinmn"><ShieldAlert className="h-5 w-5" /></span>
        <div><h3 className="text-sm font-bold text-oxford">Integridade cadastral</h3><p className="mt-1 text-xs text-slate-500">Qualidade dos dados da equipe</p></div>
      </div>
      <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
        <div className="flex items-end justify-between gap-3"><span className="text-4xl font-extrabold tracking-tight text-oxford">{quality.total ? `${percent}%` : "—"}</span><span className="pb-1 text-xs text-slate-500">cadastros completos</span></div>
        <div role="progressbar" aria-label="Cadastros completos" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={quality.total ? `${percent}% de cadastros completos` : "Sem cadastros"} className="mt-4 h-2.5 overflow-hidden rounded-full bg-sky-100"><div className="h-full rounded-full bg-yinmn" style={{ width: `${percent}%` }} /></div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{quality.total ? `${quality.completos} de ${quality.total} colaboradores sem pendências cadastrais.` : "Cadastre colaboradores para acompanhar a qualidade dos dados."}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 p-3"><dt className="flex items-center gap-1.5 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Completos</dt><dd className="mt-2 text-2xl font-bold text-oxford">{quality.completos}</dd></div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"><dt className="flex items-center gap-1.5 text-xs text-slate-500"><AlertCircle className="h-4 w-4 text-amber-600" />Pendentes</dt><dd className="mt-2 text-2xl font-bold text-oxford">{quality.comPendencia}</dd></div>
      </dl>
      <p className="text-xs leading-relaxed text-slate-500">{!quality.total ? "Nenhum cadastro analisado." : quality.comPendencia ? "Consulte Pendências cadastrais no menu Equipe para revisar os registros." : "Todos os cadastros estão completos."}</p>
    </section>
  );
}

interface DistributionPanelProps {
  languages: GroupCount[];
  zones: GroupCount[];
  shifts: GroupCount[];
  risks: GroupCount[];
  statuses: GroupCount[];
  activeCount: number;
  totalCount: number;
}
const riskColors: Record<string, string> = {
  "Crítico": "bg-rose-500", "Alto": "bg-amber-500", "Médio": "bg-blue-500",
  "Baixo": "bg-sky-400", "Sem risco": "bg-emerald-500", "Cadastro incompleto": "bg-slate-400",
};

export function DistributionPanel({ languages, zones, shifts, risks, statuses, activeCount, totalCount }: DistributionPanelProps) {
  const [selected, setSelected] = useState("idiomas");
  const panelId = useId();
  const views = [
    { id: "idiomas", label: "Idiomas", icon: Globe, data: languages, title: "Idiomas da equipe ativa", description: "Um colaborador pode aparecer em mais de um idioma.", base: activeCount },
    { id: "zonas", label: "Regiões", icon: MapPin, data: zones, title: "Distribuição por região", description: "Localização dos colaboradores com vínculo ativo.", base: activeCount },
    { id: "turnos", label: "Turnos", icon: Clock, data: shifts, title: "Distribuição por turno", description: "Alocação dos colaboradores com vínculo ativo.", base: activeCount },
    { id: "risco", label: "Riscos", icon: ShieldAlert, data: risks, title: "Classificação de risco", description: "Classificação dos contratos de todos os colaboradores.", base: totalCount },
    { id: "status", label: "Status", icon: Layers3, data: statuses, title: "Situação dos vínculos", description: "Colaboradores agrupados pela situação do cadastro.", base: totalCount },
  ];
  const view = views.find((item) => item.id === selected)!;
  const rows = [...view.data].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...rows.map((item) => item.count));
  return (
    <section aria-label="Distribuição e cobertura de funcionários" className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-yinmn">Panorama da equipe</p><h3 className="text-lg font-bold tracking-tight text-oxford sm:text-xl">Distribuição e cobertura</h3><p className="mt-1 text-xs text-slate-500">Explore o quadro de funcionários por categoria.</p></div>
        <span className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-yinmn"><Users className="h-4 w-4" />{activeCount} ativos / {totalCount} colaboradores</span>
      </div>
      <div role="group" aria-label="Categoria de distribuição" className="flex gap-2 overflow-x-auto border-y border-sky-100 bg-slate-50/60 px-5 py-3 sm:px-6">
        {views.map((item) => <button type="button" key={item.id} aria-pressed={selected === item.id} aria-controls={panelId} onClick={() => setSelected(item.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yinmn ${selected === item.id ? "bg-yinmn text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-yinmn"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
      </div>
      <div id={panelId} className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h4 className="text-sm font-bold text-oxford">{view.title}</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">{view.description}</p></div><span className="text-xs text-slate-500">Base: {view.base} colaboradores</span></div>
        {rows.some((item) => item.count > 0) ? <ul className="grid gap-x-8 gap-y-4 xl:grid-cols-2">
          {rows.map((item) => <li key={item.name} className="min-w-0 rounded-xl border border-slate-100 px-4 py-3">
            <div className="mb-2.5 flex items-start justify-between gap-4"><span className="min-w-0 break-words text-xs font-medium leading-relaxed text-slate-700">{item.name}</span><span className="shrink-0 text-sm font-bold tabular-nums text-oxford">{item.count}<span className="ml-2 text-[11px] font-normal text-slate-500">{view.base ? Math.round(item.count / view.base * 100) : 0}%</span></span></div>
            <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${selected === "risco" ? riskColors[item.name] || "bg-yinmn" : "bg-yinmn"}`} style={{ width: `${item.count / max * 100}%` }} /></div>
          </li>)}
        </ul> : <div className="rounded-xl bg-slate-50 py-10 text-center"><view.icon className="mx-auto mb-3 h-7 w-7 text-slate-400" /><p className="text-sm font-medium text-slate-600">Sem dados para esta categoria</p><p className="mt-1 text-xs text-slate-500">Os indicadores aparecem quando há registros disponíveis.</p></div>}
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">Barras proporcionais à maior categoria. Percentuais sobre a base de colaboradores{selected === "idiomas" ? "; a soma pode ultrapassar 100% por haver vários idiomas por pessoa." : "."}</p>
      </div>
    </section>
  );
}