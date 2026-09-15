import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, AlertTriangle, Calendar, Users, Plane, Link, CheckCircle, Info } from 'lucide-react';
import { RhEmployee, VacationPeriod } from '../types/rh';
import { validarLimiteAusencias } from '../utils/absenceUtils';

interface Props {
  employee: RhEmployee | null;
  allEmployees: RhEmployee[];
  onClose: () => void;
  onSave: (employee: RhEmployee, createSubstitution: boolean) => void;
}

export const VacationFormPanel: React.FC<Props> = ({ employee, allEmployees, onClose, onSave }) => {
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [soldVacation, setSoldVacation] = useState(false);
  const [soldDays, setSoldDays] = useState(0);
  const [obs, setObs] = useState('');
  const [autoSubst, setAutoSubst] = useState(false);

  useEffect(() => {
    if (employee) {
      setPeriods(employee.periodosFerias ? [...employee.periodosFerias] : []);
      setSoldVacation(employee.feriasVendidas || false);
      setSoldDays(employee.diasVendidosFerias || 0);
      setObs('');
    }
  }, [employee]);

  const handleAddPeriod = () => {
    setPeriods([...periods, { dataInicio: '', dataFim: '', dias: 0 }]);
  };

  const handleRemovePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const handlePeriodChange = (index: number, field: keyof VacationPeriod, value: string) => {
    const newPeriods = [...periods];
    const p = { ...newPeriods[index], [field]: value };
    
    if (p.dataInicio && p.dataFim) {
      const d1 = new Date(p.dataInicio);
      const d2 = new Date(p.dataFim);
      if (d2 >= d1) {
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        p.dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else {
        p.dias = 0;
      }
    }
    
    newPeriods[index] = p;
    setPeriods(newPeriods);
  };

  // Convert all employees' vacations to AbsenceItems
  const allAbsences = useMemo(() => {
    const list: { dataInicio: string; dataFim: string; nome: string }[] = [];
    allEmployees.forEach(emp => {
      if (emp.recordId !== employee?.recordId && emp.periodosFerias) {
        emp.periodosFerias.forEach(pf => {
          if (pf.dataInicio && pf.dataFim) {
            list.push({
              dataInicio: pf.dataInicio,
              dataFim: pf.dataFim,
              nome: emp.nome
            });
          }
        });
      }
    });
    return list;
  }, [allEmployees, employee]);

  const { totalDays, allValid, validations } = useMemo(() => {
    let total = 0;
    let allValid = true;
    const validations = periods.map(p => {
      if (!p.dataInicio || !p.dataFim) return { isValid: true, result: null };
      total += p.dias;
      
      const val = validarLimiteAusencias({ dataInicio: p.dataInicio, dataFim: p.dataFim }, allAbsences, 8);
      if (!val.permitido) allValid = false;
      
      return {
        isValid: val.permitido,
        result: val
      };
    });
    return { totalDays: total, allValid, validations };
  }, [periods, allAbsences]);

  if (!employee) return null;

  const handleSave = () => {
    if (!allValid) return;
    const updated = {
      ...employee,
      periodosFerias: periods,
      feriasVendidas: soldVacation,
      diasVendidosFerias: soldVacation ? soldDays : 0,
      feriasMarcadas: periods.length > 0
    };
    onSave(updated, autoSubst);
  };


  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-oxford/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10">
        
        <div className="bg-oxford text-white p-6 flex items-center justify-between border-b border-cadet">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cadet rounded-xl flex items-center justify-center border border-yinmn/20">
              <Plane className="w-5 h-5 text-jordy" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Registrar Férias</h2>
              <p className="text-xs text-jordy/80">{employee.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-oxford">Períodos de Férias</h3>
              <button onClick={handleAddPeriod} className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded cursor-pointer">
                + Adicionar Período
              </button>
            </div>

            {periods.map((p, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período {idx + 1}</span>
                  <button onClick={() => handleRemovePeriod(idx)} className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer">Remover</button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Início</label>
                    <input type="date" value={p.dataInicio} onChange={e => handlePeriodChange(idx, 'dataInicio', e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Fim</label>
                    <input type="date" value={p.dataFim} onChange={e => handlePeriodChange(idx, 'dataFim', e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg p-2" />
                  </div>
                </div>

                {p.dataInicio && p.dataFim && validations[idx]?.result && (
                  <div className={`p-4 rounded-xl border text-xs ${
                    validations[idx].result?.permitido 
                      ? validations[idx].result?.limiteAtingido 
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                      <div className="flex items-center gap-2">
                        {validations[idx].result?.permitido ? (
                           validations[idx].result?.limiteAtingido ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        <span className="font-extrabold text-sm tracking-tight">{validations[idx].result?.mensagem}</span>
                      </div>
                      <span className="font-bold bg-white/50 px-2 py-1 rounded text-[10px] uppercase">
                        Máx. {validations[idx].result?.maiorQuantidadeSimultanea}/8 ausentes
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {validations[idx].result?.detalhesPorDia.map((detalhe, i) => (
                        <div key={i} className={`flex items-center justify-between p-1.5 rounded-md ${
                          detalhe.situacao === 'Bloqueado' ? 'bg-rose-100/50 text-rose-700' :
                          detalhe.situacao === 'Limite atingido' ? 'bg-amber-100/50 text-amber-700' :
                          'hover:bg-white/40'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] opacity-70 w-16">{detalhe.data}</span>
                            <span className="font-semibold text-[10px]">
                              {detalhe.quantidadeAtual} + 1 = <strong className="text-xs">{detalhe.quantidadeComNovaAusencia}</strong>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              detalhe.situacao === 'Bloqueado' ? 'bg-rose-200 text-rose-800' :
                              detalhe.situacao === 'Limite atingido' ? 'bg-amber-200 text-amber-800' :
                              'bg-emerald-200/50 text-emerald-700'
                            }`}>{detalhe.situacao}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border border-slate-200 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-oxford">Opções Adicionais</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-oxford">Abono Pecuniário (Vender férias)</label>
              <input type="checkbox" checked={soldVacation} onChange={e => setSoldVacation(e.target.checked)} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600" />
            </div>

            {soldVacation && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dias vendidos</label>
                <input type="number" min="0" max="30" value={soldDays} onChange={e => setSoldDays(Number(e.target.value))} className="w-full text-sm border border-slate-200 rounded-lg p-2" />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-slate-400" />
                <label className="text-xs font-semibold text-oxford">Criar substituição automaticamente</label>
              </div>
              <input type="checkbox" checked={autoSubst} onChange={e => setAutoSubst(e.target.checked)} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600" />
            </div>

            {autoSubst && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[10px] text-blue-700">Uma substituição será criada para o período selecionado e sugestões de substitutos serão apresentadas na aba Substituições.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total dias: <strong className="text-oxford">{totalDays + (soldVacation ? soldDays : 0)} / 30</strong>
          </div>
          <button 
            onClick={handleSave}
            disabled={!allValid}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              allValid ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Salvar Férias
          </button>
        </div>
      </div>
    </div>
  );
};
