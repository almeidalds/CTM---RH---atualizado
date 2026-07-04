import React, { useMemo } from 'react';
import { 
  BarChart, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  CalendarDays, 
  FileText, 
  UserMinus, 
  ListTodo
} from 'lucide-react';
import { RhEmployee, VacationPeriod } from '../types/rh';
import { calcularStatusFerias } from '../utils/vacationUtils';
import { getToday } from '../utils/dateUtils';

interface Props {
  employees: RhEmployee[];
}

export const ExecutiveSummaryPage: React.FC<Props> = ({ employees }) => {
  const stats = useMemo(() => {
    const ativos = employees.filter(e => e.statusFuncionario === 'Ativo');
    const pendencias = employees.filter(e => e.pendencias && e.pendencias.length > 0);
    const semTermino = employees.filter(e => e.statusFuncionario === 'Ativo' && !e.dataTerminoReal);
    const semIdioma = employees.filter(e => e.statusFuncionario === 'Ativo' && (!e.idiomas || e.idiomas.length === 0));
    
    // Férias
    let feriasCriticas = 0;
    let aptos = 0;
    let feriasMarcadas = 0;
    let feriasVendidas = 0;

    ativos.forEach(e => {
      const status = calcularStatusFerias(e);
      if (status === 'Férias críticas') feriasCriticas++;
      if (status === 'Apto para férias') aptos++;
      if (status === 'Férias marcadas' || status === 'Férias em andamento' || status === 'Férias parcialmente vendidas') feriasMarcadas++;
      if (e.feriasVendidas || e.diasVendidosFerias > 0) feriasVendidas++;
    });

    // Saídas próximas 30 dias
    const today = getToday();
    const d30 = new Date(today);
    d30.setDate(d30.getDate() + 30);
    const d30Str = d30.toISOString().split('T')[0];
    
    const saidas30d = ativos.filter(e => e.dataTerminoReal && e.dataTerminoReal >= today && e.dataTerminoReal <= d30Str);
    
    // Contratos críticos (<= 15 dias)
    const d15 = new Date(today);
    d15.setDate(d15.getDate() + 15);
    const d15Str = d15.toISOString().split('T')[0];
    const contratosCriticos = ativos.filter(e => e.dataTerminoReal && e.dataTerminoReal >= today && e.dataTerminoReal <= d15Str).length;

    // TODO: get substitutions and absence limits (mocking for now, will connect properly if needed, but since we only have employees list here, we'll approximate or use static for missing external modules, wait, substitutions are in another state. The requirement allows mock data.)

    return {
      total: employees.length,
      ativos: ativos.length,
      pendencias: pendencias.length,
      semTermino: semTermino.length,
      semIdioma: semIdioma.length,
      feriasCriticas,
      aptos,
      feriasMarcadas,
      feriasVendidas,
      saidas30d: saidas30d.length,
      contratosCriticos,
      substPendentes: 4, // Mock
      periodosLimite: 2 // Mock
    };
  }, [employees]);

  return (
    <div className="w-full h-full p-4 lg:p-8 animate-fade-in pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-oxford tracking-tight">Resumo Executivo</h1>
          <p className="text-slate-500 mt-1">Visão geral para tomada de decisão e análise de riscos.</p>
        </div>

        {/* Dynamic Phrases */}
        <div className="bg-white rounded-2xl p-6 border border-lavender shadow-sm">
          <h2 className="text-sm font-bold text-oxford mb-4 uppercase tracking-wider flex items-center gap-2">
            <BarChart className="w-4 h-4 text-purple-600" />
            Cenário Atual
          </h2>
          <ul className="space-y-3 text-base text-slate-600 leading-relaxed">
            <li>&bull; Há <strong>{stats.total}</strong> funcionários carregados no sistema, sendo <strong>{stats.ativos}</strong> ativos.</li>
            <li>&bull; <strong>{stats.saidas30d}</strong> instrutores sairão nos próximos 30 dias.</li>
            <li>&bull; <strong>{stats.contratosCriticos}</strong> contratos estão em estado crítico de renovação.</li>
            <li>&bull; Existem <strong>{stats.pendencias}</strong> cadastros com pendência ({stats.semTermino} sem data de término, {stats.semIdioma} sem idioma).</li>
            <li>&bull; <strong>{stats.aptos}</strong> instrutores já podem marcar férias e <strong>{stats.feriasCriticas}</strong> estão em estado crítico.</li>
            <li>&bull; <strong>{stats.feriasMarcadas}</strong> instrutores já marcaram férias ({stats.feriasVendidas} venderam parte).</li>
            <li>&bull; <strong>{stats.substPendentes}</strong> substituições estão sem responsável.</li>
            <li>&bull; <strong>{stats.periodosLimite}</strong> períodos de férias estão no limite de 8 ausências simultâneas.</li>
          </ul>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-lavender shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Qualidade dos Dados</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-oxford">{Math.max(0, 100 - (stats.pendencias/stats.ativos*100)).toFixed(1)}%</p>
            <p className="text-xs font-medium text-slate-500 mt-2">Cadastros completos</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-lavender shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Férias Críticas</span>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-oxford">{stats.feriasCriticas}</p>
            <p className="text-xs font-medium text-slate-500 mt-2">Instrutores precisam de férias</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-lavender shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Contratos Críticos</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-oxford">{stats.contratosCriticos}</p>
            <p className="text-xs font-medium text-slate-500 mt-2">Terminam em &lt; 15 dias</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-lavender shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Substituições</span>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <UserMinus className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-oxford">{stats.substPendentes}</p>
            <p className="text-xs font-medium text-slate-500 mt-2">Pendentes de definição</p>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white rounded-2xl p-6 border border-lavender shadow-sm">
          <h2 className="text-sm font-bold text-oxford mb-4 uppercase tracking-wider flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-emerald-600" />
            Ações Recomendadas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {stats.semTermino > 0 && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-amber-100/60 rounded-xl shrink-0">
                  <ShieldAlert className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Corrigir cadastros sem data de término</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Há {stats.semTermino} instrutores sem data, impedindo o cálculo de risco de contrato.</p>
                </div>
              </div>
            )}
            
            {stats.semIdioma > 0 && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-amber-100/60 rounded-xl shrink-0">
                  <ShieldAlert className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Revisar instrutores sem idioma</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Há {stats.semIdioma} instrutores sem idioma, afetando a análise de cobertura.</p>
                </div>
              </div>
            )}

            {stats.feriasCriticas > 0 && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-rose-100/60 rounded-xl shrink-0">
                  <AlertTriangle className="w-7 h-7 text-rose-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Solicitar marcação de férias críticas</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Há {stats.feriasCriticas} instrutores com mais de 18 meses sem férias.</p>
                </div>
              </div>
            )}

            {stats.substPendentes > 0 && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-all">
                <div className="p-3 bg-purple-100/60 rounded-xl shrink-0">
                  <AlertTriangle className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-oxford">Definir substitutos para ausências</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Existem substituições urgentes sem responsável designado.</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
