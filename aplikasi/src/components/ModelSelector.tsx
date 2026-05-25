/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { Cpu, Sparkles, Zap, Award, HelpCircle, AlertCircle } from "lucide-react";

export default function ModelSelector() {
  const { workspaceTabs, updateTabModel, updateTabSelectionMode } = useApp();
  const activeTab = workspaceTabs.find(t => t.isActive);

  if (!activeTab) return null;

  const modeOptions = [
    { id: "manual", label: "Pilihan Manual", icon: Cpu, desc: "Menggunakan model yang Anda pilih secara manual." },
    { id: "fastest", label: "Otomatis Tercepat", icon: Zap, desc: "Mengalirkan prompt ke simpul dengan latensi jaringan terendah." },
    { id: "cheapest", label: "Otomatis Termurah", icon: Sparkles, desc: "Memaksa perutean ke templat dengan tarif token termurah ($/M token)." },
    { id: "best", label: "Kualitas Terbaik", icon: Award, desc: "Mengarahkan pertanyaan ke model logika paling cerdas dalam antrean fallback." },
    { id: "smart", label: "Saran Pintar", icon: AlertCircle, desc: "Menimbang tingkat kesulitan semantik prompt dan mencocokkan parameter ideal." }
  ] as const;

  const modelDefinitions = [
    { id: "gemini-3.5-flash", name: "Google Gemini 3.5 Flash", provider: "Gemini", costRate: "Murah ($0.075/M in)" },
    { id: "gemini-3.1-pro-preview", name: "Google Gemini 3.1 Pro (Preview)", provider: "Gemini", costRate: "Premium ($1.25/M in)" },
    { id: "gpt-4o", name: "OpenAI GPT-4o Standard", provider: "OpenAI", costRate: "Menengah ($2.50/M in)" },
    { id: "claude-3-5-sonnet", name: "Anthropic Claude 3.5 Sonnet", provider: "Claude", costRate: "Premium ($3.00/M in)" },
    { id: "deepseek-v3", name: "DeepSeek V3 Unified", provider: "OpenRouter", costRate: "Sangat Murah ($0.14/M in)" },
    { id: "local-llama-3", name: "Meta LLaMA 3 Core (Lokal)", provider: "Custom", costRate: "Gratis ($0.00)" }
  ];

  const handleModeChange = (mode: typeof modeOptions[number]['id']) => {
    updateTabSelectionMode(activeTab.id, mode);
    
    // Auto preset models based on intelligent criteria if they select a mode
    if (mode === 'cheapest') {
      updateTabModel(activeTab.id, "deepseek-v3");
    } else if (mode === 'fastest') {
      updateTabModel(activeTab.id, "gemini-3.5-flash");
    } else if (mode === 'best') {
      updateTabModel(activeTab.id, "gemini-3.1-pro-preview");
    } else if (mode === 'smart') {
      updateTabModel(activeTab.id, "gemini-3.5-flash"); // Flash is highly robust and universally recommended
    }
  };

  const currentModeInfo = modeOptions.find(o => o.id === activeTab.selectionMode) || modeOptions[0];

  return (
    <div className="bg-[#0C0C0E]/30 border border-slate-800/50 rounded p-4 space-y-3" id="model-selector-container">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Optimasi Perutean</span>
        <h3 className="text-xs font-semibold text-slate-300 font-sans">Konfigurasi Perutean Model</h3>
      </div>

      {/* Mode Grid Layout (Manual, Fastest, etc.) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5" id="model-selection-modes">
        {modeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = activeTab.selectionMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleModeChange(opt.id)}
              className={`p-2 rounded border text-left flex flex-col justify-between transition-all outline-none cursor-pointer ${
                isSelected 
                  ? "bg-indigo-950/25 border-indigo-500/30 text-slate-100" 
                  : "bg-[#0A0A0B] border-slate-800/50 hover:bg-[#0F0F11] text-slate-400"
              }`}
              title={opt.desc}
              id={`model-mode-btn-${opt.id}`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                <span className="text-[11px] font-medium tracking-wide">{opt.label}</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1.5 opacity-80 leading-none">
                {opt.id === 'manual' ? 'Override' : 'Smart API'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Specific Manual Model Picker (Only interactive if routing is in manual mode) */}
      <div className="pt-2 border-t border-slate-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-400 font-mono italic">
            {currentModeInfo.desc}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap font-sans">Target Aktif:</span>
          {activeTab.selectionMode === 'manual' ? (
            <select
              value={activeTab.modelSelection}
              onChange={(e) => updateTabModel(activeTab.id, e.target.value)}
              className="bg-[#0A0A0B] border border-slate-800/60 text-xs text-slate-300 rounded p-1 px-2.5 outline-none focus:border-indigo-500 cursor-pointer w-full md:w-56 font-mono"
              id="model-target-select"
            >
              {modelDefinitions.map((md) => (
                <option key={md.id} value={md.id}>
                  [{md.provider}] {md.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-[#0A0A0B] border border-slate-800/50 text-xs text-indigo-300 font-mono px-3 py-1 rounded w-full md:w-auto flex items-center justify-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Rute otomatis: {modelDefinitions.find(m => m.id === activeTab.modelSelection)?.name || activeTab.modelSelection}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
