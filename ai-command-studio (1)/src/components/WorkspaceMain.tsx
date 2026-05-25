/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Play, 
  Plus, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  Terminal, 
  RefreshCw, 
  Clock, 
  Zap,
  Info 
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import PromptOptimizer from "./PromptOptimizer";

export default function WorkspaceMain() {
  const { 
    workspaceTabs, 
    addNewTab, 
    removeTab, 
    selectTab, 
    updateTabPrompt, 
    updateTabMode,
    clearTabHistory,
    promptTemplates,
    submitWorkspacePrompt,
    providerStatusSimulator,
  } = useApp();

  const activeTab = workspaceTabs.find(t => t.isActive);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest response elegantly
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.chatHistory?.length, activeTab?.isGenerating]);

  if (!activeTab) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleTemplateClick = (text: string) => {
    updateTabPrompt(activeTab.id, text);
    // Quick tip alert
    activeTab.autoSwitchLogs.push("Template injected into workbench editor.");
  };

  const activeOutages = Object.keys(providerStatusSimulator).filter(
    k => providerStatusSimulator[k] === 'outage'
  );

  return (
    <div className="flex-1 flex flex-col bg-transparent border-r border-slate-800/50 select-none overflow-hidden h-full" id="workspace-layout-main">
      {/* 1. SESSION TABS RAIL (Simulates Arc Browser/Raycast premium multi-tab session) */}
      <div className="bg-[#0A0A0B] px-3.5 py-2 flex items-center justify-between border-b border-slate-800/50 h-10 select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-4" id="workspace-tabs-strip">
          {workspaceTabs.map((t) => {
            const isTabActive = t.isActive;
            return (
              <div
                key={t.id}
                onClick={() => selectTab(t.id)}
                className={`group flex items-center gap-2 px-3 py-1 text-[11px] font-sans font-medium transition-all duration-200 cursor-pointer border rounded ${
                  isTabActive
                    ? "bg-slate-800/40 border-slate-800/60 text-slate-100"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                }`}
                id={`workspace-tab-item-${t.id}`}
              >
                {t.mode === 'chat' && <MessageSquare className="w-3 h-3 text-indigo-400" />}
                {t.mode === 'prompt' && <FileText className="w-3 h-3 text-indigo-400" />}
                {t.mode === 'command' && <Terminal className="w-3 h-3 text-emerald-400" />}
                
                <span className="max-w-[110px] truncate">{t.title}</span>
                
                {/* Close Tab btn if there is more than 1 tab */}
                {workspaceTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(t.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 transition-opacity animate-fade-in"
                    id={`close-tab-btn-${t.id}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => addNewTab("chat")}
            className="p-1 px-2 rounded bg-slate-900/60 border border-slate-800/50 text-slate-450 hover:text-slate-100 hover:bg-slate-900 flex items-center gap-1 leading-none text-[9px] uppercase font-mono"
            id="workspace-add-tab-btn"
          >
            <Plus className="w-2.5 h-2.5 text-indigo-400" />
            <span>Sesi Baru</span>
          </button>
        </div>

        {/* Workspace Operations toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => clearTabHistory(activeTab.id)}
            className="p-1 px-2.5 rounded-md text-[10px] font-mono text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 flex items-center gap-1.5 transition-all outline-none"
            title="Bersihkan log sesi"
            id="workspace-clear-log-btn"
          >
            <Trash2 className="w-3 h-3" />
            <span>Bersihkan Riwayat</span>
          </button>
        </div>
      </div>

      {/* OUTAGE ALERT SIMULATION ALERT BAR (Shows smart failover in action dynamically) */}
      {activeOutages.length > 0 && (
        <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs text-amber-300 select-none animate-pulse">
          <div className="flex items-center gap-2 font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong>Simulator Gangguan Terdeteksi</strong>: Bypass server {activeOutages.join(', ').toUpperCase()} aktif. Operasi failover akan bergeser ke simpul lain secara berurutan otomatis.
            </span>
          </div>
          <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-800 uppercase tracking-widest font-semibold font-mono">
            Sandbox Simulasi Aktif
          </span>
        </div>
      )}

      {/* 2. MAIN SPLIT INTERACTION CANVAS */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-none" id="workspace-canvas">
        
        {/* Workspace Mode selectors (Chat Mode, Prompt Mode, Command Mode) */}
        <div className="flex items-center gap-2 bg-[#0C0C0E]/40 p-1 rounded-lg border border-slate-800/50 max-w-sm" id="workspace-mode-selector-rail">
          {[
            { id: 'chat', label: 'Dialog Obrolan', icon: MessageSquare, desc: 'Tanggapan interaktif terpadu' },
            { id: 'prompt', label: 'Cetak Biru Prompt', icon: FileText, desc: 'Kerangka instruksi besar' },
            { id: 'command', label: 'Terminal Perintah', icon: Terminal, desc: 'Eksekusi kode/JSON simetris' }
          ].map((modeOpt) => {
            const Icon = modeOpt.icon;
            const isSelected = activeTab.mode === modeOpt.id;
            return (
              <button
                key={modeOpt.id}
                onClick={() => updateTabMode(activeTab.id, modeOpt.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-3 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-all duration-200 outline-none ${
                  isSelected 
                    ? "bg-slate-800/40 border border-slate-800/50 text-slate-100" 
                    : "border border-transparent text-slate-500 hover:text-slate-300"
                }`}
                title={modeOpt.desc}
                id={`workspace-mode-btn-${modeOpt.id}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                <span>{modeOpt.id}</span>
              </button>
            );
          })}
        </div>

        {/* 3. MULTI AI ROUTING INTEGRATION PANEL */}
        <ModelSelector />

        {/* 4. CHAT HISTORY DISPLAY MODULE */}
        <div className="flex-1 min-h-[180px] bg-[#0F0F11]/40 border border-slate-800/50 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none" ref={scrollRef}>
            {activeTab.chatHistory && activeTab.chatHistory.length > 0 ? (
              activeTab.chatHistory.map((item) => {
                const isAssistant = item.role === 'assistant';
                const isSystem = item.role === 'system';
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex flex-col space-y-1 max-w-[90%] ${
                      item.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'
                    }`}
                    id={`chat-msg-${item.id}`}
                  >
                    {/* Timestamp / Meta header */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span className="font-semibold text-slate-400">{item.role === 'user' ? 'Me (Client)' : 'Command Node'}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                      
                      {isAssistant && item.providerUsed && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-950/20 border border-indigo-500/20 px-1.5 rounded">
                            {item.providerUsed} [{item.modelUsed}]
                          </span>
                        </>
                      )}
                    </div>

                    {/* Speech box wrapper */}
                    <div className={`p-3 rounded-lg text-xs leading-relaxed font-sans select-text ${
                      item.role === 'user' 
                        ? 'bg-indigo-950/20 border border-indigo-500/20 text-slate-200'
                        : isSystem
                        ? 'bg-slate-900 border border-slate-850 text-indigo-300 italic'
                        : 'bg-[#0F0F11] border border-slate-800 text-slate-300'
                    }`}>
                      {/* Standard Render Helper */}
                      <div className="prose prose-invert prose-xs text-slate-300 max-w-none text-left">
                        {item.content.split("\n\n").map((chunk, cidx) => {
                          const isBulletList = chunk.trim().startsWith("* ") || chunk.trim().startsWith("- ");
                          if (isBulletList) {
                            return (
                              <ul key={cidx} className="list-disc pl-4 space-y-1.5 my-2">
                                {chunk.split("\n").map((li, lidx) => (
                                  <li key={lidx}>{li.replace(/^[\s*-]+/, "")}</li>
                                ))}
                              </ul>
                            );
                          }
                          return <p key={cidx} className="mb-2 last:mb-0 whitespace-pre-wrap">{chunk}</p>;
                        })}
                      </div>

                      {/* Display response metadata statistics inline if available */}
                      {isAssistant && item.tokens && (
                        <div className="mt-3.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
                          <span>Latency: <strong className="text-slate-400">{item.latencyMs}ms</strong></span>
                          <span>•</span>
                          <span>Tokens: <strong className="text-slate-400">{item.tokens.total}</strong></span>
                          <span>•</span>
                          <span>Est. Cost: <strong className="text-cyan-400">${item.tokens.cost.toFixed(6)}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyText(item.content, item.id)}
                      className="self-start text-[10px] text-slate-600 hover:text-slate-300 flex items-center gap-1 px-1 py-0.5 mt-0.5 transition-colors"
                      title="Copy response body"
                      id={`copy-msg-btn-${item.id}`}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 mt-6">
                <Terminal className="w-10 h-10 text-slate-700 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-400">Ruang Kerja Konsol Kosong</h4>
                  <p className="text-[11px] text-slate-600 max-w-sm italic">
                    Tulis beberapa instruksi di bawah ini, uji dengan kerangka pintas blueprint, atau gunakan optimalisasi prompt AI.
                  </p>
                </div>
              </div>
            )}

            {/* Simulated Live Generation Loader */}
            {activeTab.isGenerating && (
              <div className="flex flex-col space-y-2 items-start self-start mr-auto max-w-[85%] animate-pulse">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <span className="font-semibold text-slate-400">Klaster memproses perutean...</span>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-purple-400" />
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-slate-400 font-sans italic ml-1">Menghubungi simpul redundan aktif berikutnya...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
                {/* 5. QUICK FAST-FILL TEMPLATE CHIPS (Satisfies prompt catalog out of the box) */}
        {activeTab.prompt.length === 0 && (
          <div className="space-y-2 select-none" id="prompt-templates-catalog">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block font-bold">Templat Cetak Biru Isian Cepat</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {promptTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleTemplateClick(tpl.text)}
                  className="bg-slate-900/30 border border-slate-800/50 hover:border-indigo-500/30 p-2.5 rounded cursor-pointer hover:bg-slate-905/30 transition-all font-sans text-left space-y-1 group"
                  id={`temp-card-${tpl.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">{tpl.title}</span>
                    <span className="text-[8px] bg-[#0A0A0B] text-slate-500 border border-slate-800 rounded px-1.5 py-0.5 font-mono uppercase">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{tpl.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PROMPT REFACTORING / OPTIMIZER SECTION */}
        <PromptOptimizer />

        {/* 7. PRIMARY PROMPT EDITOR WORKBENCH */}
        <div className="bg-[#0A0A0B] border border-slate-800/60 rounded p-3 flex flex-col gap-2 relative shadow-lg shadow-black/80" id="prompt-workbench-box">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pb-1 border-b border-slate-800/40 pb-1.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Lembar Kerja Editor Prompt</span>
            </div>
            <span>Tekan Ctrl+Enter atau klik Jalankan Perintah</span>
          </div>

          <textarea
            value={activeTab.prompt}
            onChange={(e) => updateTabPrompt(activeTab.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitWorkspacePrompt(activeTab.id);
              }
            }}
            placeholder={
              activeTab.mode === 'chat'
                ? "Ajukan pertanyaan, buat rangkuman riset, atau minta pola desain perangkat lunak..."
                : activeTab.mode === 'prompt'
                ? "Masukkan templat instruksi besar di sini. Tambahkan kriteria, parameter, dan teks mentah..."
                : "Ketik perintah terminal, parameter pemetaan JSON, atau spesifikasi sintaks..."
            }
            className="w-full min-h-[90px] bg-transparent text-slate-200 text-xs font-sans outline-none resize-y border-none placeholder-slate-650 p-1 leading-relaxed select-text"
            rows={3}
            id="workspace-prompt-input"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                {activeTab.prompt.length} karakter
              </span>
            </div>

            <button
              onClick={() => submitWorkspacePrompt(activeTab.id)}
              disabled={!activeTab.prompt.trim() || activeTab.isGenerating}
              className={`flex items-center gap-1.5 text-xs font-sans font-semibold tracking-wide py-1.5 px-4 rounded shadow transition-all outline-none ${
                !activeTab.prompt.trim() || activeTab.isGenerating
                  ? "bg-slate-900 border border-slate-900 text-slate-600 cursor-not-allowed"
                  : "bg-indigo-650 hover:bg-indigo-600 text-slate-50 font-semibold cursor-pointer border border-indigo-500/30"
              }`}
              id="workspace-run-btn"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Jalankan Perintah</span>
            </button>
          </div>
        </div>  </div>
      </div>
    </div>
  );
}
