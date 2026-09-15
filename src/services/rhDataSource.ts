/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RhEmployee } from "../types/rh";
import { SAMPLE_EMPLOYEES } from "../data/sampleData";

const STORAGE_KEY = "ctm_rh_dashboard_data";

/**
 * Obtém a lista atualizada de funcionários (do localStorage ou dados iniciais).
 */
export function obterFuncionarios(): RhEmployee[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Erro ao ler dados do localStorage:", error);
  }
  
  // Se não houver dados, inicializa e salva
  salvarNoStorage(SAMPLE_EMPLOYEES);
  return SAMPLE_EMPLOYEES;
}

/**
 * Salva a lista de funcionários no localStorage.
 */
function salvarNoStorage(funcionarios: RhEmployee[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(funcionarios));
  } catch (error) {
    console.error("Erro ao salvar dados no localStorage:", error);
  }
}

/**
 * Atualiza ou insere as informações de um funcionário.
 * Simula uma chamada de API assíncrona para demonstrar estados de salvamento/carregamento.
 */
export function salvarEdicaoFuncionario(dados: RhEmployee): Promise<RhEmployee[]> {
  return new Promise((resolve) => {
    // Simula delay de rede de 600ms
    setTimeout(() => {
      const todos = obterFuncionarios();
      const index = todos.findIndex((e) => e.recordId === dados.recordId);
      
      if (index > -1) {
        todos[index] = { ...dados };
      } else {
        // Se for novo registro
        todos.push({
          ...dados,
          recordId: dados.recordId || `rec-${Date.now()}`
        });
      }
      
      salvarNoStorage(todos);
      resolve(todos);
    }, 600);
  });
}

/**
 * Reseta os dados para o estado inicial fictício.
 */
export function resetarDados(): RhEmployee[] {
  salvarNoStorage(SAMPLE_EMPLOYEES);
  return SAMPLE_EMPLOYEES;
}
