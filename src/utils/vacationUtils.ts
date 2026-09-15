/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee, VacationFilters, VacationPeriod } from "../types/rh";

import { getToday, getCurrentYearMonth, getMonthOffset } from "./dateUtils";
const REF_DATE_STR = getToday();
export const REF_DATE = new Date(REF_DATE_STR);

/**
 * Calcula o tempo de trabalho com base na data de admissão e data de referência do sistema.
 */
export function calcularTempoTrabalho(dataAdmissao: string) {
  if (!dataAdmissao || dataAdmissao.trim() === "") {
    return { anos: 0, meses: 0, totalMeses: 0, texto: "Sem admissão" };
  }
  
  const dateAdm = new Date(dataAdmissao);
  const refDate = REF_DATE;
  
  let years = refDate.getFullYear() - dateAdm.getFullYear();
  let months = refDate.getMonth() - dateAdm.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalMeses = years * 12 + months;
  
  let texto = "";
  if (years > 0) {
    texto += `${years} ${years === 1 ? "ano" : "anos"}`;
    if (months > 0) {
      texto += ` e ${months} ${months === 1 ? "mês" : "meses"}`;
    }
  } else {
    texto += `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  
  return { anos: years, meses: months, totalMeses, texto };
}

/**
 * Verifica se o funcionário é elegível para férias (completou pelo menos 1 ano de trabalho).
 */
export function verificarElegibilidadeFerias(funcionario: RhEmployee): boolean {
  const { totalMeses } = calcularTempoTrabalho(funcionario.dataAdmissao);
  return totalMeses >= 12;
}

/**
 * Calcula o status de férias com base nas regras fornecidas.
 */
export function calcularStatusFerias(funcionario: RhEmployee): string {
  // Se não estiver ativo, não consideramos no fluxo padrão ou indicamos o status correspondente
  if (funcionario.statusFuncionario !== "Ativo") {
    return "Não elegível";
  }

  const { totalMeses } = calcularTempoTrabalho(funcionario.dataAdmissao);
  
  // Menor que 1 ano: "Não elegível"
  if (totalMeses < 12) {
    return "Não elegível";
  }
  
  const refStr = REF_DATE_STR;
  
  // Se as férias já terminaram (todas) ou marcado como feriasConcluidas
  if (funcionario.feriasConcluidas) {
    return "Férias concluídas";
  }
  
  const periodos = funcionario.periodosFerias || [];

  // Verificar se há férias em andamento atualmente (hoje está entre alguma data de início e fim)
  let emAndamento = false;
  let todasConcluidas = periodos.length > 0;
  let temMarcadas = funcionario.feriasMarcadas || periodos.length > 0;
  
  periodos.forEach((period) => {
    if (refStr >= period.dataInicio && refStr <= period.dataFim) {
      emAndamento = true;
    }
    if (refStr < period.dataFim) {
      todasConcluidas = false;
    }
  });
  
  if (emAndamento) {
    return "Férias em andamento";
  }
  
  if (todasConcluidas && periodos.length > 0) {
    return "Férias concluídas";
  }
  
  // Se o funcionário tem férias marcadas
  if (temMarcadas) {
    if (funcionario.feriasVendidas || funcionario.diasVendidosFerias > 0) {
      return "Férias parcialmente vendidas";
    }
    return "Férias marcadas";
  }
  
  // Sem férias marcadas nem tiradas, com 1 ano e 6 meses ou mais: "Férias críticas"
  if (totalMeses >= 18) {
    return "Férias críticas";
  }
  
  // Sem férias marcadas, com mais de 1 ano mas menos de 1 ano e 6 meses: "Apto para férias"
  return "Apto para férias";
}

/**
 * Calcula os dias totais de férias do funcionário.
 */
export function calcularDiasFerias(funcionario: RhEmployee): number {
  return funcionario.diasTotaisFerias || 30;
}

/**
 * Calcula a quantidade de dias de férias vendidos.
 */
export function calcularDiasVendidos(funcionario: RhEmployee): number {
  return funcionario.diasVendidosFerias || 0;
}

/**
 * Calcula a quantidade de dias realmente tirados (ou programados para tirar).
 * tirados = diasTotaisFerias - diasVendidosFerias.
 */
export function calcularDiasTirados(funcionario: RhEmployee): number {
  const totais = calcularDiasFerias(funcionario);
  const vendidos = calcularDiasVendidos(funcionario);
  return Math.max(0, totais - vendidos);
}

/**
 * Calcula a quantidade de períodos em que as férias foram divididas.
 */
export function calcularPeriodosFerias(funcionario: RhEmployee): number {
  return funcionario.periodosFerias?.length || 0;
}

/**
 * Identifica o nível de alerta e cor para exibição visual.
 */
export function identificarAlertaFerias(funcionario: RhEmployee) {
  const status = calcularStatusFerias(funcionario);
  const { totalMeses } = calcularTempoTrabalho(funcionario.dataAdmissao);
  
  if (status === "Férias concluídas") {
    return {
      level: "Concluído",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotColor: "bg-[#00995D]",
      label: "Concluído"
    };
  }
  
  if (status === "Férias em andamento") {
    return {
      level: "Em andamento",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      dotColor: "bg-purple-600",
      label: "Em andamento"
    };
  }
  
  if (status === "Férias marcadas" || status === "Férias parcialmente vendidas") {
    return {
      level: "Informativo",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      dotColor: "bg-blue-500",
      label: "Marcadas"
    };
  }
  
  if (status === "Férias críticas") {
    return {
      level: "Crítico",
      color: "bg-red-50 text-red-700 border-red-200",
      dotColor: "bg-red-600",
      label: "Crítico"
    };
  }
  
  if (status === "Apto para férias") {
    return {
      level: "Atenção",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      dotColor: "bg-amber-500",
      label: "Apto (Sem marcar)"
    };
  }
  
  // "Não elegível" ou outros casos
  return {
    level: "Sem alerta",
    color: "bg-gray-50 text-gray-500 border-gray-200",
    dotColor: "bg-gray-400",
    label: "Não elegível"
  };
}

/**
 * Gera a recomendação automática de férias.
 */
export function gerarRecomendacaoFerias(funcionario: RhEmployee): string {
  const status = calcularStatusFerias(funcionario);
  const { totalMeses } = calcularTempoTrabalho(funcionario.dataAdmissao);
  
  if (totalMeses < 12) {
    return "Este instrutor ainda não possui tempo suficiente para marcar férias.";
  }
  
  if (status === "Férias críticas") {
    return "Estado crítico: este instrutor precisa marcar férias com urgência.";
  }
  
  if (status === "Apto para férias") {
    if (totalMeses >= 12 && totalMeses < 18) {
      return "Este instrutor já pode marcar férias. Recomenda-se solicitar a marcação de férias.";
    }
    return "Este instrutor já pode marcar férias.";
  }
  
  if (status === "Férias marcadas" || status === "Férias em andamento" || status === "Férias parcialmente vendidas") {
    let rec = "Férias já registradas. Acompanhar período programado.";
    if (funcionario.feriasVendidas || funcionario.diasVendidosFerias > 0) {
      rec += " Este instrutor vendeu parte das férias. Verifique a quantidade de dias restantes.";
    }
    return rec;
  }
  
  if (status === "Férias concluídas") {
    return "Férias concluídas com sucesso. Situação regular.";
  }
  
  return "Acompanhar elegibilidade de férias do instrutor.";
}

/**
 * Filtra a lista de funcionários com base nos filtros da aba de férias.
 */
export function filtrarFerias(funcionarios: RhEmployee[], filtros: VacationFilters): RhEmployee[] {
  return funcionarios.filter((emp) => {
    // Apenas ativos são elegíveis para férias ou avaliados no controle de férias
    if (emp.statusFuncionario !== "Ativo") return false;

    // 1. Nome / ID
    if (filtros.search.trim() !== "") {
      const q = filtros.search.toLowerCase();
      const matchNome = emp.nome?.toLowerCase().includes(q);
      const matchId = emp.idFuncionario?.toLowerCase().includes(q);
      if (!matchNome && !matchId) return false;
    }
    
    // 2. Zona
    if (filtros.zona && emp.zona !== filtros.zona) return false;
    
    // 3. Turno
    if (filtros.turno && emp.turno !== filtros.turno) return false;
    
    // 4. Idioma
    if (filtros.idioma) {
      const hasLang = emp.idiomas && emp.idiomas.some((l) => l.toLowerCase() === filtros.idioma.toLowerCase());
      if (!hasLang) return false;
    }
    
    // 5. Status de férias
    const status = calcularStatusFerias(emp);
    if (filtros.statusFerias && status !== filtros.statusFerias) return false;
    
    // 6. Período de admissão
    const { totalMeses } = calcularTempoTrabalho(emp.dataAdmissao);
    if (filtros.periodoAdmissao === "menos1ano" && totalMeses >= 12) return false;
    if (filtros.periodoAdmissao === "1ano" && totalMeses < 12) return false;
    if (filtros.periodoAdmissao === "1ano6meses" && totalMeses < 18) return false;
    
    // 7. Período de férias (este mês, próximo mês, próximos 3 meses)
    if (filtros.periodoFerias !== "all") {
      const hasVacationInPeriod = (emp.periodosFerias || []).some((p) => {
        // "esteMes" -> Julho de 2026
        // "proximoMes" -> Agosto de 2026
        // "proximos3meses" -> Julho, Agosto, Setembro de 2026
        const startYm = p.dataInicio.substring(0, 7);
        const endYm = p.dataFim.substring(0, 7);
        
        if (filtros.periodoFerias === "esteMes") {
          return startYm === getCurrentYearMonth() || endYm === getCurrentYearMonth();
        }
        if (filtros.periodoFerias === "proximoMes") {
          const nextM = getMonthOffset(1);
          return startYm === nextM || endYm === nextM;
        }
        if (filtros.periodoFerias === "proximos3meses") {
          const m0 = getCurrentYearMonth();
          const m1 = getMonthOffset(1);
          const m2 = getMonthOffset(2);
          return (
            startYm === m0 || startYm === m1 || startYm === m2 ||
            endYm === m0 || endYm === m1 || endYm === m2
          );
        }
        return false;
      });
      if (!hasVacationInPeriod) return false;
    }
    
    // 8. Somente críticos
    if (filtros.somenteCriticos && status !== "Férias críticas") return false;
    
    // 9. Somente aptos para férias
    if (filtros.somenteAptos && status !== "Apto para férias") return false;
    
    return true;
  });
}

