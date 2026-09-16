/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { RhEmployee, AppSettings } from "../types/rh";

interface PendingEditorPanelProps {
  mode?: "create" | "edit";
  employee: RhEmployee | null;
  appSettings: AppSettings;
  onClose: () => void;
  onSave: (updated: RhEmployee) => Promise<void>;
}

export const PendingEditorPanel: React.FC<PendingEditorPanelProps> = ({
  mode = "edit",
  employee,
  appSettings,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<RhEmployee | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const popularLanguages = appSettings.idiomas;
  const cargosOptions = appSettings.cargos;
  const zonasOptions = appSettings.zonas;

  useEffect(() => {
    if (employee) {
      setFormData({ ...employee });
      setSuccess(false);
      setErrorMessage("");
    } else {
      setFormData(null);
    }
  }, [employee]);

  if (!employee || !formData) return null;

  const handleChange = (field: keyof RhEmployee, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleLanguageToggle = (lang: string) => {
    if (!formData) return;
    const currentList = formData.idiomas || [];
    let updated: string[];

    if (currentList.includes(lang)) {
      updated = currentList.filter((l) => l !== lang);
    } else {
      updated = [...currentList, lang];
    }
    handleChange("idiomas", updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validações básicas antes de prosseguir
    if (!formData.nome || formData.nome.trim() === "") {
      setErrorMessage("O nome do funcionário é um campo obrigatório.");
      return;
    }

    if (formData.dataAdmissao && formData.dataTerminoReal && formData.dataTerminoReal < formData.dataAdmissao) {
      setErrorMessage("A data de término não pode ser anterior à admissão.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...formData, nome: formData.nome.trim(), idFuncionario: formData.idFuncionario.trim() });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" aria-labelledby="editor-panel-title" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity"
        onClick={() => { if (!saving) onClose(); }}
      />

      {/* Flyout panel */}
      <div className="relative w-full max-w-xl bg-slate-50 h-full shadow-[0_0_45px_rgba(16,42,67,0.12)] flex flex-col z-10">
        {/* Header */}
        <div className="bg-white text-oxford px-6 py-5 flex items-center justify-between border-b border-sky-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-yinmn block mb-1">{mode === "create" ? "Diretório de funcionários" : "Qualidade cadastral"}</span>
            <h2 id="editor-panel-title" className="text-base font-extrabold tracking-tight text-oxford">
              {mode === "create" ? "Novo funcionário" : "Corrigir / Editar Cadastro"}
            </h2>
          </div>
          <button
            onClick={() => { if (!saving) onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-yinmn hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body / Form */}
        <form id="employee-editor-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Alertas */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span role="alert">{errorMessage}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span role="status">{mode === "create" ? "Funcionário cadastrado com sucesso!" : "Cadastro atualizado com sucesso!"}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Nome do funcionário */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford font-medium"
                placeholder="Ex: Carlos Augusto de Souza"
              />
            </div>

            {/* ID do funcionário */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                ID Funcional (Formato: CTM-AAAA-XXX)
              </label>
              <input
                type="text"
                value={formData.idFuncionario}
                onChange={(e) => handleChange("idFuncionario", e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford font-mono ${
                  !formData.idFuncionario ? "border-amber-300 bg-amber-50/30" : "border-sky-100"
                }`}
                placeholder="Ex: CTM-2024-009"
              />
              {!formData.idFuncionario && (
                <p className="text-[10px] text-amber-600 mt-1">ID ausente impede identificação em faturamento/RH.</p>
              )}
            </div>

            {/* Grid Cargo, Zona e Turno */}
            <div className="grid grid-cols-2 gap-4">
              {/* Cargo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Cargo</label>
                <select
                  value={formData.cargo}
                  onChange={(e) => handleChange("cargo", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-oxford font-medium"
                >
                  <option value="">Selecione o cargo</option>
                  {cargosOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Turno</label>
                <select
                  value={formData.turno}
                  onChange={(e) => handleChange("turno", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-oxford font-medium"
                >
                  <option value="">Selecione o turno</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>

              {/* Zona */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Zona de Atuação</label>
                <select
                  value={formData.zona}
                  onChange={(e) => handleChange("zona", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-oxford font-medium"
                >
                  <option value="">Selecione a zona</option>
                  {zonasOptions.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              {/* Status do funcionário */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Status</label>
                <select
                  value={formData.statusFuncionario}
                  onChange={(e) => handleChange("statusFuncionario", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn bg-white text-oxford font-medium"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="A começar">A começar</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>
            </div>

            {/* Vigência / Término */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Data de Admissão</label>
                <input
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => handleChange("dataAdmissao", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={formData.dataTerminoReal}
                  onChange={(e) => handleChange("dataTerminoReal", e.target.value)}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford ${
                    !formData.dataTerminoReal ? "border-red-300 bg-red-50/30" : "border-sky-100"
                  }`}
                />
                {!formData.dataTerminoReal && (
                  <p className="text-[10px] text-red-600 mt-1">Obrigatório para previsão de cobertura.</p>
                )}
              </div>
            </div>

            {/* E-mail e Zoom */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">E-mail Corporativo</label>
                <input
                  type="email"
                  value={formData.emailCorporativo}
                  onChange={(e) => handleChange("emailCorporativo", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford font-medium"
                  placeholder="Ex: funcionario@ctm.org.br"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Link da Sala Zoom</label>
                <input
                  type="url"
                  value={formData.linkZoom}
                  onChange={(e) => handleChange("linkZoom", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-yinmn/20 focus:border-yinmn text-oxford"
                  placeholder="Ex: https://zoom.us/j/..."
                />
              </div>
            </div>

            {/* Seleção de Idiomas */}
            <div className="p-4 bg-white rounded-xl border border-sky-100">
              <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500 mb-2.5">
                Idiomas Lecionados ({formData.idiomas?.length || 0})
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {popularLanguages.map((lang) => {
                  const isChecked = formData.idiomas?.includes(lang);
                  return (
                    <label
                      key={lang}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none ${
                        isChecked
                          ? "bg-sky-50 border-yinmn text-yinmn font-bold"
                          : "bg-white border-sky-100 text-slate-600 hover:bg-sky-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleLanguageToggle(lang)}
                        className="rounded border-gray-300 text-yinmn focus:ring-jordy h-3.5 w-3.5"
                      />
                      <span className="truncate">{lang}</span>
                    </label>
                  );
                })}
              </div>
              
              {(!formData.idiomas || formData.idiomas.length === 0) && (
                <p className="text-[10px] text-amber-600 mt-2.5 font-bold">⚠️ É necessário associar ao menos um idioma ao instrutor ativo.</p>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-sky-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => { if (!saving) onClose(); }}
            className="text-xs bg-white hover:bg-sky-50 text-slate-600 font-bold py-2.5 px-5 rounded-lg border border-sky-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            form="employee-editor-form"
            type="submit"
            disabled={saving || success}
            className="text-xs bg-yinmn hover:bg-oxford text-white font-extrabold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-yinmn/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Salvando..." : mode === "create" ? "Cadastrar funcionário" : "Salvar Alterações"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
