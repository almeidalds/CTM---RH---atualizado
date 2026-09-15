/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VacationPeriod = {
  dataInicio: string;
  dataFim: string;
  dias: number;
};

export type RhEmployee = {
  recordId: string;
  idFuncionario: string;
  nome: string;
  cargo: string;
  zona: string;
  turno: string;
  dataAdmissao: string;
  dataTerminoReal: string; // Format: YYYY-MM-DD
  statusFuncionario: string; // "Ativo" | "Encerrado" | "A começar"
  idiomas: string[];
  emailCorporativo: string;
  linkZoom: string;

  feriasMarcadas: boolean;
  feriasConcluidas: boolean;
  feriasVendidas: boolean;
  diasVendidosFerias: number;
  diasTotaisFerias: number;
  periodosFerias: VacationPeriod[];

  // Optional fields for contract renewal metadata (usually stored in a separate table/entity)
  statusRenovacao?: import("./rh").ContractRenewalStatus;
  responsavelAnalise?: string;
  dataLimiteDecisao?: string;
  recomendacaoContrato?: string;
  observacoesContrato?: string;

  pendencias?: import("./rh").DataIssue[];
  direitoAdquirido?: boolean;
  saldoFeriasDisponivel?: number;
};

export type VacationFilters = {
  search: string;
  zona: string;
  turno: string;
  idioma: string;
  statusFerias: string;
  periodoAdmissao: string; // "all" | "menos1ano" | "1ano" | "1ano6meses"
  periodoFerias: string; // "all" | "esteMes" | "proximoMes" | "proximos3meses"
  somenteCriticos: boolean;
  somenteAptos: boolean;
};

export type RiskLevel = "Crítico" | "Alto" | "Médio" | "Baixo" | "Sem risco" | "Cadastro incompleto";

export type DataIssueSeverity = "Crítica" | "Alta" | "Média" | "Baixa";

export type DataIssue = {
  field: string;
  label: string;
  severity: DataIssueSeverity;
};

export type EmployeeFilters = {
  search: string;
  cargo: string;
  zona: string;
  turno: string;
  idioma: string;
  status: string;
  risco: string;
  pendencia: string; // "Com Pendência" | "Sem Pendência" | "Qualquer"
  periodoTermino: string; // "30" | "60" | "90" | "180" | "all"
};

export type LanguageReplacement = {
  idioma: string;
  ativos: number;
  saida30: number;
  saida60: number;
  saida90: number;
  saida180: number;
  coberturaRestante: number; // percentage
  situacao: "Estável" | "Atenção" | "Risco alto" | "Crítico" | "Baixa cobertura";
  recomendacao: string;
};

export type SubstitutionReason =
  | "Férias"
  | "Doença"
  | "Treinamento"
  | "Viagem"
  | "Ausência aprovada"
  | "Término de contrato"
  | "Mudança de turno"
  | "Reposição temporária"
  | "Outro";

export type SubstitutionStatus =
  | "Pendente"
  | "Em análise"
  | "Substituto definido"
  | "Sem substituto"
  | "Em andamento"
  | "Concluída"
  | "Cancelada";

export type Substitution = {
  recordId: string;
  instrutorAusente: string; // Name of absent instructor
  motivo: SubstitutionReason;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  dias: number;
  idioma: string;
  zona: string;
  turno: string;
  substituto: string; // Name of covering instructor or empty
  status: SubstitutionStatus;
  observacoes: string;
};

export type ContractRenewalStatus =
  | "Não iniciado"
  | "Em análise"
  | "Aguardando coordenação"
  | "Aguardando aprovação"
  | "Renovado"
  | "Não renovar"
  | "Encerrado"
  | "Urgente";

export type ContractRenewal = {
  recordId: string; // Matches employee.recordId
  nome: string;
  cargo: string;
  zona: string;
  turno: string;
  dataAdmissao: string;
  dataTerminoReal: string;
  diasRestantes: number | null;
  statusRenovacao: ContractRenewalStatus;
  responsavelAnalise: string;
  dataLimiteDecisao: string;
  recomendacao: string;
  observacoes: string;
};

export type AlertSeverity = "Crítico" | "Alto" | "Médio" | "Baixo" | "Informativo";

export type AlertCategory =
  | "Contrato"
  | "Férias"
  | "Substituição"
  | "Cadastro"
  | "Capacidade"
  | "Operacional";

export type SystemAlertStatus = "Novo" | "Em análise" | "Em andamento" | "Resolvido" | "Ignorado";

export type SystemAlert = {
  recordId: string;
  titulo: string;
  descricao: string;
  categoria: AlertCategory;
  severidade: AlertSeverity;
  funcionarioRelacionado?: string; // Name or ID
  dataCriacao: string; // YYYY-MM-DD
  prazoRecomendado: string; // YYYY-MM-DD
  status: SystemAlertStatus;
  acaoRecomendada: string;
};

export type TimelineEventCategory =
  | "Cadastro"
  | "Contrato"
  | "Férias"
  | "Substituição"
  | "Risco"
  | "Alteração administrativa";

export type TimelineEvent = {
  recordId: string;
  data: string; // YYYY-MM-DD
  tipo: string; // e.g., "Data de admissão", "Mudança de cargo", etc.
  descricao: string;
  responsavel: string;
  status?: string;
  observacoes?: string;
  categoria: TimelineEventCategory;
};


export type AbsenceItem = {
  id?: string;
  nomeFuncionario?: string;
  nome?: string;
  dataInicio: string;
  dataFim: string;
  tipo?: string;
};

export type AppSettings = {
  idiomas: string[];
  cargos: string[];
  zonas: string[];
};
