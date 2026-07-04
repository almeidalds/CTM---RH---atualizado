import { Substitution } from "../types/rh";
import { obterSubstituicoes, salvarSubstituicoes } from "../services/additionalDataSource";

export const substitutionRepository = {
  getAll: (): Substitution[] => {
    return obterSubstituicoes();
  },
  
  getById: (id: string): Substitution | undefined => {
    return obterSubstituicoes().find(s => s.recordId === id);
  },

  create: (data: Omit<Substitution, "recordId">): Substitution => {
    const list = obterSubstituicoes();
    const newId = `sub-${Date.now()}`;
    const newSubst: Substitution = { ...data, recordId: newId };
    salvarSubstituicoes([...list, newSubst]);
    return newSubst;
  },

  update: (id: string, data: Partial<Substitution>): Substitution | null => {
    const list = obterSubstituicoes();
    const index = list.findIndex(s => s.recordId === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...data };
    salvarSubstituicoes(list);
    return list[index];
  },

  remove: (id: string): void => {
    const list = obterSubstituicoes();
    salvarSubstituicoes(list.filter(s => s.recordId !== id));
  }
};
