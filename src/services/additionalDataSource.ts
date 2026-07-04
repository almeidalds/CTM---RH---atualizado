import { getToday, getMonthOffset } from "../utils/dateUtils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee, Substitution, ContractRenewal, SystemAlert, TimelineEvent, SubstitutionReason, SubstitutionStatus, ContractRenewalStatus, SystemAlertStatus } from "../types/rh";
import { formatarDataBR, calcularDiasRestantes } from "../utils/dateUtils";
import { calcularStatusFerias, calcularDiasVendidos, calcularDiasTirados } from "../utils/vacationUtils";

const SUBSTITUTIONS_KEY = "ctm_rh_substitutions";
const TIMELINE_EVENTS_KEY = "ctm_rh_timeline_events";
const ALERT_OVERRIDES_KEY = "ctm_rh_alert_overrides";

/**
 * Inicializa a lista de substituições fictícias
 */
function obterSubstituicoesIniciais(): Substitution[] {
  return [
    {
      recordId: "sub-01",
      instrutorAusente: "Marcos Vinícius Silva",
      motivo: "Férias",
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      dias: 30,
      idioma: "Português para Estrangeiros",
      zona: "Zona Oeste",
      turno: "Tarde",
      substituto: "",
      status: "Sem substituto",
      observacoes: "Férias em andamento iniciadas no dia 01/07. Nenhuma cobertura cadastrada até o momento. Alto risco operacional para a Zona Oeste."
    },
    {
      recordId: "sub-02",
      instrutorAusente: "Juliana Mendes Alencar",
      motivo: "Férias",
      dataInicio: "2026-07-20",
      dataFim: "2026-08-19",
      dias: 30,
      idioma: "Espanhol",
      zona: "Zona Leste",
      turno: "Tarde",
      substituto: "Amanda Ribeiro Lima",
      status: "Substituto definido",
      observacoes: "Amanda Lima foi remanejada temporariamente para apoiar as aulas na Zona Leste durante as férias de Juliana."
    },
    {
      recordId: "sub-03",
      instrutorAusente: "Yuki Tanaka",
      motivo: "Treinamento",
      dataInicio: "2026-07-10",
      dataFim: "2026-07-15",
      dias: 5,
      idioma: "Japonês",
      zona: "Zona Leste",
      turno: "Manhã",
      substituto: "",
      status: "Pendente",
      observacoes: "Participação no simpósio nacional de metodologias ágeis de ensino. Cobertura ainda pendente de validação."
    },
    {
      recordId: "sub-04",
      instrutorAusente: "Pierre Dubois",
      motivo: "Férias",
      dataInicio: "2026-08-10",
      dataFim: "2026-09-09",
      dias: 30,
      idioma: "Francês",
      zona: "Zona Oeste",
      turno: "Noite",
      substituto: "",
      status: "Em análise",
      observacoes: "Análise de viabilidade para contratação temporária ou fusão temporária das turmas noturnas de Francês."
    }
  ];
}

/**
 * Retorna as substituições salvas no localStorage ou as iniciais
 */
export function obterSubstituicoes(): Substitution[] {
  try {
    const stored = localStorage.getItem(SUBSTITUTIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (err) {
    console.error("Erro ao obter substituições do localStorage:", err);
  }
  const iniciais = obterSubstituicoesIniciais();
  salvarSubstituicoes(iniciais);
  return iniciais;
}

/**
 * Salva a lista de substituições no localStorage
 */
export function salvarSubstituicoes(substituicoes: Substitution[]): void {
  try {
    localStorage.setItem(SUBSTITUTIONS_KEY, JSON.stringify(substituicoes));
  } catch (err) {
    console.error("Erro ao salvar substituições:", err);
  }
}

/**
 * Inicializa a timeline padrão de eventos fictícios para os funcionários
 */
function obterTimelineIniciais(): Record<string, TimelineEvent[]> {
  return {
    "rec-01": [
      { recordId: "evt-01-1", data: "2024-01-15", tipo: "Admissão", descricao: "Admissão do instrutor no CTM Brasil.", responsavel: "Robson (Gerente de RH)", categoria: "Cadastro" },
      { recordId: "evt-01-2", data: "2025-01-15", tipo: "Direito Adquirido", descricao: "Aquisição do primeiro período aquisitivo de férias.", responsavel: "Sistema de RH", categoria: "Férias" },
      { recordId: "evt-01-3", data: "2026-01-15", tipo: "Direito Adquirido Crítico", descricao: "Aquisição do segundo período de férias acumulado sem gozo.", responsavel: "Sistema de RH", categoria: "Risco" }
    ],
    "rec-02": [
      { recordId: "evt-02-1", data: "2024-03-10", tipo: "Admissão", descricao: "Contrato firmado com Yuki Tanaka para as turmas de Japonês.", responsavel: "Robson (Gerente de RH)", categoria: "Cadastro" },
      { recordId: "evt-02-2", data: "2025-05-01", tipo: "Férias Concluídas", descricao: "Férias gozadas de 30 dias com sucesso.", responsavel: "Coordenação de Ensino", categoria: "Férias" }
    ],
    "rec-03": [
      { recordId: "evt-03-1", data: "2025-01-10", tipo: "Admissão", descricao: "Admissão para lecionar Português para Estrangeiros.", responsavel: "Letícia (Analista de RH)", categoria: "Cadastro" },
      { recordId: "evt-03-2", data: "2026-07-01", tipo: "Férias Iniciadas", descricao: "Início do período de férias de 30 dias programado.", responsavel: "Sistema de Presença", categoria: "Férias" }
    ],
    "rec-04": [
      { recordId: "evt-04-1", data: "2024-08-01", tipo: "Admissão", descricao: "Início do contrato de Sarah Jane Williams para turmas da tarde.", responsavel: "Robson (RH)", categoria: "Cadastro" }
    ]
  };
}

/**
 * Obtém todos os eventos de timeline adicionados
 */
export function obterTimelineEvents(employeeId: string): TimelineEvent[] {
  let allEvents: Record<string, TimelineEvent[]> = {};
  try {
    const stored = localStorage.getItem(TIMELINE_EVENTS_KEY);
    if (stored) {
      allEvents = JSON.parse(stored);
    } else {
      allEvents = obterTimelineIniciais();
      localStorage.setItem(TIMELINE_EVENTS_KEY, JSON.stringify(allEvents));
    }
  } catch (err) {
    console.error("Erro ao obter timeline:", err);
    allEvents = obterTimelineIniciais();
  }

  const list = allEvents[employeeId] || [];
  
  // Vamos também injetar dinamicamente eventos baseados no cadastro do funcionário
  // para que a timeline pareça sempre rica e correta!
  return list.sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Adiciona um evento de timeline para um funcionário
 */
export function adicionarTimelineEvent(employeeId: string, event: Omit<TimelineEvent, "recordId">): TimelineEvent[] {
  let allEvents: Record<string, TimelineEvent[]> = {};
  try {
    const stored = localStorage.getItem(TIMELINE_EVENTS_KEY);
    if (stored) allEvents = JSON.parse(stored);
  } catch (err) {
    console.error(err);
  }

  if (!allEvents[employeeId]) {
    allEvents[employeeId] = obterTimelineIniciais()[employeeId] || [];
  }

  const novo: TimelineEvent = {
    ...event,
    recordId: `evt-${Date.now()}`
  };

  allEvents[employeeId].push(novo);
  localStorage.setItem(TIMELINE_EVENTS_KEY, JSON.stringify(allEvents));
  return allEvents[employeeId].sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * MÓDULO 3 - Controle de Renovação de Contrato
 * Retorna as informações de contratos de todos os funcionários
 */
export function obterContratos(employees: RhEmployee[]): ContractRenewal[] {
  return employees
    .filter((emp) => emp.statusFuncionario === "Ativo" || emp.statusFuncionario === "A começar")
    .map((emp) => {
      const dias = calcularDiasRestantes(emp.dataTerminoReal);
      
      // Determinar o status de renovação inicial com base nos dias restantes se não houver no perfil
      let status: ContractRenewalStatus = "Não iniciado";
      let responsavel = "RH Pendente";
      let recomendacao = "Avaliar desempenho docente.";
      
      if (!emp.dataTerminoReal) {
        status = "Urgente";
        recomendacao = "Necessário preencher data de término de contrato para avaliar renovação.";
      } else if (dias !== null) {
        if (dias <= 15) {
          status = "Urgente";
          responsavel = "Robson (Gerente)";
          recomendacao = "Crítico: Renovação extremamente urgente para garantir as turmas do instrutor.";
        } else if (dias <= 30) {
          status = "Em análise";
          responsavel = "Letícia (Analista)";
          recomendacao = "Alta prioridade: Realizar levantamento de qualidade e frequência do instrutor.";
        } else if (dias <= 60) {
          status = "Em análise";
          responsavel = "Letícia (Analista)";
          recomendacao = "Prioridade média: Contrato expira em breve, planejar substituição preventiva caso não renove.";
        } else if (dias <= 90) {
          status = "Não iniciado";
          recomendacao = "Revisar proximidade do término de vigência do contrato.";
        }
      }

      // Se o funcionário já tem esses dados persistidos nele, usa eles!
      const statusRenovacao = (emp as any).statusRenovacao as ContractRenewalStatus || status;
      const responsavelAnalise = (emp as any).responsavelAnalise || responsavel;
      const recomendacaoContrato = (emp as any).recomendacaoContrato || recomendacao;
      const observacoesContrato = (emp as any).observacoesContrato || "";

      // Data limite para decisão: Geralmente 30 dias antes do término de contrato, ou hoje se já estiver vencendo
      let dataLimite = "";
      if (emp.dataTerminoReal) {
        const dTermino = new Date(emp.dataTerminoReal);
        dTermino.setDate(dTermino.getDate() - 30);
        dataLimite = dTermino.toISOString().split("T")[0];
      } else {
        dataLimite = getToday();
      }

      const dataLimiteDecisao = (emp as any).dataLimiteDecisao || dataLimite;

      return {
        recordId: emp.recordId,
        nome: emp.nome,
        cargo: emp.cargo,
        zona: emp.zona,
        turno: emp.turno,
        dataAdmissao: emp.dataAdmissao,
        dataTerminoReal: emp.dataTerminoReal,
        diasRestantes: dias,
        statusRenovacao,
        responsavelAnalise,
        dataLimiteDecisao,
        recomendacao: recomendacaoContrato,
        observacoes: observacoesContrato
      };
    });
}

/**
 * MÓDULO 4 - Alertas Automáticos
 * Gera os alertas inteligentes do sistema dinamicamente
 */
export function gerarAlertasSistema(
  employees: RhEmployee[],
  substituicoes: Substitution[]
): SystemAlert[] {
  const alertas: SystemAlert[] = [];
  const hojeStr = getToday();

  // 1. Contratos próximos do vencimento
  employees.forEach((emp) => {
    if (emp.statusFuncionario !== "Ativo") return;
    const dias = calcularDiasRestantes(emp.dataTerminoReal);
    
    if (!emp.dataTerminoReal) {
      alertas.push({
        recordId: `al-cad-missing-${emp.recordId}`,
        titulo: "Data de Término de Contrato Ausente",
        descricao: `O instrutor ${emp.nome} está ativo, mas seu cadastro não possui data de término de contrato.`,
        categoria: "Cadastro",
        severidade: "Crítico",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: hojeStr,
        status: "Novo",
        acaoRecomendada: "Atualizar ficha cadastral inserindo a vigência de contrato."
      });
    } else if (dias !== null) {
      if (dias <= 15) {
        alertas.push({
          recordId: `al-cont-crit-${emp.recordId}`,
          titulo: `Contrato Vencendo em ${dias} Dias`,
          descricao: `O contrato do instrutor ${emp.nome} expira em ${formatarDataBR(emp.dataTerminoReal)}. Renovação urgente.`,
          categoria: "Contrato",
          severidade: "Crítico",
          funcionarioRelacionado: emp.nome,
          dataCriacao: hojeStr,
          prazoRecomendado: emp.dataTerminoReal,
          status: "Novo",
          acaoRecomendada: "Iniciar processo de renovação ou firmar rescisão legal imediatamente."
        });
      } else if (dias <= 30) {
        alertas.push({
          recordId: `al-cont-high-${emp.recordId}`,
          titulo: "Contrato Próximo do Vencimento (30 Dias)",
          descricao: `Vigência do instrutor ${emp.nome} vence em ${dias} dias.`,
          categoria: "Contrato",
          severidade: "Alto",
          funcionarioRelacionado: emp.nome,
          dataCriacao: hojeStr,
          prazoRecomendado: emp.dataTerminoReal,
          status: "Novo",
          acaoRecomendada: "Avaliar qualidade de ensino e providenciar o termo aditivo."
        });
      } else if (dias <= 60) {
        alertas.push({
          recordId: `al-cont-med-${emp.recordId}`,
          titulo: "Contrato sob Avaliação Trimestral",
          descricao: `Vencimento do contrato de ${emp.nome} em ${dias} dias.`,
          categoria: "Contrato",
          severidade: "Médio",
          funcionarioRelacionado: emp.nome,
          dataCriacao: hojeStr,
          prazoRecomendado: emp.dataTerminoReal,
          status: "Novo",
          acaoRecomendada: "Verificar com coordenação de turno a intenção de continuidade contratual."
        });
      }
    }
  });

  // 2. Férias críticas e aptas
  employees.forEach((emp) => {
    if (emp.statusFuncionario !== "Ativo") return;
    const statusFerias = calcularStatusFerias(emp);

    if (statusFerias === "Férias críticas") {
      alertas.push({
        recordId: `al-vac-crit-${emp.recordId}`,
        titulo: "Férias Críticas Acumuladas",
        descricao: `O instrutor ${emp.nome} acumulou mais de 18 meses de trabalho consecutivo sem usufruir de repouso anual remunerado.`,
        categoria: "Férias",
        severidade: "Crítico",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: "2026-08-01",
        status: "Novo",
        acaoRecomendada: "Agendar escala de gozo de férias obrigatória no próximo bimestre."
      });
    } else if (statusFerias === "Apto para férias") {
      alertas.push({
        recordId: `al-vac-apto-${emp.recordId}`,
        titulo: "Direito Adquirido de Férias Disponível",
        descricao: `O instrutor ${emp.nome} atingiu o período aquisitivo de 12 meses e está elegível para gozo.`,
        categoria: "Férias",
        severidade: "Baixo",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: "2026-12-31",
        status: "Novo",
        acaoRecomendada: "Coletar preferência de datas e integrar ao calendário de substituições preventivo."
      });
    }
  });

  // 3. Substituições sem responsável ou pendentes
  substituicoes.forEach((sub) => {
    if (sub.status === "Sem substituto") {
      alertas.push({
        recordId: `al-sub-none-${sub.recordId}`,
        titulo: "Ausência Operacional Sem Substituto Definido",
        descricao: `O instrutor ${sub.instrutorAusente} estará ausente por motivo de ${sub.motivo} (de ${formatarDataBR(sub.dataInicio)} até ${formatarDataBR(sub.dataFim)}) e não há substituto atribuído.`,
        categoria: "Substituição",
        severidade: "Crítico",
        funcionarioRelacionado: sub.instrutorAusente,
        dataCriacao: hojeStr,
        prazoRecomendado: sub.dataInicio,
        status: "Novo",
        acaoRecomendada: "Utilizar o recomendador de substituições e definir um instrutor de cobertura imediatamente."
      });
    } else if (sub.status === "Pendente" || sub.status === "Em análise") {
      alertas.push({
        recordId: `al-sub-pend-${sub.recordId}`,
        titulo: "Processo de Cobertura Docente Pendente",
        descricao: `A escala de substituição para a ausência de ${sub.instrutorAusente} (${sub.motivo}) está sob análise.`,
        categoria: "Substituição",
        severidade: "Médio",
        funcionarioRelacionado: sub.instrutorAusente,
        dataCriacao: hojeStr,
        prazoRecomendado: sub.dataInicio,
        status: "Novo",
        acaoRecomendada: "Aprovar ou atribuir o instrutor de cobertura sugerido no painel de reposição."
      });
    }
  });

  // 4. Cadastros incompletos (dados ausentes)
  employees.forEach((emp) => {
    if (emp.statusFuncionario !== "Ativo") return;
    
    if (!emp.idFuncionario) {
      alertas.push({
        recordId: `al-cad-id-${emp.recordId}`,
        titulo: "Cadastro Crítico: ID Funcional Ausente",
        descricao: `O registro de ${emp.nome} está ativo no sistema sem código ID Funcional associado.`,
        categoria: "Cadastro",
        severidade: "Crítico",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: hojeStr,
        status: "Novo",
        acaoRecomendada: "Preencher a matrícula corporativa oficial do CTM para saneamento cadastral."
      });
    }
    if (!emp.zona) {
      alertas.push({
        recordId: `al-cad-zona-${emp.recordId}`,
        titulo: "Zona Operacional Não Definida",
        descricao: `O instrutor ${emp.nome} não possui zona de atuação atribuída.`,
        categoria: "Cadastro",
        severidade: "Alto",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: "2026-07-15",
        status: "Novo",
        acaoRecomendada: "Atribuir a zona de lotação correta (Sul, Norte, Leste, Oeste)."
      });
    }
    if (!emp.turno) {
      alertas.push({
        recordId: `al-cad-turno-${emp.recordId}`,
        titulo: "Turno Acadêmico Não Informado",
        descricao: `O instrutor ${emp.nome} não possui turno de atuação vinculado.`,
        categoria: "Cadastro",
        severidade: "Alto",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: "2026-07-15",
        status: "Novo",
        acaoRecomendada: "Especificar se o instrutor ministra aulas no período da Manhã, Tarde ou Noite."
      });
    }
    if (!emp.idiomas || emp.idiomas.length === 0) {
      alertas.push({
        recordId: `al-cad-lang-${emp.recordId}`,
        titulo: "Ausência de Idiomas de Ensino",
        descricao: `Nenhum idioma de ensino cadastrado para o instrutor ${emp.nome}.`,
        categoria: "Cadastro",
        severidade: "Alto",
        funcionarioRelacionado: emp.nome,
        dataCriacao: hojeStr,
        prazoRecomendado: "2026-07-15",
        status: "Novo",
        acaoRecomendada: "Vincular a grade de idiomas (Inglês, Espanhol, Mandarim, etc.) que o instrutor está apto a lecionar."
      });
    }
  });

  // 5. Cobertura crítica de idiomas
  // Vamos analisar os idiomas lecionados pelos instrutores ativos
  const idiomasContagem: Record<string, number> = {};
  employees.forEach((emp) => {
    if (emp.statusFuncionario === "Ativo") {
      emp.idiomas?.forEach((lang) => {
        idiomasContagem[lang] = (idiomasContagem[lang] || 0) + 1;
      });
    }
  });

  Object.entries(idiomasContagem).forEach(([idioma, count]) => {
    if (count <= 1) {
      alertas.push({
        recordId: `al-op-lang-${idioma}`,
        titulo: `Baixa Cobertura Docente: ${idioma}`,
        descricao: `Há apenas ${count} instrutor ativo habilitado para o idioma ${idioma}. Extremo risco de paralisação em caso de ausência ou rescisão.`,
        categoria: "Operacional",
        severidade: "Crítico",
        dataCriacao: hojeStr,
        prazoRecomendado: "2026-08-15",
        status: "Novo",
        acaoRecomendada: "Providenciar recrutamento externo ou capacitação interna preventiva para novas licenças."
      });
    }
  });

  // Aplicar as modificações/overrides salvos pelo usuário no localStorage (Novo, Em análise, Resolvido, etc.)
  let overrides: Record<string, SystemAlertStatus> = {};
  try {
    const stored = localStorage.getItem(ALERT_OVERRIDES_KEY);
    if (stored) overrides = JSON.parse(stored);
  } catch (err) {
    console.error(err);
  }

  return alertas.map((alerta) => {
    if (overrides[alerta.recordId]) {
      return {
        ...alerta,
        status: overrides[alerta.recordId]
      };
    }
    return alerta;
  });
}

/**
 * Atualiza o status de um alerta de sistema
 */
export function salvarStatusAlerta(alertId: string, status: SystemAlertStatus): void {
  let overrides: Record<string, SystemAlertStatus> = {};
  try {
    const stored = localStorage.getItem(ALERT_OVERRIDES_KEY);
    if (stored) overrides = JSON.parse(stored);
  } catch (err) {
    console.error(err);
  }

  overrides[alertId] = status;
  localStorage.setItem(ALERT_OVERRIDES_KEY, JSON.stringify(overrides));
}
