/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Sliders, 
  Check, 
  ShieldCheck, 
  Maximize2 
} from "lucide-react";

export default function SettingsPanel() {
  const { 
    apiConfigs, 
    setApiConfigs,
    theme, 
    setTheme, 
    autoSwitch, 
    setAutoSwitch, 
    retryCount, 
    setRetryCount, 
    timeoutSeconds, 
    setTimeoutSeconds,
    workspaceTabs,
    setWorkspaceTabs,
    metrics,
    clearMetrics,
    tokenSaverMode,
    setTokenSaverMode
  } = useApp();

  const [notif, setNotif] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  // --------------------------------------------------------------------------
  // Dynamic Configuration Backup (JSON export/import)
  // --------------------------------------------------------------------------
  const handleExportConfig = () => {
    const backupData = {
      apiConfigs,
      settings: {
        theme,
        autoSwitch,
        retryCount,
        timeoutSeconds
      },
      tabs: workspaceTabs,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_command_studio_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerNotif("Configuration backup JSON successful! Download launched.");
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") return;

        const imported = JSON.parse(text);
        if (imported.apiConfigs) setApiConfigs(imported.apiConfigs);
        if (imported.settings) {
          if (imported.settings.theme) setTheme(imported.settings.theme);
          if (typeof imported.settings.autoSwitch === 'boolean') setAutoSwitch(imported.settings.autoSwitch);
          if (typeof imported.settings.retryCount === 'number') setRetryCount(imported.settings.retryCount);
          if (typeof imported.settings.timeoutSeconds === 'number') setTimeoutSeconds(imported.settings.timeoutSeconds);
        }
        if (imported.tabs) setWorkspaceTabs(imported.tabs);

        triggerNotif("✓ Workspace backup imported and applied successfully!");
      } catch (err) {
        console.error(err);
        triggerNotif("ERROR: Failed to parse backup payload. Invalid schema.");
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRestoreDefaults = () => {
    if (window.confirm("Kembalikan seluruh konfigurasi Klaster ke opsi pabrik awal yang bersih? Ini akan me-reset prioritas API, kunci, dan lembar kerja.")) {
      localStorage.removeItem("ai_cmd_api_configs");
      localStorage.removeItem("ai_cmd_workspace_tabs");
      localStorage.removeItem("ai_cmd_metrics");
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none bg-transparent text-left scrollbar-none h-full" id="settings-panel-canvas">
      {/* 1. Header segment */}
      <div className="flex flex-col gap-0.5 border-b border-slate-800/50 pb-4" id="settings-header">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Konfigurasi Global & Backup</span>
        <h2 className="text-sm font-semibold text-slate-200 font-sans flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>Pengaturan Sistem & Cadangan Data</span>
        </h2>
      </div>

      {notif && (
        <div className="bg-[#0C0C0E]/90 border border-indigo-500/30 p-3 rounded flex items-center gap-2.5 text-xs text-indigo-300 font-sans antialiased animate-fade-in" id="settings-notif-toast">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{notif}</span>
        </div>
      )}

      {/* 2. OPTIMIZATION CONTROLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="settings-grid">
        {/* Card 1: Smart Failover parameters */}
        <div className="bg-[#0C0C0E]/30 border border-slate-800/50 p-5 rounded space-y-4">
          <div className="flex items-center gap-1.5 text-slate-350 border-b border-slate-800/30 pb-2.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold">Sistem Inti Smart Failover & Hemat Token</h3>
          </div>

          <div className="space-y-4">
            {/* Automatic switching toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-300">Gunakan Redundansi Otomatis</span>
                <span className="text-[10px] text-slate-500">Mengizinkan pengalihan otomatis jika endpoint utama mengalami masalah jaringan.</span>
              </div>
              <button
                onClick={() => setAutoSwitch(!autoSwitch)}
                className="w-12 h-6 rounded-full bg-[#0A0A0B] p-0.5 border border-slate-800/60 flex items-center transition-all duration-200 cursor-pointer text-left"
                id="settings-autoswitch-toggle"
              >
                <div className={`w-5 h-5 rounded transform transition-all duration-200 ${
                  autoSwitch ? "bg-indigo-500 translate-x-6" : "bg-slate-700 translate-x-0"
                }`} />
              </button>
            </div>

            {/* Retry attempts count */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Batas Jumlah Percobaan Hubung Ulang</span>
                <span className="text-indigo-400 font-mono font-bold">{retryCount} kali coba</span>
              </div>
              <p className="text-[10px] text-slate-500">Jumlah maksimal percobaan sambungan sebelum beralih ke simpul cadangan otomatis berikutnya.</p>
              <input
                type="range"
                min="0"
                max="5"
                value={retryCount}
                onChange={(e) => setRetryCount(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
                id="settings-retry-slider"
              />
            </div>

            {/* Timeouts slider value */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Batas Waktu Tunggu Aliran (Socket Timeout)</span>
                <span className="text-indigo-400 font-mono font-bold">{timeoutSeconds} detik</span>
              </div>
              <p className="text-[10px] text-slate-500">Waktu respon maksimal yang diperbolehkan sebelum menandai simpul mengalami gangguan.</p>
              <input
                type="range"
                min="3"
                max="30"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
                id="settings-timeout-slider"
              />
            </div>

            {/* Mode Hemat Token Toggle */}
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-800/40">
              <div className="flex flex-col text-left mr-4">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Mode Hemat Token Terpadu</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 py-0.5 rounded font-mono border border-emerald-500/20 uppercase tracking-widest font-bold">Direkomendasikan</span>
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Membatasi output maks, mempersingkat riwayat konteks obrolan, dan menginstruksikan AI untuk menjawab secara singkat, padat, dan hemat.
                </span>
              </div>
              <button
                onClick={() => setTokenSaverMode(!tokenSaverMode)}
                className="w-12 h-6 rounded-full bg-[#0A0A0B] p-0.5 border border-slate-800/60 flex items-center transition-all duration-200 cursor-pointer text-left shrink-0"
                id="settings-tokensaver-toggle"
              >
                <div className={`w-5 h-5 rounded transform transition-all duration-200 ${
                  tokenSaverMode ? "bg-emerald-500 translate-x-6" : "bg-slate-700 translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Aesthetic Settings */}
        <div className="bg-[#0C0C0E]/30 border border-slate-800/50 p-5 rounded space-y-4">
          <div className="flex items-center gap-1.5 text-slate-350 border-b border-slate-800/30 pb-2.5">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold">Tema Visual & Tampilan</h3>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block font-bold">Preset Tema Tampilan</span>
            
            <div className="grid grid-cols-3 gap-2" id="settings-theme-picks">
              {[
                { id: 'matte-dark', label: 'Dark Matte', desc: 'Profil hitam pekat redup' },
                { id: 'slate-grey', label: 'Slate Obsidian', desc: 'Abu-abu minimalis netral' },
                { id: 'glass-purple', label: 'Cyber Translucent', desc: 'Gaya neon ungu futuristik' }
              ].map((styleOpt) => {
                const isSelected = theme === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    onClick={() => setTheme(styleOpt.id as any)}
                    className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all outline-none cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-950/25 border-indigo-500/35 text-slate-100 font-semibold" 
                        : "bg-[#0A0A0B] border-slate-800/50 text-slate-400 hover:border-slate-800"
                    }`}
                    id={`theme-card-${styleOpt.id}`}
                  >
                    <span className="text-xs font-semibold font-sans">{styleOpt.label}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 opacity-80 leading-tight">
                      {styleOpt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#0A0A0B] p-3 rounded border border-slate-800/55 flex items-center gap-2.5 mt-2" id="desktop-feeling-caption">
              <ShieldCheck className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-[10px] text-slate-500 leading-normal font-sans">
                Rilis portabel desktop Windows mengonsolidasikan semua sumber daya paket secara lokal. Tampilan terakselerasi berkinerja tinggi tanpa lag GPU.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CLUSTER BACKUPS AND EXPORTS MODULE */}
      <div className="bg-[#0C0C0E]/30 border border-slate-800/50 rounded p-5 space-y-4" id="backups-sandbox-panel">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block font-bold">Penyimpanan & Recovery Cadangan</span>
          <h3 className="text-xs font-semibold text-slate-300 font-sans">Pencadangan & Pemulihan Sistem Klaster</h3>
        </div>

        <p className="text-[11px] text-slate-500 font-sans max-w-xl italic">
          Ekspor seluruh status klaster operasional Anda, skema urutan fallback, kunci API kustom, dan isi riwayat kerja ke dalam file backup JSON portabel yang bersih. Impor kembali kapan saja untuk pemulihan instan.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2" id="backups-buttons-row">
          {/* Export */}
          <button
            onClick={handleExportConfig}
            className="p-1 px-4 py-1.5 rounded bg-[#0A0A0B] border border-slate-800/55 text-xs font-semibold text-slate-350 hover:text-white hover:bg-[#0F0F11] flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            id="backup-export-btn"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ekspor Cadangan Klaster</span>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 px-4 py-1.5 rounded bg-[#0A0A0B] border border-slate-800/55 text-xs font-semibold text-slate-350 hover:text-white hover:bg-[#0F0F11] flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            id="backup-import-btn"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Impor Cadangan Klaster</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportConfig}
            accept=".json"
            className="hidden"
          />

          {/* Restore Defaults */}
          <button
            onClick={handleRestoreDefaults}
            className="p-1 px-4 py-1.5 rounded border border-red-500/20 text-xs font-semibold text-slate-450 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2 transition-all cursor-pointer ml-auto"
            id="backup-factory-reset-btn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Kembalikan Opsi Pabrik</span>
          </button>
        </div>
      </div>
    </div>
  );
}
