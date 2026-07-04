import { getToday, getMonthOffset } from "./dateUtils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VacationPeriod, Substitution } from "../types/rh";

export interface AbsenceItem {
  id: string; // Unique absence id (e.g. employeeId-index or sub-id)
  nome: string; // Employee name
  tipo: string; // "Férias" | "Doença" | "Treinamento" | "Viagem" | etc.
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}

export interface ValidadorRetorno {
  permitido: boolean;
  limiteAtingido: boolean;
  diasCriticos: string[];
  diasNoLimite: string[];
  maiorQuantidadeSimultanea: number;
  mensagem: string;
}

/**
 * Função para gerar todas as datas (YYYY-MM-DD) em um intervalo inclusive.
 */
export function gerarDatasNoIntervalo(dataInicio: string, dataFim: string): string[] {
  const datas: string[] = [];
  const start = new Date(dataInicio);
  const end = new Date(dataFim);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return datas;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    datas.push(`${yyyy}-${mm}-${dd}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
}

/**
 * MÓDULO 7 - Função obrigatória validarLimiteAusencias
 * Valida se uma nova ausência viola a regra operacional de no máximo 8 pessoas ausentes no mesmo período.
 */
export function validarLimiteAusencias(
  novaAusencia: { dataInicio: string; dataFim: string; nome: string; tipo: string },
  ausenciasExistentes: AbsenceItem[],
  limiteMaximo = 8
): ValidadorRetorno {
  const diasDaNova = gerarDatasNoIntervalo(novaAusencia.dataInicio, novaAusencia.dataFim);
  const diasCriticos: string[] = [];
  const diasNoLimite: string[] = [];
  let maiorQuantidadeSimultanea = 0;

  // Para cada dia da nova ausência, contamos as ausências existentes que cobrem esse dia
  diasDaNova.forEach((dia) => {
    let contagem = 0;
    ausenciasExistentes.forEach((existente) => {
      // Evitar contar a mesma pessoa se houver sobreposição interna ou duplicata
      if (existente.dataInicio <= dia && existente.dataFim >= dia) {
        contagem++;
      }
    });

    const totalComNova = contagem + 1;
    if (totalComNova > maiorQuantidadeSimultanea) {
      maiorQuantidadeSimultanea = totalComNova;
    }

    if (totalComNova > limiteMaximo) {
      diasCriticos.push(dia);
    } else if (totalComNova === limiteMaximo) {
      diasNoLimite.push(dia);
    }
  });

  const permitido = diasCriticos.length === 0;
  const limiteAtingido = diasNoLimite.length > 0 && permitido;

  let mensagem = "";
  if (!permitido) {
    mensagem = `Não é possível marcar este período. O limite de ${limiteMaximo} pessoas ausentes simultaneamente será ultrapassado nos dias: [${diasCriticos.map(d => d.split("-").reverse().join("/")).join(", ")}].`;
  } else if (limiteAtingido) {
    mensagem = `Atenção: este período atingirá o limite de ${limiteMaximo} pessoas ausentes simultaneamente.`;
  } else {
    mensagem = `Período disponível. Há no máximo ${maiorQuantidadeSimultanea} pessoas ausentes neste intervalo.`;
  }

  return {
    permitido,
    limiteAtingido,
    diasCriticos,
    diasNoLimite,
    maiorQuantidadeSimultanea,
    mensagem
  };
}

/**
 * Retorna o mapa de ausências por dia (como dicionário Record<dia, nomes[]>) dentro de uma janela operacional definida.
 */
export function calcularMapaOcupacaoDias(
  ausencias: AbsenceItem[],
  dataInicioJanela = getToday(),
  dataFimJanela = getMonthOffset(6) + "-31"
): Record<string, string[]> {
  const dias = gerarDatasNoIntervalo(dataInicioJanela, dataFimJanela);
  const mapa: Record<string, string[]> = {};

  dias.forEach((dia) => {
    const ausentes = ausencias.filter(
      (a) => a.dataInicio <= dia && a.dataFim >= dia
    );
    if (ausentes.length > 0) {
      mapa[dia] = ausentes.map((a) => a.nome);
    }
  });

  return mapa;
}
