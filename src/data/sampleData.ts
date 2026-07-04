/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee } from "../types/rh";

/**
 * Dados fictícios extremamente realistas do CTM Brasil (Centro de Treinamento Missionário)
 * para demonstrar os fluxos de riscos, pendências cadastrais, controle de férias e planejamento de reposições.
 * A data de referência atual do sistema é 3 de Julho de 2026.
 */
export const SAMPLE_EMPLOYEES: RhEmployee[] = [
  // 1. Críticos (Término em até 15 dias: 03/Jul/2026 a 18/Jul/2026)
  {
    recordId: "rec-01",
    idFuncionario: "CTM-2024-009",
    nome: "Carlos Augusto de Souza",
    cargo: "Instrutor de Espanhol",
    zona: "Zona Sul",
    turno: "Tarde",
    dataAdmissao: "2024-01-15", // ~2.5 anos (Férias críticas - Caso 6)
    dataTerminoReal: "2026-07-12", // 9 dias restantes (Crítico)
    statusFuncionario: "Ativo",
    idiomas: ["Espanhol"],
    emailCorporativo: "carlos.souza@ctm.org.br",
    linkZoom: "https://zoom.us/j/9082345167",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-02",
    idFuncionario: "CTM-2024-041",
    nome: "Yuki Tanaka",
    cargo: "Instrutor de Japonês",
    zona: "Zona Leste",
    turno: "Manhã",
    dataAdmissao: "2024-03-10", // ~2.3 anos (Férias concluídas)
    dataTerminoReal: "2026-07-16", // 13 dias restantes (Crítico)
    statusFuncionario: "Ativo",
    idiomas: ["Japonês", "Inglês"],
    emailCorporativo: "yuki.tanaka@ctm.org.br",
    linkZoom: "https://zoom.us/j/8172649032",
    feriasMarcadas: false,
    feriasConcluidas: true,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: [
      {
        dataInicio: "2025-05-01",
        dataFim: "2025-05-30",
        dias: 30
      }
    ]
  },
  {
    recordId: "rec-03",
    idFuncionario: "CTM-2025-012",
    nome: "Marcos Vinícius Silva",
    cargo: "Instrutor de Português",
    zona: "Zona Oeste",
    turno: "Tarde",
    dataAdmissao: "2025-01-10", // ~1.5 anos (Férias em andamento)
    dataTerminoReal: "2026-07-08", // 5 dias restantes (Crítico)
    statusFuncionario: "Ativo",
    idiomas: ["Português para Estrangeiros"],
    emailCorporativo: "marcos.silva@ctm.org.br",
    linkZoom: "https://zoom.us/j/9281746251",
    feriasMarcadas: true,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: [
      {
        dataInicio: "2026-07-01",
        dataFim: "2026-07-31",
        dias: 30
      }
    ]
  },

  // 2. Altos (Término em 16 a 30 dias: 19/Jul/2026 a 02/Ago/2026)
  {
    recordId: "rec-04",
    idFuncionario: "CTM-2024-082",
    nome: "Sarah Jane Williams",
    cargo: "Instrutor de Inglês",
    zona: "Zona Norte",
    turno: "Tarde",
    dataAdmissao: "2024-08-01", // ~1.9 anos (Férias críticas - Caso 6)
    dataTerminoReal: "2026-07-28", // 25 dias restantes (Alto)
    statusFuncionario: "Ativo",
    idiomas: ["Inglês"],
    emailCorporativo: "sarah.williams@ctm.org.br",
    linkZoom: "https://zoom.us/j/9348126574",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-05",
    idFuncionario: "CTM-2025-004",
    nome: "John Doe",
    cargo: "Instrutor de Inglês",
    zona: "Zona Norte",
    turno: "Manhã",
    dataAdmissao: "2025-02-15", // ~1.4 anos (Apto para férias - Caso 2)
    dataTerminoReal: "2026-07-22", // 19 dias restantes (Alto)
    statusFuncionario: "Ativo",
    idiomas: ["Inglês"],
    emailCorporativo: "john.doe@ctm.org.br",
    linkZoom: "https://zoom.us/j/9457312045",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },

  // 3. Médios (Término em 31 a 60 dias: 03/Ago/2026 a 01/Set/2026)
  {
    recordId: "rec-06",
    idFuncionario: "CTM-2024-112",
    nome: "Pierre Dubois",
    cargo: "Instrutor de Francês",
    zona: "Zona Oeste",
    turno: "Noite",
    dataAdmissao: "2024-09-15", // ~1.8 anos (Férias marcadas)
    dataTerminoReal: "2026-08-15", // 43 dias restantes (Médio)
    statusFuncionario: "Ativo",
    idiomas: ["Francês"],
    emailCorporativo: "pierre.dubois@ctm.org.br",
    linkZoom: "https://zoom.us/j/9812734651",
    feriasMarcadas: true,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: [
      {
        dataInicio: "2026-08-10",
        dataFim: "2026-09-09",
        dias: 30
      }
    ]
  },
  {
    recordId: "rec-07",
    idFuncionario: "CTM-2025-015",
    nome: "Mariana de Oliveira Costa",
    cargo: "Instrutor de Espanhol",
    zona: "Zona Sul",
    turno: "Manhã",
    dataAdmissao: "2025-03-01", // ~1.3 anos (Apto para férias - Caso 2)
    dataTerminoReal: "2026-08-28", // 56 dias restantes (Médio)
    statusFuncionario: "Ativo",
    idiomas: ["Espanhol", "Português"],
    emailCorporativo: "mariana.costa@ctm.org.br",
    linkZoom: "https://zoom.us/j/9761234851",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },

  // 4. Baixos (Término em 61 a 180 dias: 02/Set/2026 a 30/Dez/2026)
  {
    recordId: "rec-08",
    idFuncionario: "CTM-2023-048",
    nome: "Juliana Mendes Alencar",
    cargo: "Supervisor de Ensino",
    zona: "Zona Leste",
    turno: "Tarde",
    dataAdmissao: "2023-05-10", // ~3.1 anos (Férias marcadas - Caso 3)
    dataTerminoReal: "2026-10-15", // ~104 dias (Baixo)
    statusFuncionario: "Ativo",
    idiomas: ["Espanhol", "Inglês"],
    emailCorporativo: "juliana.alencar@ctm.org.br",
    linkZoom: "https://zoom.us/j/9451239851",
    feriasMarcadas: true,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: [
      {
        dataInicio: "2026-07-20",
        dataFim: "2026-08-19",
        dias: 30
      }
    ]
  },
  {
    recordId: "rec-09",
    idFuncionario: "CTM-2025-022",
    nome: "Amelia Smith",
    cargo: "Instrutor de Inglês",
    zona: "Zona Norte",
    turno: "Noite",
    dataAdmissao: "2025-05-15", // ~1.1 anos (Férias divididas em 2 períodos - Caso 4)
    dataTerminoReal: "2026-11-20", // ~140 dias (Baixo)
    statusFuncionario: "Ativo",
    idiomas: ["Inglês"],
    emailCorporativo: "amelia.smith@ctm.org.br",
    linkZoom: "https://zoom.us/j/9671524312",
    feriasMarcadas: true,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: [
      {
        dataInicio: "2026-08-01",
        dataFim: "2026-08-15",
        dias: 15
      },
      {
        dataInicio: "2026-12-20",
        dataFim: "2027-01-03",
        dias: 15
      }
    ]
  },
  {
    recordId: "rec-10",
    idFuncionario: "CTM-2025-030",
    nome: "Alessandro Rossi",
    cargo: "Instrutor de Italiano",
    zona: "Zona Oeste",
    turno: "Noite",
    dataAdmissao: "2025-06-01", // ~1.1 anos (Vendeu 10 dias de férias - Caso 5)
    dataTerminoReal: "2026-12-10", // ~160 dias (Baixo)
    statusFuncionario: "Ativo",
    idiomas: ["Italiano"],
    emailCorporativo: "alessandro.rossi@ctm.org.br",
    linkZoom: "https://zoom.us/j/9012356123",
    feriasMarcadas: true,
    feriasConcluidas: false,
    feriasVendidas: true,
    diasVendidosFerias: 10,
    diasTotaisFerias: 30,
    periodosFerias: [
      {
        dataInicio: "2026-09-10",
        dataFim: "2026-09-30",
        dias: 20
      }
    ]
  },

  // 5. Sem risco / Longo prazo (Mais de 180 dias / Sem saída definida breve)
  {
    recordId: "rec-11",
    idFuncionario: "CTM-2026-001",
    nome: "Fernando Henrique Cardoso Jr",
    cargo: "Coordenador Pedagógico",
    zona: "Administrativo",
    turno: "Manhã",
    dataAdmissao: "2026-01-10", // ~6 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2028-01-10", // Sem risco
    statusFuncionario: "Ativo",
    idiomas: ["Português", "Espanhol", "Inglês"],
    emailCorporativo: "fernando.cardoso@ctm.org.br",
    linkZoom: "https://zoom.us/j/9123485712",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-12",
    idFuncionario: "CTM-2026-015",
    nome: "Amanda Ribeiro Lima",
    cargo: "Instrutor de Espanhol",
    zona: "Zona Sul",
    turno: "Tarde",
    dataAdmissao: "2026-02-01", // ~5 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2027-06-30", // Sem risco
    statusFuncionario: "Ativo",
    idiomas: ["Espanhol"],
    emailCorporativo: "amanda.lima@ctm.org.br",
    linkZoom: "https://zoom.us/j/9563214785",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },

  // 6. Cadastros Incompletos / Com Pendências
  {
    recordId: "rec-13",
    idFuncionario: "CTM-2025-099",
    nome: "Roberto Gimenes",
    cargo: "Instrutor de Espanhol",
    zona: "Zona Sul",
    turno: "Tarde",
    dataAdmissao: "2025-10-01", // ~9 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "", // Sem data de término (Crítica)
    statusFuncionario: "Ativo",
    idiomas: ["Espanhol"],
    emailCorporativo: "roberto.gimenes@ctm.org.br",
    linkZoom: "https://zoom.us/j/9034856123",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-14",
    idFuncionario: "CTM-2025-104",
    nome: "Letícia Alves Santos",
    cargo: "Instrutor de Inglês",
    zona: "Zona Norte",
    turno: "Manhã",
    dataAdmissao: "2025-10-15", // ~8.5 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2026-08-30",
    statusFuncionario: "Ativo",
    idiomas: [], // Sem idiomas cadastrados (Alta)
    emailCorporativo: "leticia.santos@ctm.org.br",
    linkZoom: "https://zoom.us/j/9128374652",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-15",
    idFuncionario: "CTM-2025-108",
    nome: "Paulo Ricardo Meireles",
    cargo: "Instrutor de Português",
    zona: "", // Sem zona cadastrada (Alta)
    turno: "Manhã",
    dataAdmissao: "2025-11-01", // ~8 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2026-09-30",
    statusFuncionario: "Ativo",
    idiomas: ["Português para Estrangeiros"],
    emailCorporativo: "paulo.meireles@ctm.org.br",
    linkZoom: "https://zoom.us/j/9128374921",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-16",
    idFuncionario: "CTM-2025-115",
    nome: "Sonia Regina Toledo",
    cargo: "Instrutor de Mandarim",
    zona: "Zona Leste",
    turno: "", // Sem turno cadastrado (Alta)
    dataAdmissao: "2025-11-15", // ~7.5 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2026-10-30",
    statusFuncionario: "Ativo",
    idiomas: ["Mandarim"],
    emailCorporativo: "sonia.toledo@ctm.org.br",
    linkZoom: "https://zoom.us/j/9238475612",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-17",
    idFuncionario: "", // Sem ID (Crítica)
    nome: "Camila Guimarães Rocha",
    cargo: "Instrutor de Francês",
    zona: "Zona Oeste",
    turno: "Noite",
    dataAdmissao: "2025-12-01", // ~7 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2026-11-15",
    statusFuncionario: "Ativo",
    idiomas: ["Francês"],
    emailCorporativo: "camila.rocha@ctm.org.br",
    linkZoom: "https://zoom.us/j/9348576123",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-18",
    idFuncionario: "CTM-2026-044",
    nome: "Tiago Henrique Martins",
    cargo: "Instrutor de Alemão",
    zona: "Zona Leste",
    turno: "Tarde",
    dataAdmissao: "2026-03-01", // ~4 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2026-12-15",
    statusFuncionario: "Ativo",
    idiomas: ["Alemão"],
    emailCorporativo: "", // Sem e-mail (Média)
    linkZoom: "https://zoom.us/j/9348123764",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-19",
    idFuncionario: "CTM-2026-049",
    nome: "Renata Vasconcellos",
    cargo: "Instrutor de Espanhol",
    zona: "Zona Sul",
    turno: "Noite",
    dataAdmissao: "2026-03-15", // ~3.5 meses (Menos de 1 ano de trabalho - Caso 1)
    dataTerminoReal: "2027-01-30",
    statusFuncionario: "Ativo",
    idiomas: ["Espanhol"],
    emailCorporativo: "renata.v@ctm.org.br",
    linkZoom: "", // Sem Zoom Link (Baixa)
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },

  // 7. A começar
  {
    recordId: "rec-20",
    idFuncionario: "CTM-2026-080",
    nome: "Daniel Jackson",
    cargo: "Instrutor de Coreano",
    zona: "Zona Norte",
    turno: "Manhã",
    dataAdmissao: "2026-08-01", // Começará no futuro
    dataTerminoReal: "2028-08-01",
    statusFuncionario: "A começar",
    idiomas: ["Coreano"],
    emailCorporativo: "daniel.jackson@ctm.org.br",
    linkZoom: "https://zoom.us/j/9451234856",
    feriasMarcadas: false,
    feriasConcluidas: false,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },

  // 8. Encerrados (Ex-funcionários)
  {
    recordId: "rec-21",
    idFuncionario: "CTM-2023-011",
    nome: "Ricardo Dias Fonseca",
    cargo: "Instrutor de Inglês",
    zona: "Zona Norte",
    turno: "Noite",
    dataAdmissao: "2023-02-15",
    dataTerminoReal: "2026-05-30", // Já encerrou
    statusFuncionario: "Encerrado",
    idiomas: ["Inglês"],
    emailCorporativo: "ricardo.fonseca@ctm.org.br",
    linkZoom: "https://zoom.us/j/9124857312",
    feriasMarcadas: false,
    feriasConcluidas: true,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  },
  {
    recordId: "rec-22",
    idFuncionario: "CTM-2024-002",
    nome: "Beatriz Nogueira Cruz",
    cargo: "Instrutor de Espanhol",
    zona: "Zona Sul",
    turno: "Tarde",
    dataAdmissao: "2024-01-10",
    dataTerminoReal: "2026-06-20", // Já encerrou
    statusFuncionario: "Encerrado",
    idiomas: ["Espanhol"],
    emailCorporativo: "beatriz.cruz@ctm.org.br",
    linkZoom: "https://zoom.us/j/9348123746",
    feriasMarcadas: false,
    feriasConcluidas: true,
    feriasVendidas: false,
    diasVendidosFerias: 0,
    diasTotaisFerias: 30,
    periodosFerias: []
  }
];
