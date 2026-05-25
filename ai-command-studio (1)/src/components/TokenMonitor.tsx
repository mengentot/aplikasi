/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  ListFilter,
  RefreshCw,
  Coins,
  DollarSign
} from "lucide-react";

export default function TokenMonitor() {
  const { workspaceTabs, metrics, apiConfigs, providerStatusSimulator } = useApp();

  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem("ai_cmd_token_monitor_minimized") === "true";
  });

  const toggleMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      localStorage.setItem("ai_cmd_token_monitor_minimized", String(next));
      return next;
    });
  };

  const activeTab = workspaceTabs.find(t => t.isActive);

  // Compute stats based on the last logs
  const totalIn = metrics.reduce((acc, m) => acc + m.inputTokens, 0);
  const totalOut = metrics.reduce((acc, m) => acc + m.outputTokens, 0);
  const totalTokensCombined = totalIn + totalOut;
  const totalCost = metrics.reduce((acc, m) => acc + m.estimatedCost, 0);
  
  const successCount = metrics.filter(m => m.success).length;
  const totalCount = metrics.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  const averageLatency = metrics.length > 0 
    ? Math.round(metrics.reduce((acc, m) => acc + m.latencyMs, 0) / metrics.length) 
    : 0;

  // Resolve health condition color
  const outageCount = Object.values(providerStatusSimulator).filter(s => s === 'outage').length;
  const errorProvidersCount = apiConfigs.filter(c => c.enabled && c.status === 'error').length;
  
  let healthLabel = "Stabil";
  let healthColor = "text-emerald-400";
  let healthStatusIndicator = "bg-emerald-400";

  if (outageCount > 0 || errorProvidersCount > 0) {
    if (outageCount === apiConfigs.filter(c => c.enabled).length) {
      healthLabel = "Padam";
      healthColor = "text-red-400";
      healthStatusIndicator = "bg-red-500 animate-pulse";
    } else {
      healthLabel = "Terganggu";
      healthColor = "text-amber-400";
      healthStatusIndicator = "bg-amber-450 animate-pulse";
    }
  }

  // MINIMIZED VIEW REPRESENTATION
  if (isMinimized) {
    return (
      <aside 
        className="w-12 bg-[#0C0C0E] border-l border-slate-800/60 flex flex-col justify-between items-center py-4 shrink-0 transition-all duration-300 h-full select-none"
        id="token-monitor-hud-collapsed"
      >
        {/* Toggle Restore button */}
        <button
          onClick={toggleMinimize}
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-100 border border-slate-800 transition-all cursor-pointer outline-none"
          title="Buka Token Monitor"
          id="btn-restore-hud"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Rotated center label */}
        <div className="flex-1 flex flex-col items-center justify-center gap-12 select-none py-6">
          
          {/* Health Heartbeat indicator */}
          <div className="flex flex-col items-center gap-1" title={`Cluster health: ${healthLabel}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${healthStatusIndicator} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${healthStatusIndicator}`}></span>
            </span>
          </div>

          <div 
            onClick={toggleMinimize}
            className="-rotate-90 origin-center text-[10px] font-mono text-slate-400 font-bold tracking-widest whitespace-nowrap uppercase cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2"
            title={`Total Biaya: $${totalCost.toFixed(5)} USD | Klik untuk memperluas`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400 rotate-90 shrink-0" />
            <span>PENGELUARAN: ${totalCost.toFixed(4)}</span>
          </div>

          <div className="flex flex-col items-center gap-4 text-slate-500 mt-4">
            <Coins className="w-4 h-4 hover:text-emerald-400 cursor-pointer transition-colors" title={`Masuk: ${totalIn.toLocaleString()} token | Keluar: ${totalOut.toLocaleString()} token`} />
            <span className="text-[8px] font-mono leading-none">{(totalTokensCombined / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Micro stats */}
        <div className="flex flex-col items-center gap-2.5 pt-3 border-t border-slate-900/40 text-slate-600">
          <HelpCircle className="w-4 h-4" title="Monitor Klaster Siaga" />
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="w-64 bg-[#0C0C0E] border-l border-slate-800/50 flex flex-col justify-between overflow-y-auto scrollbar-none transition-all duration-300 shrink-0 h-full select-none" 
      id="token-monitor-hud"
    >
      {/* Top Section - Active Metrics Heading with minimize button */}
      <div className="p-4 border-b border-slate-800/50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Monitor Token</span>
          </h3>
          <button
            onClick={toggleMinimize}
            className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-slate-200 transition-all cursor-pointer outline-none"
            title="Sembunyikan Panel"
            id="btn-collapse-hud"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Total Expenditure card */}
        <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-900/60 hover:border-slate-800/80 transition-all">
          <div className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider block">TOTAL PENGELUARAN</div>
          <div className="text-lg font-mono text-slate-200 tracking-tight flex items-baseline gap-1">
            <span>${totalCost.toFixed(5)}</span>
            <span className="text-[9px] text-slate-550 underline uppercase">USD</span>
          </div>
        </div>

        {/* Dynamic Inputs / Outputs Grid */}
        <div className="grid grid-cols-2 gap-2" id="quick-stats-grid">
          <div className="p-2 bg-slate-950/40 rounded border border-slate-900/60 flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-wide">Token Masuk</span>
            <span className="text-xs font-mono text-indigo-400 mt-1 font-semibold">{(totalIn / 1000).toFixed(1)}k</span>
          </div>
          <div className="p-2 bg-slate-950/40 rounded border border-slate-900/60 flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-wide">Token Keluar</span>
            <span className="text-xs font-mono text-emerald-400 mt-1 font-semibold">{(totalOut / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      {/* Center Section - Provider Health Tracker */}
      <div className="p-4 border-b border-slate-800/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kesehatan Penyedia</h3>
          <div className={`text-[9px] font-mono font-bold uppercase ${healthColor}`}>
            {healthLabel}
          </div>
        </div>
        
        <div className="space-y-2">
          {apiConfigs.map((cfg) => {
            const isMockOutage = providerStatusSimulator[cfg.provider] === 'outage';
            const isEnabled = cfg.enabled;
            const latencyText = cfg.latency ? `${cfg.latency}ms` : '--';
            
            let statusColor = "text-emerald-450";
            let statusIndicator = "bg-emerald-450";
            let stateLabel = latencyText;

            if (!isEnabled) {
              statusColor = "text-slate-550";
              statusIndicator = "bg-slate-700/60 opacity-50";
              stateLabel = "Mati";
            } else if (isMockOutage) {
              statusColor = "text-amber-400 italic";
              statusIndicator = "bg-amber-400 animate-pulse";
              stateLabel = "Melewati...";
            } else if (cfg.status === 'error') {
              statusColor = "text-red-400";
              statusIndicator = "bg-red-500";
              stateLabel = "Error";
            }

            return (
              <div key={cfg.id} className="flex items-center justify-between text-xs font-sans">
                <span className="text-slate-500 font-medium truncate pr-2 max-w-[130px]">{cfg.name}</span>
                <span className={`flex items-center ${statusColor} font-mono shrink-0`} id={`hud-health-${cfg.provider}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusIndicator}`} />
                  <span className="text-[11px] font-bold">{stateLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section - Live Trace Logs */}
      <div className="flex-1 p-4 flex flex-col justify-between min-h-[150px] overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
          <span>Log Langsung</span>
          <span className="text-[8px] text-slate-500 font-mono">Aliran aktif</span>
        </h3>
        
        <div className="flex-1 bg-slate-950/60 rounded border border-slate-900/60 p-2.5 font-mono text-[9px] leading-relaxed overflow-y-auto text-slate-500 text-left h-28 scrollbar-none space-y-1">
          {activeTab && activeTab.autoSwitchLogs.length > 0 ? (
            activeTab.autoSwitchLogs.map((log, idx) => {
              const isError = log.includes("✗") || log.includes("ERROR") || log.includes("failed") || log.includes("Outage");
              const isSuccess = log.includes("✓") || log.includes("Success");
              const isWarn = log.includes("⚠️") || log.includes("TRIGGERING") || log.includes("Chain");
              
              const cleanLog = log.replace(/^[\s\W]+/, "");
              
              return (
                <div key={idx} className="truncate select-text">
                  <span className="text-slate-650 mr-1">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                  {isError ? (
                    <span className="text-red-400 font-medium">{cleanLog}</span>
                  ) : isSuccess ? (
                    <>
                      <span className="text-emerald-555 font-bold mr-1">OK</span>
                      <span className="text-slate-400">{cleanLog}</span>
                    </>
                  ) : isWarn ? (
                    <>
                      <span className="text-indigo-400 mr-1">INFO</span>
                      <span className="text-slate-400">{cleanLog}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">{log}</span>
                  )}
                </div>
              );
            })
          ) : (
            <>
              <div>[14:02:11] <span className="text-emerald-500">OK</span> Aliran data Gemini dimulai</div>
              <div>[14:02:14] <span className="text-indigo-400">INFO</span> Cache cocok: sistem_v1</div>
              <div>[14:02:15] <span className="text-slate-404">AUTO</span> Mengganti penyedia...</div>
              <div className="text-slate-600">[14:02:18] TIMEOUT openrouter</div>
              <div>[14:02:19] <span className="text-indigo-400">INFO</span> Failover: OpenAI GPT</div>
              <div>[14:02:22] <span className="text-emerald-500">OK</span> Sinkronisasi memori selesai</div>
              <div className="mt-2 text-indigo-400 animate-pulse">Menunggu aliran berikutnya...</div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
