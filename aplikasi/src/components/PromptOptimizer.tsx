/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, Compass, CheckCircle2, Wand2 } from "lucide-react";

export default function PromptOptimizer() {
  const { workspaceTabs, optimizePromptText } = useApp();
  const activeTab = workspaceTabs.find(t => t.isActive);
  const [optimizeMode, setOptimizeMode] = useState<'creative' | 'balanced' | 'accurate' | 'coding' | 'research'>('balanced');
  const [successPing, setSuccessPing] = useState(false);

  if (!activeTab) return null;

  const modeDetails = {
    creative: { label: "Tulisan Kreatif", desc: "Menyuntikkan majas/metafora kaya, variasi kosakata, dan batasan narasi yang menarik." },
    balanced: { label: "Nada Seimbang", desc: "Memperkuat batasan instruksi dengan tetap mempertahankan gaya bahasa yang mengalir dan mudah dipahami." },
    accurate: { label: "Struktur Ketat", desc: "Menetapkan format analisis yang sangat ketat, batasan negatif, dan keluaran skema yang rapi." },
    coding: { label: "Arsitek Sistem", desc: "Menyusun ulang teks draf menjadi struktur kode program: modular, penanganan kasus khusus, dan parameter teknis." },
    research: { label: "Metode Akademik", desc: "Menghasilkan format tinjauan literatur secara komprehensif, penyusunan tesis, dan kerangka ilmiah yang logis." }
  };

  const handleOptimization = async () => {
    if (!activeTab.prompt.trim()) return;
    await optimizePromptText(activeTab.id, optimizeMode);
    
    // Quick visual ping
    setSuccessPing(true);
    setTimeout(() => setSuccessPing(false), 2500);
  };

  const isEditorEmpty = !activeTab.prompt.trim();

  return (
    <div className="bg-[#0C0C0E]/35 border border-slate-800/50 rounded p-4 space-y-3" id="prompt-optimizer-panel">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Rekayasa Prompt</span>
          <h3 className="text-xs font-semibold text-slate-300 font-sans flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sistem Optimasi Prompt AI</span>
          </h3>
        </div>
        
        {successPing && (
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded animate-pulse">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Teks Editor Telah Diganti</span>
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 font-sans max-w-xl italic">
        Pilih personifikasi optimasi kustom di bawah dan tekan tombol. Gemini akan merestrukturisasi draf prompt kasar Anda secara instan dan aman tanpa merusak esensi instruksi.
      </p>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Personas selection list */}
        <div className="flex flex-wrap gap-1.5" id="optimize-mode-row">
          {(Object.keys(modeDetails) as Array<keyof typeof modeDetails>).map((m) => {
            const isSelected = optimizeMode === m;
            return (
              <button
                key={m}
                onClick={() => setOptimizeMode(m)}
                className={`px-3 py-1.5 rounded border text-[11px] font-sans font-medium transition-all outline-none cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-950/40 text-indigo-300 border-indigo-500/35" 
                    : "bg-[#0A0A0B] border-slate-800/50 hover:bg-[#0F0F11] text-slate-400"
                }`}
                id={`opt-btn-${m}`}
              >
                {modeDetails[m].label}
              </button>
            );
          })}
        </div>

        {/* Action execution */}
        <button
          onClick={handleOptimization}
          disabled={isEditorEmpty || activeTab.isGenerating}
          className={`flex items-center justify-center gap-1.5 p-1.5 px-4 rounded text-xs font-sans font-semibold tracking-wide transition-all select-none ${
            isEditorEmpty || activeTab.isGenerating
              ? "bg-slate-900 border border-slate-900 text-slate-600 cursor-not-allowed"
              : "bg-indigo-650 hover:bg-indigo-600 text-slate-50 border border-indigo-500/30 font-semibold cursor-pointer shadow-sm"
          }`}
          title={isEditorEmpty ? "Tulis beberapa draf teks pada editor di atas untuk dioptimalkan" : "Sempurnakan draf instruksi aktif menggunakan model cerdas Gemini"}
          id="prompt-optimize-run-btn"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>{activeTab.isGenerating ? "Mengoptimalkan..." : "Optimalkan Prompt"}</span>
        </button>
      </div>

      {/* Mini desc of chosen active mode */}
      <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800/50 flex items-center gap-2" id="optimize-mode-descriptor">
        <Compass className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="text-[10px] font-mono text-slate-400">
          <strong>{modeDetails[optimizeMode].label}</strong>: {modeDetails[optimizeMode].desc}
        </span>
      </div>
    </div>
  );
}
