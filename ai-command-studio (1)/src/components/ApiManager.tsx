/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { 
  Database, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Coins,
  Cpu,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  RefreshCw,
  Globe,
  Key
} from "lucide-react";
import { ApiProviderConfig, ApiProviderType } from "../types";

export default function ApiManager() {
  const { 
    apiConfigs, 
    setApiConfigs,
    moveApiPriority, 
    toggleApiProvider, 
    updateApiConfig,
    providerStatusSimulator,
    toggleProviderSimulator
  } = useApp();

  const [showMaskKey, setShowMaskKey] = useState<Record<string, boolean>>({});
  
  // New connection form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newProviderType, setNewProviderType] = useState<ApiProviderType>("gemini");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newTokensAvailable, setNewTokensAvailable] = useState("1000000");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const toggleMask = (id: string) => {
    setShowMaskKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const prioritizedList = useMemo(() => {
    return [...apiConfigs].sort((a, b) => a.priority - b.priority);
  }, [apiConfigs]);

  // Combined token economics metrics
  const tokenStats = useMemo(() => {
    let totalAvailable = 0;
    let totalUsed = 0;
    let activeNodes = 0;

    apiConfigs.forEach(c => {
      if (c.enabled) {
        totalAvailable += c.tokensAvailable || 0;
        activeNodes++;
      }
      totalUsed += c.tokensUsed || 0;
    });

    return {
      totalAvailable,
      totalUsed,
      activeNodes,
      grandTotal: totalAvailable + totalUsed,
      usagePercentage: (totalAvailable + totalUsed) > 0 
        ? Math.round((totalUsed / (totalAvailable + totalUsed)) * 100) 
        : 0
    };
  }, [apiConfigs]);

  // Adjust placeholder base URLs depending on selected provider
  const handleProviderSelectionChange = (type: ApiProviderType) => {
    setNewProviderType(type);
    if (type === "openrouter") {
      setNewBaseUrl("https://openrouter.ai/api/v1");
    } else if (type === "custom") {
      setNewBaseUrl("http://localhost:11434/v1");
    } else {
      setNewBaseUrl("");
    }
  };

  const handleAddNewApi = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newKeyName.trim()) {
      setFormError("Nama koneksi wajib diisi!");
      return;
    }

    const availableVal = parseInt(newTokensAvailable);
    if (isNaN(availableVal) || availableVal < 0) {
      setFormError("Jumlah token tersedia harus berupa angka positif!");
      return;
    }

    const newConfigId = `custom-api-${newProviderType}-${Date.now()}`;
    const newConfig: ApiProviderConfig = {
      id: newConfigId,
      name: newKeyName.trim(),
      provider: newProviderType,
      apiKey: newKeyValue,
      baseUrl: newBaseUrl.trim() ? newBaseUrl.trim() : undefined,
      priority: apiConfigs.length + 1,
      enabled: true,
      status: "active",
      tokensAvailable: availableVal,
      tokensUsed: 0
    };

    setApiConfigs(prev => [...prev, newConfig]);
    setFormSuccess(`Koneksi "${newKeyName}" berhasil didaftarkan ke kluster failover!`);
    
    // Reset values with delay
    setTimeout(() => {
      setNewKeyName("");
      setNewKeyValue("");
      setNewBaseUrl("");
      setNewTokensAvailable("1000000");
      setFormSuccess("");
      setIsFormOpen(false);
    }, 1500);
  };

  const deleteApiConfig = (id: string) => {
    setApiConfigs(prev => {
      const filtered = prev.filter(c => c.id !== id);
      // Re-sort priorities simple
      return filtered.map((c, i) => ({ ...c, priority: i + 1 }));
    });
  };

  const resetAllTokens = () => {
    setApiConfigs(prev => prev.map(c => ({
      ...c,
      tokensAvailable: 1000000,
      tokensUsed: 0
    })));
  };

  // Helper labels & styles
  const getProviderInfo = (type: ApiProviderType) => {
    switch (type) {
      case "gemini":
        return { label: "Google Gemini", badgeClass: "bg-indigo-950/40 border-indigo-505/30 text-indigo-400" };
      case "openai":
        return { label: "OpenAI GPT / ChatGPT", badgeClass: "bg-emerald-950/40 border-emerald-505/30 text-emerald-400" };
      case "claude":
        return { label: "Anthropic Claude", badgeClass: "bg-amber-950/40 border-amber-505/30 text-amber-400" };
      case "openrouter":
        return { label: "OpenRouter Unified", badgeClass: "bg-purple-950/40 border-purple-505/30 text-purple-400" };
      case "custom":
        return { label: "Custom / Local Endpoint", badgeClass: "bg-slate-800/40 border-slate-705/30 text-slate-350" };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none bg-transparent text-left scrollbar-none h-full" id="api-manager-canvas">
      
      {/* 1. Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/50 pb-4" id="api-manager-header">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-bold">Matriks Perutean Prioritas</span>
          <h2 className="text-sm font-semibold text-slate-200 font-sans flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Kelola Redundansi API & Dasbor Token</span>
          </h2>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetAllTokens}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer"
            title="Reset ulang jatah token semua provider ke 1M"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Jatah Token</span>
          </button>
          
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 border border-indigo-500/20 hover:bg-indigo-550 text-slate-100 font-medium text-xs transition-all cursor-pointer shadow shadow-indigo-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Koneksi API</span>
          </button>
        </div>
      </div>

      {/* 2. Global Token Economics Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="token-economics-widgets">
        {/* Total Available */}
        <div className="bg-[#0C0C0E]/40 border border-slate-800/50 p-4 rounded-lg flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Total Token Tersedia</span>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {tokenStats.totalAvailable.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400 font-sans block italic">Dari kluster node aktif</span>
          </div>
          <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/30 text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>

        {/* Total Consumed */}
        <div className="bg-[#0C0C0E]/40 border border-slate-800/50 p-4 rounded-lg flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Total Token Digunakan</span>
            <div className="text-lg font-bold font-mono text-indigo-400">
              {tokenStats.totalUsed.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400 font-sans block italic">Terkonsumsi sepanjang waktu</span>
          </div>
          <div className="p-2.5 rounded bg-indigo-950/20 border border-indigo-800/30 text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        {/* Global Consumption Ratio */}
        <div className="bg-[#0C0C0E]/40 border border-slate-800/50 p-4 rounded-lg flex flex-col justify-between md:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Rasio Konsumsi Token</span>
              <div className="text-slate-300 font-sans text-xs font-semibold">
                Sisa kuota: {((tokenStats.totalAvailable / (tokenStats.grandTotal || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-xs font-bold font-mono text-slate-400">
              {tokenStats.usagePercentage}% Terpakai
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900/45">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-550"
              style={{ width: `${tokenStats.usagePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. ADD NEW API CONFIG FORM - ACCORDION STYLE */}
      {isFormOpen && (
        <form 
          onSubmit={handleAddNewApi}
          className="bg-[#0C0C0E]/70 border border-indigo-500/25 p-5 rounded-lg space-y-4 shadow-xl select-text transition-all duration-300"
          id="add-api-key-form"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-250 font-sans">Registrasi Koneksi Kunci API Baru</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-sans font-medium">
              ⚠️ {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-sans font-medium">
              ✓ {formSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Connection Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-mono uppercase tracking-wider block font-bold">Nama Koneksi (Label)</label>
              <div className="relative">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Contoh: Kunci ChatGPT-4 Utama, Backup-Gemini"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-505 px-3 py-2 text-xs text-slate-200 rounded outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* Token Limit Initial */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-mono uppercase tracking-wider block font-bold">Kuota Token Awal Ter sedia</label>
              <input
                type="number"
                value={newTokensAvailable}
                onChange={(e) => setNewTokensAvailable(e.target.value)}
                placeholder="Default: 1000000"
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-505 px-3 py-2 text-xs text-slate-200 rounded outline-none font-mono"
                required
              />
            </div>

            {/* Provider Type Selection Buttons */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] text-slate-450 font-mono uppercase tracking-wider block font-bold">Pilih Jenis Provider API</label>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {(["gemini", "openai", "claude", "openrouter", "custom"] as ApiProviderType[]).map((type) => {
                  const info = getProviderInfo(type);
                  const isSelected = newProviderType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleProviderSelectionChange(type)}
                      className={`p-2.5 rounded border text-left transition-all outline-none cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? "bg-indigo-950/30 border-indigo-500/60 text-indigo-300 font-bold shadow-md shadow-indigo-950" 
                          : "bg-slate-950/70 border-slate-850 text-slate-400 hover:border-slate-800 hover:bg-slate-900"
                      }`}
                    >
                      <span className="text-[11px] block font-sans capitalize">{type}</span>
                      <span className="text-[8px] font-mono text-slate-500 font-semibold uppercase mt-1 leading-none">
                        {info.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key credential insertion */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-mono uppercase tracking-wider block font-bold">Kredensial API Key</label>
              <div className="relative flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 focus-within:border-indigo-505 rounded px-3">
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Ketik rahasia API Key Anda"
                  className="w-full bg-transparent border-none py-2 text-xs text-slate-200 outline-none font-mono select-text"
                />
              </div>
            </div>

            {/* Base URL (Optionally customizable) */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-mono uppercase tracking-wider block font-bold">Base URL Custom (Opsional)</label>
              <div className="relative flex items-center bg-slate-950 border border-slate-800 hover:border-slate-705 focus-within:border-indigo-505 rounded px-3">
                <input
                  type="text"
                  value={newBaseUrl}
                  onChange={(e) => setNewBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1 atau local endpoint"
                  className="w-full bg-transparent border-none py-2 text-xs text-slate-200 outline-none font-mono select-text"
                />
              </div>
            </div>

          </div>

          <div className="pt-2 border-t border-slate-850 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNewKeyName("");
                setNewKeyValue("");
                setNewBaseUrl("");
                setNewTokensAvailable("1000000");
                setIsFormOpen(false);
              }}
              className="px-4 py-2 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded text-xs text-slate-100 bg-indigo-600 hover:bg-indigo-500 font-semibold transition-all cursor-pointer shadow-md shadow-indigo-950/45"
            >
              Simpan Koneksi API Key
            </button>
          </div>
        </form>
          {/* 4. ACTIVE FAILOVER SIMULATOR PANEL */}
      <div className="bg-[#0C0C0E]/40 border border-slate-800/40 p-4 rounded-lg space-y-3" id="demo-failover-simulator-sandbox">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-indigo-300 font-sans">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-300">Panel Simulator Active Failover</h3>
          </div>
          <span className="text-[9px] text-slate-500 font-mono leading-relaxed">
            Simulasikan gangguan / pemadaman API dinamis untuk memvalidasi algoritma perpindahan redundansi otomatis secara real-time!
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2" id="simulators-grid">
          {prioritizedList.map((c) => {
            const isOutage = providerStatusSimulator[c.provider] === 'outage';
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (!c.enabled) return;
                  toggleProviderSimulator(c.provider);
                }}
                disabled={!c.enabled}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all outline-none cursor-pointer h-20 ${
                  !c.enabled
                    ? "bg-slate-950/20 border-slate-900/30 text-slate-600 cursor-not-allowed"
                    : isOutage 
                    ? "bg-red-950/20 border-red-500/30 text-slate-200 hover:bg-red-950/30"
                    : "bg-[#0A0A0B] border-slate-800/50 text-slate-400 hover:bg-[#0F0F11]"
                }`}
                id={`tester-sim-btn-${c.id}`}
                title={!c.enabled ? "Aktifkan provider dulu untuk menguji" : "Klik untuk mengubah status tiruan gangguan jaringan"}
              >
                <div className="text-[11px] font-sans font-semibold truncate leading-tight w-full">
                  {c.name}
                </div>
                
                <div className="mt-2.5 flex items-center justify-between text-[8px] font-mono w-full">
                  <span className={!c.enabled ? "text-slate-600" : isOutage ? "text-red-400 font-bold uppercase animate-pulse" : "text-emerald-400 uppercase font-bold"}>
                    {!c.enabled ? "Nonaktif" : isOutage ? "Ada Gangguan" : "Simpul Sehat"}
                  </span>
                  {c.enabled && (
                    <span className="text-[7px] bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-500 font-bold">
                      Klik Hub
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. API FALLBACK CHAINS & METERS TABLE */}
      <div className="space-y-3" id="api-configs-list">
        <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest block font-bold">
          Urutan Fallback Prioritas & Detail Status Klaster
        </span>

        <div className="space-y-3">
          {prioritizedList.map((c, index) => {
            const isVisible = showMaskKey[c.id];
            const pInfo = getProviderInfo(c.provider);
            const isCustom = c.id.startsWith("custom-api");
            
            // local token fractions
            const localAvailable = c.tokensAvailable || 0;
            const localUsed = c.tokensUsed || 0;
            const aggregateFraction = localAvailable + localUsed;
            const limitPercentage = aggregateFraction > 0 
              ? Math.max(0, Math.min(100, Math.round((localAvailable / aggregateFraction) * 100))) 
              : 100;

            return (
              <div 
                key={c.id}
                className={`bg-[#0C0C0E]/30 border ${
                  c.enabled ? "border-slate-800/60" : "border-slate-900/40 opacity-60"
                } p-4 rounded-lg flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 transition-all`}
                id={`api-item-box-${c.id}`}
              >
                
                {/* 1. Rank & swap controls & connection labels */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 font-mono font-bold">TINGKAT</span>
                    <span className="text-sm font-bold font-mono text-indigo-400">#0{index + 1}</span>
                  </div>

                  {/* Move Priority widgets */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveApiPriority(c.id, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded bg-[#0A0A0B] border border-slate-800/60 text-slate-500 hover:text-slate-350 disabled:opacity-30 disabled:cursor-not-allowed outline-none hover:bg-slate-900"
                      title="Naikkan Prioritas"
                      id={`priority-up-btn-${c.id}`}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveApiPriority(c.id, 'down')}
                      disabled={index === prioritizedList.length - 1}
                      className="p-1 rounded bg-[#0A0A0B] border border-slate-800/60 text-slate-500 hover:text-slate-350 disabled:opacity-30 disabled:cursor-not-allowed outline-none hover:bg-slate-900"
                      title="Turunkan Prioritas"
                      id={`priority-down-btn-${c.id}`}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Provider label metadata */}
                  <div className="flex flex-col text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 font-sans">{c.name}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-semibold border ${pInfo.badgeClass}`}>
                        {c.provider.toUpperCase()}
                      </span>
                    </div>
                    {c.baseUrl ? (
                      <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        <span>{c.baseUrl}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-mono italic">
                        Rute Server Teraman
                      </span>
                    )}
                  </div>
                </div></div>

                {/* 2. Dynamic Token Status Bar (The core visual element requested) */}
                <div className="flex-1 min-w-[150px] bg-slate-950/40 p-3 rounded-lg border border-slate-900/60 flex flex-col justify-between space-y-1.5 font-sans">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Coins className="w-3 h-3 text-emerald-400" />
                      <span>Sisa: {localAvailable.toLocaleString()} Tkn ({(limitPercentage)}%)</span>
                    </span>
                    <span className="text-slate-500">
                      Terpakai: {localUsed.toLocaleString()} Tkn
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        limitPercentage > 40 
                          ? "bg-emerald-500" 
                          : limitPercentage > 15 
                          ? "bg-amber-500" 
                          : "bg-red-500"
                      }`}
                      style={{ width: `${limitPercentage}%` }}
                    />
                  </div>
                </div>

                {/* 3. In-line key credentials modify entry */}
                <div className="flex items-center gap-2 max-w-xs shrink-0 bg-[#0A0A0B] border border-slate-805/70 px-3 py-1.5 rounded-md">
                  <Key className="w-3 h-3 text-slate-500 shrink-0" />
                  <input
                    type={isVisible ? "text" : "password"}
                    value={c.apiKey}
                    onChange={(e) => updateApiConfig(c.id, { apiKey: e.target.value })}
                    placeholder={c.provider === 'gemini' ? 'Menggunakan rahasia server default' : 'Masukkan API Key Anda'}
                    className="bg-transparent text-xs text-slate-300 outline-none w-28 font-mono select-text"
                  />
                  <button 
                    onClick={() => toggleMask(c.id)} 
                    className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                    id={`toggle-mask-btn-${c.id}`}
                  >
                    {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>

                {/* 4. State Toggles checkmark or Status indicators & Custom connection deletion */}
                <div className="flex items-center justify-end gap-3 shrink-0">
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[8px] text-slate-550 font-mono uppercase">Status</span>
                    <span className={`text-[9px] font-mono leading-none mt-1 uppercase ${
                      !c.enabled ? "text-slate-500 font-bold" :
                      c.status === 'active' ? "text-emerald-450 font-bold" :
                      c.status === 'warning' ? "text-amber-450 font-bold" : "text-red-450 font-bold"
                    }`}>
                      {c.enabled ? (c.status === 'active' ? "ONLINE" : c.status) : "OFFLINE"}
                    </span>
                  </div>

                  {/* Enabled toggle trigger */}
                  <button
                    onClick={() => toggleApiProvider(c.id)}
                    className="p-1 outline-none text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    id={`toggle-api-enabled-${c.id}`}
                    title={c.enabled ? "Nonaktifkan provider dari fallback chain" : "Aktifkan provider ke fallback chain"}
                  >
                    {c.enabled ? (
                      <ToggleRight className="w-7 h-7 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>

                  {/* Deletion action - always available to clean up or reset custom keys */}
                  {isCustom && (
                    <button
                      onClick={() => deleteApiConfig(c.id)}
                      className="p-1.5 rounded hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-transparent hover:border-slate-800 transition-all cursor-pointer outline-none shrink-0"
                      title="Hapus Koneksi API ini"
                      id={`delete-custom-key-${c.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
