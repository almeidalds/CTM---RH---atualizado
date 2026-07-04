/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee } from "../types/rh";
import { identificarPendencias } from "./riskUtils";

export type DataQualityStats = {
  total: number;
  completos: number;
  comPendencia: number;
  semIdioma: number;
  semDataTermino: number;
  semZona: number;
  semTurno: number;
  semCargo: number;
  semEmail: number;
  percentualQualidade: number;
};

/**
 * Calcula estatísticas de qualidade dos dados para a lista de funcionários.
 */
export function calcularQualidadeDados(funcionarios: RhEmployee[]): DataQualityStats {
  const stats: DataQualityStats = {
    total: funcionarios.length,
    completos: 0,
    comPendencia: 0,
    semIdioma: 0,
    semDataTermino: 0,
    semZona: 0,
    semTurno: 0,
    semCargo: 0,
    semEmail: 0,
    percentualQualidade: 100,
  };

  if (funcionarios.length === 0) {
    return stats;
  }

  funcionarios.forEach((emp) => {
    const pendencias = identificarPendencias(emp);
    
    if (pendencias.length === 0) {
      stats.completos++;
    } else {
      stats.comPendencia++;
      
      const fields = pendencias.map((p) => p.field);
      if (fields.includes("idiomas")) stats.semIdioma++;
      if (fields.includes("dataTerminoReal")) stats.semDataTermino++;
      if (fields.includes("zona")) stats.semZona++;
      if (fields.includes("turno")) stats.semTurno++;
      if (fields.includes("cargo")) stats.semCargo++;
      if (fields.includes("emailCorporativo")) stats.semEmail++;
    }
  });

  stats.percentualQualidade = Math.round((stats.completos / stats.total) * 100);

  return stats;
}
