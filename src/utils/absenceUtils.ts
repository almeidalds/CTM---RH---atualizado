/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { differenceInDays, addDays, isDateBetween, formatarDataBR, getToday, getMonthOffset } from "./dateUtils";
import { AbsenceItem } from "../types/rh"; // Use an appropriate interface

export interface AbsenceValidationResult {
  permitido: boolean;
  limiteAtingido: boolean;
  diasCriticos: string[];
  diasNoLimite: string[];
  maiorQuantidadeSimultanea: number;
  mensagem: string;
  detalhesPorDia: {
    data: string;
    quantidadeAtual: number;
    quantidadeComNovaAusencia: number;
    nomesAusentes: string[];
    situacao: "Disponível" | "Limite atingido" | "Bloqueado";
  }[];
}

export function validarLimiteAusencias(
  novaAusencia: { dataInicio: string; dataFim: string },
  ausenciasExistentes: { dataInicio: string; dataFim: string; nomeFuncionario?: string; nome?: string }[],
  limiteMaximo: number = 8
): AbsenceValidationResult {
  const { dataInicio, dataFim } = novaAusencia;
  
  if (!dataInicio || !dataFim || dataInicio > dataFim) {
    return {
      permitido: false,
      limiteAtingido: false,
      diasCriticos: [],
      diasNoLimite: [],
      maiorQuantidadeSimultanea: 0,
      mensagem: "Período inválido.",
      detalhesPorDia: []
    };
  }

  const diasTotais = differenceInDays(dataInicio, dataFim) + 1;
  const detalhesPorDia: AbsenceValidationResult["detalhesPorDia"] = [];
  
  let maiorQuantidadeSimultanea = 0;
  let temDiaBloqueado = false;
  let temDiaNoLimite = false;
  const diasCriticos: string[] = [];
  const diasNoLimite: string[] = [];

  for (let i = 0; i < diasTotais; i++) {
    const currentDate = addDays(dataInicio, i);
    
    // Find who is absent on this specific day
    const pessoasAusentesNoDia = ausenciasExistentes.filter(a => {
      return isDateBetween(currentDate, a.dataInicio, a.dataFim);
    });

    const nomesAusentes = pessoasAusentesNoDia.map(a => a.nomeFuncionario || a.nome || "Desconhecido");
    const quantidadeAtual = nomesAusentes.length;
    const quantidadeComNovaAusencia = quantidadeAtual + 1;
    
    if (quantidadeComNovaAusencia > maiorQuantidadeSimultanea) {
      maiorQuantidadeSimultanea = quantidadeComNovaAusencia;
    }

    let situacao: "Disponível" | "Limite atingido" | "Bloqueado" = "Disponível";
    
    if (quantidadeComNovaAusencia > limiteMaximo) {
      situacao = "Bloqueado";
      temDiaBloqueado = true;
      diasCriticos.push(currentDate);
    } else if (quantidadeComNovaAusencia === limiteMaximo) {
      situacao = "Limite atingido";
      temDiaNoLimite = true;
      diasNoLimite.push(currentDate);
    }

    detalhesPorDia.push({
      data: formatarDataBR(currentDate),
      quantidadeAtual,
      quantidadeComNovaAusencia,
      nomesAusentes,
      situacao
    });
  }

  const permitido = !temDiaBloqueado;
  let mensagem = "Período disponível para registro.";
  
  if (!permitido) {
    mensagem = `Bloqueado: O limite de ${limiteMaximo} ausências será ultrapassado em ${diasCriticos.length} dia(s).`;
  } else if (temDiaNoLimite) {
    mensagem = `Atenção: O limite máximo de ${limiteMaximo} pessoas será atingido em ${diasNoLimite.length} dia(s) neste período.`;
  }

  return {
    permitido,
    limiteAtingido: temDiaNoLimite,
    diasCriticos,
    diasNoLimite,
    maiorQuantidadeSimultanea,
    mensagem,
    detalhesPorDia
  };
}

export function gerarDatasNoIntervalo(dataInicio: string, dataFim: string): string[] {
  const diasTotais = differenceInDays(dataInicio, dataFim) + 1;
  const datas: string[] = [];
  for (let i = 0; i < diasTotais; i++) {
    datas.push(addDays(dataInicio, i));
  }
  return datas;
}

export function calcularMapaOcupacaoDias(
  ausencias: { dataInicio: string; dataFim: string; nome?: string; nomeFuncionario?: string }[],
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
      mapa[dia] = ausentes.map((a) => a.nome || a.nomeFuncionario || "Desconhecido");
    }
  });

  return mapa;
}
