/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee, RiskLevel } from "../types/rh";
import { calcularDiasRestantes, obterMesExtenso } from "./dateUtils";
import { calcularRisco, identificarPendencias } from "./riskUtils";
import { calcularQualidadeDados } from "./dataQualityUtils";

export type GroupCount = {
  name: string;
  count: number;
  percentage: number;
};

/**
 * Agrupa funcionários ativos por idioma.
 */
export function agruparPorIdioma(funcionarios: RhEmployee[]): GroupCount[] {
  const counts: Record<string, number> = {};
  let totalActives = 0;

  funcionarios.forEach((emp) => {
    if (emp.statusFuncionario === "Ativo") {
      const idiomas = emp.idiomas && emp.idiomas.length > 0 ? emp.idiomas : ["Não cadastrado"];
      idiomas.forEach((lang) => {
        const cleaned = lang.trim();
        if (cleaned !== "") {
          counts[cleaned] = (counts[cleaned] || 0) + 1;
          totalActives++;
        }
      });
    }
  });

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalActives > 0 ? Math.round((count / totalActives) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Agrupa funcionários ativos por zona.
 */
export function agruparPorZona(funcionarios: RhEmployee[]): GroupCount[] {
  const counts: Record<string, number> = {};
  let totalActives = 0;

  funcionarios.forEach((emp) => {
    if (emp.statusFuncionario === "Ativo") {
      const zona = emp.zona && emp.zona.trim() !== "" ? emp.zona : "Não cadastrada";
      counts[zona] = (counts[zona] || 0) + 1;
      totalActives++;
    }
  });

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalActives > 0 ? Math.round((count / totalActives) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Agrupa funcionários ativos por turno.
 */
export function agruparPorTurno(funcionarios: RhEmployee[]): GroupCount[] {
  const counts: Record<string, number> = {};
  let totalActives = 0;

  funcionarios.forEach((emp) => {
    if (emp.statusFuncionario === "Ativo") {
      const turno = emp.turno && emp.turno.trim() !== "" ? emp.turno : "Não cadastrado";
      counts[turno] = (counts[turno] || 0) + 1;
      totalActives++;
    }
  });

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalActives > 0 ? Math.round((count / totalActives) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calcula as saídas futuras agrupadas por mês.
 */
export function calcularSaidasPorMes(funcionarios: RhEmployee[]): { mes: string; count: number }[] {
  const hj = new Date();
  const counts: Record<string, number> = {};

  funcionarios.forEach((emp) => {
    // Apenas quem está ativo ou a começar e possui data de término futura
    if (emp.statusFuncionario !== "Encerrado" && emp.dataTerminoReal) {
      const dias = calcularDiasRestantes(emp.dataTerminoReal);
      if (dias !== null && dias >= 0) {
        const mes = obterMesExtenso(emp.dataTerminoReal);
        if (mes) {
          const ano = emp.dataTerminoReal.split("-")[0];
          const chave = `${mes}/${ano}`;
          counts[chave] = (counts[chave] || 0) + 1;
        }
      }
    }
  });

  // Ordena os meses. Para protótipo simples, listamos em ordem cronológica dos próximos meses
  // Vamos criar um mapeamento dos meses para ordenar
  const ordemMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return Object.entries(counts)
    .map(([name, count]) => {
      const [mes, ano] = name.split("/");
      const mesIdx = ordemMeses.indexOf(mes);
      return { name, count, mesIdx, ano: parseInt(ano) };
    })
    .sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mesIdx - b.mesIdx;
    })
    .map((item) => ({
      mes: item.name,
      count: item.count,
    }));
}

/**
 * Gera as frases automáticas para o Resumo Executivo.
 */
export function gerarResumoExecutivo(funcionarios: RhEmployee[]) {
  const total = funcionarios.length;
  const ativos = funcionarios.filter((e) => e.statusFuncionario === "Ativo").length;
  const instrutoresAtivos = funcionarios.filter(
    (e) => e.statusFuncionario === "Ativo" && e.cargo?.toLowerCase().includes("instrutor")
  ).length;

  // Sairão nos próximos 30 dias
  const saem30Dias = funcionarios.filter((e) => {
    if (e.statusFuncionario === "Encerrado" || !e.dataTerminoReal) return false;
    const dias = calcularDiasRestantes(e.dataTerminoReal);
    return dias !== null && dias >= 0 && dias <= 30;
  }).length;

  // Mês com maior impacto
  const saidasMes = calcularSaidasPorMes(funcionarios);
  let mesMaisImpacto = "Nenhum mês crítico";
  let maxSaidas = 0;
  saidasMes.forEach((s) => {
    if (s.count > maxSaidas) {
      maxSaidas = s.count;
      mesMaisImpacto = s.mes;
    }
  });

  // Idioma com maior risco: onde há mais contratos críticos ou saídas nos próximos 90 dias
  const riscosIdioma: Record<string, number> = {};
  funcionarios.forEach((emp) => {
    if (emp.statusFuncionario === "Ativo" && emp.idiomas) {
      const risco = calcularRisco(emp);
      const peso = risco === "Crítico" ? 3 : risco === "Alto" ? 2 : risco === "Médio" ? 1 : 0;
      if (peso > 0) {
        emp.idiomas.forEach((lang) => {
          const l = lang.trim();
          if (l) {
            riscosIdioma[l] = (riscosIdioma[l] || 0) + peso;
          }
        });
      }
    }
  });

  let idiomaMaiorRisco = "Nenhum";
  let maxRiscoPeso = 0;
  Object.entries(riscosIdioma).forEach(([lang, peso]) => {
    if (peso > maxRiscoPeso) {
      maxRiscoPeso = peso;
      idiomaMaiorRisco = lang;
    }
  });

  const dStats = calcularQualidadeDados(funcionarios);

  return {
    totalCarregados: total,
    ativos,
    instrutoresAtivos,
    saem30Dias,
    mesMaisImpacto,
    idiomaMaiorRisco,
    comPendencia: dStats.comPendencia,
    semDataTermino: dStats.semDataTermino,
    semIdioma: dStats.semIdioma,
  };
}

/**
 * Gera recomendações acionáveis com base na análise dos dados.
 */
export function gerarRecomendacoes(funcionarios: RhEmployee[]) {
  const recs: { id: string; title: string; text: string; severity: "crítica" | "alta" | "média" | "baixa" }[] = [];
  const resumo = gerarResumoExecutivo(funcionarios);

  if (resumo.semDataTermino > 0) {
    recs.push({
      id: "rec-termino",
      title: "Corrigir cadastros sem data de término",
      text: `Existem ${resumo.semDataTermino} funcionários sem data de término real cadastrada. Isso impede que os relatórios de saídas futuras e riscos contratuais sejam 100% precisos.`,
      severity: "crítica",
    });
  }

  if (resumo.semIdioma > 0) {
    recs.push({
      id: "rec-idioma-cad",
      title: "Revisar instrutores sem idioma",
      text: `Identificados ${resumo.semIdioma} registros de funcionários ativos sem idiomas associados no cadastro.`,
      severity: "alta",
    });
  }

  if (resumo.saem30Dias > 0) {
    recs.push({
      id: "rec-saidas-prox",
      title: "Planejar reposição urgente de pessoal",
      text: `Temos ${resumo.saem30Dias} funcionários ou instrutores com término de contrato programado para os próximos 30 dias. É essencial iniciar o processo de transição.`,
      severity: "alta",
    });
  }

  if (resumo.idiomaMaiorRisco !== "Nenhum" && resumo.idiomaMaiorRisco !== "") {
    recs.push({
      id: "rec-idioma-risco",
      title: `Iniciar reposição para o idioma ${resumo.idiomaMaiorRisco}`,
      text: `O idioma ${resumo.idiomaMaiorRisco} foi identificado como o de maior risco de cobertura devido ao vencimento iminente de contratos dos instrutores ativos.`,
      severity: "alta",
    });
  }

  // Verificar se há contratos em risco crítico geral
  const contratosCriticos = funcionarios.filter((e) => calcularRisco(e) === "Crítico").length;
  if (contratosCriticos > 0) {
    recs.push({
      id: "rec-contratos-criticos",
      title: "Acompanhar contratos críticos",
      text: `Há ${contratosCriticos} contratos em nível de risco Crítico (menos de 15 dias para o término). Avaliar prorrogações ou transferências com urgência.`,
      severity: "crítica",
    });
  }

  // Recomendações genéricas de integridade de dados se necessário
  const dStats = calcularQualidadeDados(funcionarios);
  if (dStats.semZona > 0 || dStats.semTurno > 0) {
    recs.push({
      id: "rec-zona-turno",
      title: "Validar informações de zona e turno",
      text: `Há ${dStats.semZona + dStats.semTurno} cadastros com lacunas em informações de zona de atuação ou turno de trabalho.`,
      severity: "média",
    });
  }

  // Adiciona pelo menos recomendações básicas se o sistema estiver limpo
  if (recs.length === 0) {
    recs.push({
      id: "rec-clean",
      title: "Dados em conformidade",
      text: "Excelente! Todos os cadastros ativos estão com dados consistentes e não há riscos críticos identificados nos próximos 30 dias.",
      severity: "baixa",
    });
  }

  return recs;
}
