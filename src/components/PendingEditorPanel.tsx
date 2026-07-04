/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { RhEmployee } from "../types/rh";

interface PendingEditorPanelProps {
  employee: RhEmployee | null;
  onClose: () => void;
  onSave: (updated: RhEmployee) => Promise<void>;
}

export const PendingEditorPanel: React.FC<PendingEditorPanelProps> = ({
  employee,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<RhEmployee | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const popularLanguages = [
    "Inglês",
    "Espanhol",
    "Português para Estrangeiros",
    "Francês",
    "Japonês",
    "Italiano",
    "Mandarim",
    "Alemão",
    "Coreano"
  ];

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

    setSaving(true);
    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage("Erro ao salvar cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" aria-labelledby="editor-panel-title" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Flyout panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="bg-[#0D1B2F] text-white p-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight">
              Corrigir / Editar Cadastro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body / Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Alertas */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Cadastro atualizado com sucesso! Sincronizando...</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Nome do funcionário */}
            <div>
              <label className="block text-xs font-bold text-[#60708A] mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800 font-medium"
                placeholder="Ex: Carlos Augusto de Souza"
              />
            </div>

            {/* ID do funcionário */}
            <div>
              <label className="block text-xs font-bold text-[#60708A] mb-1.5">
                ID Funcional (Formato: CTM-AAAA-XXX)
              </label>
              <input
                type="text"
                value={formData.idFuncionario}
                onChange={(e) => handleChange("idFuncionario", e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800 font-mono ${
                  !formData.idFuncionario ? "border-amber-300 bg-amber-50/30" : "border-gray-200"
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
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">Cargo</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => handleChange("cargo", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800 font-medium"
                  placeholder="Ex: Instrutor de Espanhol"
                />
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">Turno</label>
                <select
                  value={formData.turno}
                  onChange={(e) => handleChange("turno", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy bg-white text-gray-800 font-medium"
                >
                  <option value="">Selecione o turno</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>

              {/* Zona */}
              <div>
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">Zona de Atuação</label>
                <select
                  value={formData.zona}
                  onChange={(e) => handleChange("zona", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy bg-white text-gray-800 font-medium"
                >
                  <option value="">Selecione a zona</option>
                  <option value="Zona Norte">Zona Norte</option>
                  <option value="Zona Sul">Zona Sul</option>
                  <option value="Zona Leste">Zona Leste</option>
                  <option value="Zona Oeste">Zona Oeste</option>
                  <option value="Administrativo">Administrativo</option>
                </select>
              </div>

              {/* Status do funcionário */}
              <div>
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">Status</label>
                <select
                  value={formData.statusFuncionario}
                  onChange={(e) => handleChange("statusFuncionario", e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy bg-white text-gray-800 font-medium"
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
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">Data de Admissão</label>
                <input
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => handleChange("dataAdmissao", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={formData.dataTerminoReal}
                  onChange={(e) => handleChange("dataTerminoReal", e.target.value)}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800 ${
                    !formData.dataTerminoReal ? "border-red-300 bg-red-50/30" : "border-gray-200"
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
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">E-mail Corporativo</label>
                <input
                  type="email"
                  value={formData.emailCorporativo}
                  onChange={(e) => handleChange("emailCorporativo", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800 font-medium"
                  placeholder="Ex: funcionario@ctm.org.br"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#60708A] mb-1.5">Link da Sala Zoom</label>
                <input
                  type="url"
                  value={formData.linkZoom}
                  onChange={(e) => handleChange("linkZoom", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jordy text-gray-800"
                  placeholder="Ex: https://zoom.us/j/..."
                />
              </div>
            </div>

            {/* Seleção de Idiomas */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-150">
              <label className="block text-xs font-black uppercase tracking-wider text-[#60708A] mb-2.5">
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
                          ? "bg-lavender/35 border-yinmn text-yinmn font-bold"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
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
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            type="submit"
            disabled={saving || success}
            className="text-xs bg-yinmn hover:bg-oxford text-white font-extrabold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-yinmn/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
