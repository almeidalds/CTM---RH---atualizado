import React, { useState, useRef, useMemo } from "react";
import { 
  X, FileText, CheckCircle2, Copy, Download, RefreshCw, 
  AlertTriangle, ShieldAlert, BadgeInfo, CheckCircle, 
  Briefcase, Calendar, Languages, MapPin, Clock, Mail, 
  Sparkles, FileSpreadsheet, Layers, UserCheck, ShieldCheck,
  TrendingUp, TrendingDown, Users
} from "lucide-react";
import { RhEmployee } from "../types/rh";
import { formatarDataBR, getToday, calcularDiasRestantes } from "../utils/dateUtils";
import { calcularRisco, identificarPendencias } from "../utils/riskUtils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: RhEmployee[];
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
  employees
}) => {
  const [reportType, setReportType] = useState<string>("geral");
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [period, setPeriod] = useState("30");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Process data for the active configurations
  const periodDays = parseInt(period, 10);
  const totalEmployees = employees.length;
  
  const ativos = useMemo(() => employees.filter((e) => e.statusFuncionario === "Ativo"), [employees]);
  const aComecar = useMemo(() => employees.filter((e) => e.statusFuncionario === "A começar"), [employees]);
  const encerrados = useMemo(() => employees.filter((e) => e.statusFuncionario === "Encerrado"), [employees]);

  // Contracts expiring in analyzed period
  const contratosExpirando = useMemo(() => {
    return ativos.filter(e => {
      if (!e.dataTerminoReal) return false;
      const dias = calcularDiasRestantes(e.dataTerminoReal);
      return dias !== null && dias >= 0 && dias <= periodDays;
    }).sort((a, b) => {
      const diasA = a.dataTerminoReal ? calcularDiasRestantes(a.dataTerminoReal) : 999;
      const diasB = b.dataTerminoReal ? calcularDiasRestantes(b.dataTerminoReal) : 999;
      return diasA - diasB;
    });
  }, [ativos, periodDays]);

  // Data quality calculations
  const employeesWithIssues = useMemo(() => {
    return employees.map(e => ({
      ...e,
      issues: identificarPendencias(e)
    })).filter(e => e.issues.length > 0);
  }, [employees]);

  const totalActualIssues = useMemo(() => {
    return employeesWithIssues.reduce((sum, e) => sum + e.issues.length, 0);
  }, [employeesWithIssues]);

  const totalPossibleFields = employees.length * 8; // we check 8 fields
  const dataQualityPercent = useMemo(() => {
    if (employees.length === 0) return "100.0";
    return Math.max(0, 100 - (totalActualIssues / totalPossibleFields) * 100).toFixed(1);
  }, [employees, totalActualIssues, totalPossibleFields]);

  // Vacations critical & aptos list
  const feriasCriticas = useMemo(() => {
    // 18+ months of service since admission and no vacation marked
    return ativos.filter(e => {
      if (!e.dataAdmissao) return false;
      const admDate = new Date(e.dataAdmissao);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() - 18);
      return admDate <= limitDate && !e.feriasMarcadas;
    });
  }, [ativos]);

  const feriasAptas = useMemo(() => {
    // 12+ months of service
    return ativos.filter(e => {
      if (!e.dataAdmissao) return false;
      const admDate = new Date(e.dataAdmissao);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() - 12);
      return admDate <= limitDate;
    });
  }, [ativos]);

  // Copy plain text content (legacy option support)
  const handleCopyText = () => {
    if (previewRef.current) {
      const text = previewRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Modern HTML-to-PDF high fidelity generation
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    
    // Slight pause to ensure animations/renders finish
    setTimeout(async () => {
      try {
        const element = previewRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 2, // Double DPI for crystal clear text
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794, // Standard A4 width in pixels at 96 DPI
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Cover / first page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Multi-page slicing for overflowing documents
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`relatorio-ctm-rh-${reportType}-${getToday()}.pdf`);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
      } finally {
        setIsDownloading(false);
      }
    }, 300);
  };

  const types = [
    { id: 'geral', label: 'Geral de RH', desc: 'Resumo completo da saúde operacional' },
    { id: 'executivo', label: 'Resumo Executivo', desc: 'Dados consolidados para liderança' },
    { id: 'ferias', label: 'Controle de Férias', desc: 'Progresso e férias acumuladas' },
    { id: 'contratos', label: 'Vencimento de Contratos', desc: 'Renovações e prazos críticos' },
    { id: 'pendencias', label: 'Saneamento Cadastral', desc: 'Inconsistências e dados faltantes' },
    { id: 'riscos', label: 'Análise de Riscos', desc: 'Níveis de Status ativos' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      
      {/* Expanded Modal Layout for Dual Pane Settings + PDF Live Preview */}
      <div className="relative w-full max-w-7xl bg-slate-50 h-full shadow-[0_0_45px_rgba(16,42,67,0.12)] flex flex-col z-10 animate-fade-in">
        
        {/* Modal Header */}
        <div className="bg-white text-oxford px-6 py-5 flex items-center justify-between border-b border-sky-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-yinmn" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-oxford flex items-center gap-2">
                <span>Central de Relatórios Executivos</span>
                <span className="bg-sky-50 border border-sky-100 text-yinmn text-[10px] font-black px-2 py-0.5 rounded-full uppercase">PDF PRO</span>
              </h2>
              <p className="text-xs text-slate-500">Personalize os filtros e visualize o PDF antes de exportar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-yinmn hover:bg-sky-50 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body split in side-by-side view */}
        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
          
          {/* Left Pane - Report Settings Form */}
          <div className="w-full md:w-[360px] bg-white border-r border-sky-100 p-6 overflow-y-auto space-y-6 shrink-0">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                Tipo do Relatório
              </label>
              <div className="space-y-2">
                {types.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setReportType(t.id)}
                    className={`w-full p-3.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col ${
                      reportType === t.id 
                        ? "bg-sky-50 border-yinmn text-oxford ring-1 ring-sky-100" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-sky-50/60 hover:border-sky-200"
                    }`}
                  >
                    <span className="text-xs font-extrabold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${reportType === t.id ? "bg-yinmn" : "bg-slate-300"}`} />
                      {t.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 pl-4 leading-normal">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                Período de Análise
              </label>
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)} 
                className="w-full p-3 bg-white border border-sky-100 rounded-lg text-xs font-bold text-oxford outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn cursor-pointer transition-all"
              >
                <option value="15">Próximos 15 dias</option>
                <option value="30">Próximos 30 dias (Padrão)</option>
                <option value="60">Próximos 60 dias</option>
                <option value="90">Próximos 90 dias</option>
                <option value="180">Próximos 6 meses (Semestre)</option>
              </select>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                Configurações Adicionais
              </label>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100 transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={includeDetails} 
                    onChange={e => setIncludeDetails(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-yinmn focus:ring-yinmn cursor-pointer" 
                  />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-oxford">Detalhar Cadastros</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Anexar listagens detalhadas</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100 transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={includeAlerts} 
                    onChange={e => setIncludeAlerts(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-yinmn focus:ring-yinmn cursor-pointer" 
                  />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-oxford">Destacar Alertas</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mostrar avisos de conformidade</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100 transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={includeActions} 
                    onChange={e => setIncludeActions(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-yinmn focus:ring-yinmn cursor-pointer" 
                  />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-oxford">Planos de Ação</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Propor soluções preventivas recomendadas</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading} 
                className="w-full p-4 bg-yinmn hover:bg-cadet disabled:bg-sky-300 text-white rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-100 active:scale-[0.98] cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Gerando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Baixar Relatório (PDF)</span>
                  </>
                )}
              </button>

              <button 
                onClick={handleCopyText} 
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiado!" : "Copiar Texto Puro"}</span>
              </button>
            </div>
          </div>

          {/* Right Pane - Beautiful PDF Live Document Preview (styled as standard A4 page) */}
          <div className="flex-1 bg-slate-50 p-5 sm:p-6 overflow-y-auto flex justify-center">
            <div className="w-full max-w-[794px] min-h-[1123px]">
              
              {/* Actual paper canvas element targeting html2canvas */}
              <div 
                ref={previewRef}
                id="report-pdf-content"
                className="bg-white border border-sky-100 rounded-xl shadow-[0_12px_40px_rgba(16,42,67,0.08)] p-8 sm:p-10 font-sans text-slate-800 space-y-6 select-none"
                style={{ width: "100%", minHeight: "1050px" }}
              >
                {/* PDF Header Block */}
                <div className="flex items-start justify-between border-b-2 border-yinmn pb-5 mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-yinmn flex items-center justify-center">
                        <span className="text-white font-black text-[9px]">C</span>
                      </div>
                      <span className="text-lg font-black tracking-tight text-oxford">CTM RH BRASIL</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                      Centro de Treinamento Missionário &bull; Recursos Humanos
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block px-3.5 py-1 bg-sky-50 border border-sky-100 text-yinmn font-black text-[10px] uppercase tracking-wider rounded-lg">
                      {reportType === "geral" ? "Geral de RH" : types.find(t => t.id === reportType)?.label || "Relatório"}
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold block mt-1 uppercase">
                      Emitido em: {formatarDataBR(getToday())}
                    </p>
                  </div>
                </div>

                {/* Sub-Header Metadata Information */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-sky-50/40 border border-sky-100 rounded-xl text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Período de Foco</span>
                    <span className="text-oxford font-extrabold">{periodDays} Dias Futuros</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Metodologia</span>
                    <span className="text-oxford font-extrabold">Análise Preditiva</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Capacidade</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      Ativa
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Qualidade Dados</span>
                    <span className="text-yinmn font-extrabold">{dataQualityPercent}%</span>
                  </div>
                </div>

                {/* Section 1: Executive KPI Panel */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-oxford uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Layers className="w-3.5 h-3.5 text-yinmn" />
                    <span>Indicadores Consolidados de RH</span>
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3.5">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Funcionários Ativos</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-black text-oxford">{ativos.length}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">colaboradores</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admissões Futuras</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-black text-oxford">{aComecar.length}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">a iniciar</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contratos Ativos</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-black text-oxford">{ativos.length}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">em vigência</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Custom Document Body depending on Report Type Selection */}
                <div className="space-y-4">
                  
                  {/* GENERAL / EXECUTIVE REPORT */}
                  {(reportType === "geral" || reportType === "executivo") && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-oxford uppercase tracking-widest">Painel do Resumo de Atividades</h4>
                      <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                        <p>&bull; <strong>Status Operacional</strong>: A equipe de Funcionários conta com <strong>{ativos.length}</strong> profissionais lecionando atualmente, cobrindo múltiplos turnos e zonas administrativas.</p>
                        <p>&bull; <strong>Vencimento de Contratos</strong>: Identificamos <strong>{contratosExpirando.length}</strong> contratos que demandam atenção ou renovação dentro do período de {periodDays} dias.</p>
                        <p>&bull; <strong>Conformidade Geral</strong>: O nível de integridade dos registros cadastrais está em <strong>{dataQualityPercent}%</strong> de preenchimento. {totalActualIssues > 0 && `Existem ${totalActualIssues} pendências menores de dados.`}</p>
                        <p>&bull; <strong>Direito a Férias</strong>: Um total de <strong>{feriasAptas.length}</strong> instrutores já completaram o ciclo aquisitivo regular de 12 meses e estão elegíveis para gozo de descanso.</p>
                      </div>
                    </div>
                  )}

                  {/* VACATIONS REPORT */}
                  {reportType === "ferias" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <h4 className="text-xs font-bold text-oxford uppercase tracking-widest">Análise de Férias e Elegibilidade</h4>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          Acumulado: {feriasCriticas.length} Críticos
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Aptos (Mais de 12 Meses)</span>
                          <span className="text-lg font-black text-oxford mt-1 block">{feriasAptas.length} colaboradores</span>
                        </div>
                        <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                          <span className="text-[10px] text-rose-600 font-bold block uppercase tracking-wider">Críticos (Mais de 18 Meses)</span>
                          <span className="text-lg font-black text-rose-700 mt-1 block">{feriasCriticas.length} acumulados</span>
                        </div>
                      </div>

                      {includeDetails && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Colaboradores Elegíveis / Acumulados</p>
                          <div className="overflow-hidden border border-slate-150 rounded-xl text-[11px]">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-150">
                                  <th className="p-2 pl-3">Instrutor</th>
                                  <th className="p-2">Admissão</th>
                                  <th className="p-2">Meses de Serviço</th>
                                  <th className="p-2 pr-3 text-right">Férias Marcadas</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {ativos.slice(0, 6).map((emp, i) => {
                                  const meses = emp.dataAdmissao 
                                    ? Math.floor(calcularDiasRestantes(emp.dataAdmissao) / -30) 
                                    : 0;
                                  return (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                      <td className="p-2 pl-3 font-extrabold text-oxford">{emp.nome}</td>
                                      <td className="p-2 font-mono text-slate-500">{formatarDataBR(emp.dataAdmissao)}</td>
                                      <td className="p-2 text-slate-500">{meses} meses</td>
                                      <td className="p-2 pr-3 text-right">
                                        <span className={`inline-block px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                                          emp.feriasMarcadas ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                        }`}>
                                          {emp.feriasMarcadas ? "Marcadas" : "Não agendadas"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTRACTS REPORT */}
                  {reportType === "contratos" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <h4 className="text-xs font-bold text-oxford uppercase tracking-widest">Renovação e Término de Contrato</h4>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Expirando: {contratosExpirando.length} no período
                        </span>
                      </div>

                      {contratosExpirando.length > 0 ? (
                        <div className="p-3 bg-amber-50/45 rounded-xl border border-amber-150 flex gap-3">
                          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-extrabold text-amber-900">Atenção com prazos iminentes</p>
                            <p className="text-amber-800/80 mt-0.5">Existem {contratosExpirando.length} instrutores ativos cujos termos finalizam em menos de {periodDays} dias.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50/45 rounded-xl border border-emerald-150 flex gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-extrabold text-emerald-900">Nenhum vencimento detectado</p>
                            <p className="text-emerald-800/80 mt-0.5">Todos os contratos ativos estão estáveis para a janela de {periodDays} dias.</p>
                          </div>
                        </div>
                      )}

                      {includeDetails && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cronograma de Prazos do Período</p>
                          <div className="overflow-hidden border border-slate-150 rounded-xl text-[11px]">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-150">
                                  <th className="p-2 pl-3">Instrutor</th>
                                  <th className="p-2">Cargo</th>
                                  <th className="p-2">Data de Término</th>
                                  <th className="p-2 text-center">Dias Restantes</th>
                                  <th className="p-2 pr-3 text-right">Risco</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {ativos.slice(0, 7).map((emp, i) => {
                                  const dias = emp.dataTerminoReal ? calcularDiasRestantes(emp.dataTerminoReal) : null;
                                  const riscoVal = calcularRisco(emp);
                                  return (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                      <td className="p-2 pl-3 font-extrabold text-oxford">{emp.nome}</td>
                                      <td className="p-2 text-slate-500">{emp.cargo || "Sem cargo"}</td>
                                      <td className="p-2 font-mono text-slate-500">{formatarDataBR(emp.dataTerminoReal)}</td>
                                      <td className="p-2 text-center font-bold text-slate-700">
                                        {dias !== null ? `${dias} d` : "-"}
                                      </td>
                                      <td className="p-2 pr-3 text-right">
                                        <span className={`inline-block px-2 py-0.5 rounded font-black text-[9px] ${
                                          riscoVal === "Crítico" ? "bg-rose-100 text-rose-700" :
                                          riscoVal === "Alto" ? "bg-amber-100 text-amber-700" :
                                          riscoVal === "Médio" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                                          riscoVal === "Baixo" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"
                                        }`}>
                                          {riscoVal}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CADASTRAL PENDENCIES REPORT */}
                  {reportType === "pendencias" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <h4 className="text-xs font-bold text-oxford uppercase tracking-widest">Saneamento Cadastral Global</h4>
                        <span className="text-[10px] font-black text-yinmn bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                          Conformidade Cadastral: {dataQualityPercent}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Perfis</span>
                          <span className="text-base font-black text-oxford mt-0.5 block">{totalEmployees}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Com Lacunas</span>
                          <span className="text-base font-black text-amber-600 mt-0.5 block">{employeesWithIssues.length}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Pendências Totais</span>
                          <span className="text-base font-black text-yinmn mt-0.5 block">{totalActualIssues}</span>
                        </div>
                      </div>

                      {includeDetails && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Perfis com Campos Omitidos</p>
                          <div className="overflow-hidden border border-slate-150 rounded-xl text-[11px]">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-150">
                                  <th className="p-2 pl-3">Colaborador</th>
                                  <th className="p-2">Cargo</th>
                                  <th className="p-2">Campos Incompletos</th>
                                  <th className="p-2 pr-3 text-right">Gravidade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {employeesWithIssues.slice(0, 6).map((emp, i) => {
                                  const labels = emp.issues.map(iss => iss.field).join(", ");
                                  const severities = emp.issues.map(iss => iss.severity);
                                  const isCritical = severities.includes("Crítica");
                                  return (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                      <td className="p-2 pl-3 font-extrabold text-oxford">{emp.nome}</td>
                                      <td className="p-2 text-slate-500">{emp.cargo || "Sem cargo"}</td>
                                      <td className="p-2 text-rose-600 font-medium max-w-[200px] truncate">{labels}</td>
                                      <td className="p-2 pr-3 text-right">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                          isCritical ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                                        }`}>
                                          {isCritical ? "Crítica" : "Alta / Média"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTRACTUAL RISKS HEATMAP REPORT */}
                  {reportType === "riscos" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <h4 className="text-xs font-bold text-oxford uppercase tracking-widest">Matriz de Risco de Contratos</h4>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          Severos: {ativos.filter(e => {
                            const r = calcularRisco(e);
                            return r === "Crítico" || r === "Alto";
                          }).length} ativos
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5 text-center">
                        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                          <span className="text-[9px] text-rose-700 font-black block uppercase">Crítico</span>
                          <span className="text-lg font-black text-rose-900 mt-0.5">
                            {ativos.filter(e => calcularRisco(e) === "Crítico").length}
                          </span>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                          <span className="text-[9px] text-amber-700 font-black block uppercase">Alto</span>
                          <span className="text-lg font-black text-amber-900 mt-0.5">
                            {ativos.filter(e => calcularRisco(e) === "Alto").length}
                          </span>
                        </div>
                        <div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-100">
                          <span className="text-[9px] text-yellow-700 font-black block uppercase">Médio</span>
                          <span className="text-lg font-black text-yellow-900 mt-0.5">
                            {ativos.filter(e => calcularRisco(e) === "Médio").length}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                          <span className="text-[9px] text-slate-500 font-black block uppercase">Baixo / Sem</span>
                          <span className="text-lg font-black text-slate-700 mt-0.5">
                            {ativos.filter(e => {
                              const r = calcularRisco(e);
                              return r === "Baixo" || r === "Sem risco";
                            }).length}
                          </span>
                        </div>
                      </div>

                      {includeDetails && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Funcionários Monitorados por Risco</p>
                          <div className="overflow-hidden border border-slate-150 rounded-xl text-[11px]">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-150">
                                  <th className="p-2 pl-3">Instrutor</th>
                                  <th className="p-2">Idiomas</th>
                                  <th className="p-2">Zona de Atuação</th>
                                  <th className="p-2 pr-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {ativos.slice(0, 6).map((emp, i) => {
                                  const r = calcularRisco(emp);
                                  return (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                      <td className="p-2 pl-3 font-extrabold text-oxford">{emp.nome}</td>
                                      <td className="p-2 text-slate-500 font-medium">{emp.idiomas?.join(", ") || "Nenhum"}</td>
                                      <td className="p-2 text-slate-500">{emp.zona || "Não definida"}</td>
                                      <td className="p-2 pr-3 text-right">
                                        <span className={`inline-block px-1.5 py-0.5 rounded font-black text-[9px] ${
                                          r === "Crítico" ? "bg-rose-100 text-rose-700" :
                                          r === "Alto" ? "bg-amber-100 text-amber-700" :
                                          r === "Médio" ? "bg-yellow-50 text-yellow-700" : "bg-slate-50 text-slate-500"
                                        }`}>
                                          {r}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Section 3: Critical System Alerts Block */}
                {includeAlerts && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-oxford uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Alertas de Inconformidade</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {contratosExpirando.slice(0, 2).map((emp, i) => (
                        <div key={i} className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-oxford">Expiração contratual iminente: {emp.nome}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              O contrato expira em {emp.dataTerminoReal ? calcularDiasRestantes(emp.dataTerminoReal) : ""} dias. Inicie a renovação de imediato.
                            </p>
                          </div>
                        </div>
                      ))}

                      {feriasCriticas.slice(0, 1).map((emp, i) => (
                        <div key={i} className="p-3 bg-amber-50/60 rounded-xl border border-amber-150 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-oxford">Período aquisitivo de férias crítico: {emp.nome}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Mais de 18 meses ativos no CTM sem férias gozadas ou programadas no controle operacional.
                            </p>
                          </div>
                        </div>
                      ))}

                      {employeesWithIssues.slice(0, 1).map((emp, i) => (
                        <div key={i} className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-start gap-2.5">
                          <BadgeInfo className="w-4 h-4 text-yinmn shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-oxford">Perfil cadastral incompleto: {emp.nome}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Estão ausentes {emp.issues.length} campos obrigatórios essenciais para relatórios.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Recommended Corrective Plans Block */}
                {includeActions && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-oxford uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Plano de Ações Recomendado</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex gap-2">
                        <span className="text-slate-400 font-extrabold text-xs">01</span>
                        <div>
                          <p className="font-extrabold text-oxford">Fidelizar Contratos em Alerta</p>
                          <p className="text-[10px] text-slate-500 mt-1">Negociar aditivos contratuais dos {contratosExpirando.length} instrutores em janela de alerta de expiração.</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex gap-2">
                        <span className="text-slate-400 font-extrabold text-xs">02</span>
                        <div>
                          <p className="font-extrabold text-oxford">Escalar Banco de Férias</p>
                          <p className="text-[10px] text-slate-500 mt-1">Conceder agendamentos de descanso remunerado para os {feriasCriticas.length} perfis em criticidade superior.</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex gap-2">
                        <span className="text-slate-400 font-extrabold text-xs">03</span>
                        <div>
                          <p className="font-extrabold text-oxford">Campanha de Saneamento</p>
                          <p className="text-[10px] text-slate-500 mt-1">Cobrar preenchimento das pendências cadastrais dos {employeesWithIssues.length} Funcionários sinalizados.</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex gap-2">
                        <span className="text-slate-400 font-extrabold text-xs">04</span>
                        <div>
                          <p className="font-extrabold text-oxford">Previsão de Cobertura</p>
                          <p className="text-[10px] text-slate-500 mt-1">Garantir substitutos ativos para as janelas de férias aprovadas para evitar sobressaltos operacionais.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Signatures Footer */}
                <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-150 text-[10px] text-slate-400">
                  <div className="border-t border-slate-200 pt-3 text-center">
                    <p className="font-black uppercase tracking-wider text-oxford">COORDENAÇÃO DE RECURSOS HUMANOS</p>
                    <p className="font-semibold text-slate-400 mt-0.5">Responsável pela Geração de Informação</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-center">
                    <p className="font-black uppercase tracking-wider text-oxford">DIREÇÃO GERAL DO CTM BRASIL</p>
                    <p className="font-semibold text-slate-400 mt-0.5">Auditoria e Governança Operacional</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
