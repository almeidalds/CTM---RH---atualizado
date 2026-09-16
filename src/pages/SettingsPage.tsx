/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Save, Plus, Trash2, Settings, Type, MapPin, Briefcase, Check, X } from "lucide-react";
import { AppSettings } from "../types/rh";

interface SettingsPageProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [addingTo, setAddingTo] = useState<keyof AppSettings | null>(null);
  const [newValue, setNewValue] = useState("");

  const handleSaveAdd = () => {
    if (addingTo && newValue.trim()) {
      setLocalSettings((prev) => ({
        ...prev,
        [addingTo]: [...prev[addingTo], newValue.trim()],
      }));
    }
    setAddingTo(null);
    setNewValue("");
  };

  const handleCancelAdd = () => {
    setAddingTo(null);
    setNewValue("");
  };

  const handleRemoveItem = (field: keyof AppSettings, index: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  const renderList = (field: keyof AppSettings, title: string, icon: React.ReactNode) => {
    return (
      <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-yinmn font-extrabold text-sm">
            {icon}
            {title}
          </div>
          <button
            onClick={() => { setAddingTo(field); setNewValue(""); }}
            className="p-1.5 rounded-xl bg-sky-50 text-yinmn hover:bg-sky-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-2">
          {addingTo === field && (
            <div className="flex items-center gap-2 mb-3 bg-sky-50/50 p-2 rounded-xl border border-sky-100">
              <input 
                autoFocus
                type="text" 
                value={newValue} 
                onChange={e => setNewValue(e.target.value)} 
                onKeyDown={e => {
                   if (e.key === 'Enter') handleSaveAdd();
                   if (e.key === 'Escape') handleCancelAdd();
                }}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-sky-200 outline-none focus:border-jordy bg-white"
                placeholder="Novo item..."
              />
              <button onClick={handleSaveAdd} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleCancelAdd} className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {localSettings[field].map((item, index) => (
            <div key={`${field}-${index}`} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 group">
              <span className="text-xs font-semibold text-slate-700">{item}</span>
              <button
                onClick={() => handleRemoveItem(field, index)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {localSettings[field].length === 0 && addingTo !== field && (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
              Nenhum item cadastrado
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-4 lg:p-8 animate-fade-in pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1F1A2C] tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-yinmn" />
              Configurações
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Gerencie as opções de preenchimento para idiomas, cargos e zonas de atuação.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="bg-yinmn hover:bg-yinmn text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderList("idiomas", "Idiomas de Ensino", <Type className="w-4 h-4" />)}
          {renderList("cargos", "Cargos", <Briefcase className="w-4 h-4" />)}
          {renderList("zonas", "Zonas de Atuação", <MapPin className="w-4 h-4" />)}
        </div>
      </div>
    </div>
  );
};
