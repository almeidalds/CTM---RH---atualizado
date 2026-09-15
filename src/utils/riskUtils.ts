/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee, RiskLevel, DataIssue } from "../types/rh";
import { calcularDiasRestantes } from "./dateUtils";

/**
 * Calcula o nível de risco de contrato de um funcionário.
 * 
 * Regra de risco:
 * - Sem data: Cadastro incompleto
 * - Se o funcionário estiver Encerrado: Sem risco
 * - 0 a 15 dias restantes: Crítico
 * - 16 a 30 dias restantes: Alto
 * - 31 a 60 dias restantes: Médio
 * - 61 a 180 dias restantes: Baixo
 * - Mais de 180 dias restantes ou sem saída futura: Sem risco
 */
export function calcularRisco(funcionario: RhEmployee): RiskLevel {
  if (funcionario.statusFuncionario === "Encerrado") {
    return "Sem risco";
  }

  if (!funcionario.dataTerminoReal || funcionario.dataTerminoReal.trim() === "") {
    return "Cadastro incompleto";
  }

  const dias = calcularDiasRestantes(funcionario.dataTerminoReal);
  if (dias === null) {
    return "Cadastro incompleto";
  }

  if (dias < 0) {
    return "Sem risco"; // Já passou do término, ou já foi encerrado
  }

  if (dias >= 0 && dias <= 15) {
    return "Crítico";
  } else if (dias >= 16 && dias <= 30) {
    return "Alto";
  } else if (dias >= 31 && dias <= 60) {
    return "Médio";
  } else if (dias >= 61 && dias <= 180) {
    return "Baixo";
  } else {
    return "Sem risco";
  }
}

/**
 * Identifica as pendências cadastrais de um funcionário.
 * Retorna uma lista de problemas cadastrais com suas respectivas gravidades.
 * 
 * Níveis de gravidade:
 * - Sem ID -> Crítica
 * - Sem data de término -> Crítica
 * - Sem idioma -> Alta
 * - Sem zona -> Alta
 * - Sem turno -> Alta
 * - Sem cargo -> Alta
 * - Sem status -> Alta
 * - Sem e-mail -> Média
 * - Sem link Zoom -> Baixa
 */
export function identificarPendencias(funcionario: RhEmployee): DataIssue[] {
  const pendencias: DataIssue[] = [];

  // Sem ID
  if (!funcionario.idFuncionario || funcionario.idFuncionario.trim() === "") {
    pendencias.push({
      field: "idFuncionario",
      label: "ID do funcionário ausente",
      severity: "Crítica"
    });
  }

  // Sem data de término
  if (!funcionario.dataTerminoReal || funcionario.dataTerminoReal.trim() === "") {
    pendencias.push({
      field: "dataTerminoReal",
      label: "Data de término ausente",
      severity: "Crítica"
    });
  }

  // Sem idioma
  if (!funcionario.idiomas || funcionario.idiomas.length === 0 || (funcionario.idiomas.length === 1 && funcionario.idiomas[0].trim() === "")) {
    pendencias.push({
      field: "idiomas",
      label: "Idioma não cadastrado",
      severity: "Alta"
    });
  }

  // Sem zona
  if (!funcionario.zona || funcionario.zona.trim() === "") {
    pendencias.push({
      field: "zona",
      label: "Zona de atuação ausente",
      severity: "Alta"
    });
  }

  // Sem turno
  if (!funcionario.turno || funcionario.turno.trim() === "") {
    pendencias.push({
      field: "turno",
      label: "Turno de trabalho ausente",
      severity: "Alta"
    });
  }

  // Sem cargo
  if (!funcionario.cargo || funcionario.cargo.trim() === "") {
    pendencias.push({
      field: "cargo",
      label: "Cargo não definido",
      severity: "Alta"
    });
  }

  // Sem status
  if (!funcionario.statusFuncionario || funcionario.statusFuncionario.trim() === "") {
    pendencias.push({
      field: "statusFuncionario",
      label: "Status de funcionário ausente",
      severity: "Alta"
    });
  }

  // Sem e-mail
  if (!funcionario.emailCorporativo || funcionario.emailCorporativo.trim() === "" || !funcionario.emailCorporativo.includes("@")) {
    pendencias.push({
      field: "emailCorporativo",
      label: "E-mail corporativo inválido ou ausente",
      severity: "Média"
    });
  }

  // Sem link Zoom
  if (!funcionario.linkZoom || funcionario.linkZoom.trim() === "" || !funcionario.linkZoom.startsWith("http")) {
    pendencias.push({
      field: "linkZoom",
      label: "Link do Zoom ausente ou inválido",
      severity: "Baixa"
    });
  }

  return pendencias;
}
